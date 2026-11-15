# QSMS Frontend — Foundation

React 18 + TypeScript (strict) + Vite. Foundation only: no business modules.

## Run
```bash
npm install
cp .env.example .env.local   # leave VITE_API_BASE_URL empty until the real URL is known
npm run dev
npm run build
npm test                     # unit + component (Vitest)
npx playwright install && npm run test:e2e
```

## Layout
Approved `src/` structure is preserved (app, services, hooks, store, utils, types, schemas,
components, pages with 7 groups, translation ar/en, styles, assets, tests). Additions:
`app/guards`, `services/api/{client,interceptors,endpoints}`, `components/feedback`, `pages/public`,
`styles/{tokens,themes}`, `assets/{images,icons,fonts}`.

## Authentication architecture
- **Tokens:** the access token lives **in memory only** (`store/authStore`). The refresh token and non-sensitive
  session metadata (user id/phone, roles, `mustChangePassword`) are persisted in `localStorage` under `qsms.session`
  (`services/auth/tokenStorage`) so a reload or a new tab can restore the session by refreshing at startup.
  Trade-off: any script running on the page can read localStorage (XSS), so it is **not** equivalent to an
  HttpOnly cookie. The backend returns tokens in JSON, so cookies are not an option. Mitigations: nothing is logged, tokens are never
  in URLs, passwords/OTPs/reset tokens are never persisted (recovery data is memory-only in `store/recoveryStore`), and the
  access token (the credential sent on every request) is short-lived and never written to storage.
- **Single-flight refresh:** on a 401 with `ACCESS_TOKEN_EXPIRED/INVALID` or `AUTHENTICATION_REQUIRED` the interceptor calls
  `refreshSession()`; concurrent callers share one request (`inflight`), a Web Lock (`qsms-token-refresh`) serializes tabs, tokens are
  replaced together, and each request is retried **once** (`authRetried`). A request sent with an older token than the current one is just
  retried. A definitive refusal (`REFRESH_TOKEN_*`, `ACCOUNT_INACTIVE`) ends only the local session; offline/5xx keeps it.
  `SESSION_REVOKED` ends the local session immediately. Other devices are never touched.
- **Cache hygiene:** ending a session clears `['auth', …]` queries; public reference data (countries, governorates, organizations) stays.
- **Routing:** `ProtectedRoute` (restoring → loader, anonymous → `/login` with `from`, forced password change → `/change-password`, then the access decider) and
  `GuestRoute` for sign-in/recovery. After login the user returns to `from`, otherwise to `POST_LOGIN_FALLBACK` (`/my-devices`) — change it once a dashboard exists.
- **Multi-device:** login never revokes other sessions (max 3, enforced by the backend); logout = this device; logout-all = all; change-password keeps this session;
  reset-password ends every session; revoking the current device ends the local session.

## Active role (session-based) and role landing pages
- The active role belongs to the **session**, not the account: `activeRole` is read from the login/refresh answer into `store/authStore`
  (memory) and mirrored only in this session's own stored blob as a fallback for a refresh answer that omits the field. A backend value always wins
  and nothing is stored per user. Signing out clears it.
- `utils/roles.ts`: `getAvailableRoles` (assigned roles that have a destination), `resolveActiveRole` (backend `activeRole` if assigned; the only role
  for single-role accounts; otherwise none) and `needsRoleSelection`. Roles the backend did not assign are never shown.
- Role pages need the **active** role: `guardedRoutes({ roles: [role] }, …)` is satisfied by the active role only (`authAccessDecider`). A user with several
  roles and none active is sent to `/select-role`; a user denied a role page is sent to their own landing page.
- Switching: `RoleSwitcher` (header/drawer) → `useSwitchRole` → `authActions.switchRole` → `POST /api/v1/auth/switch-role`. No request for the already-active
  role; no confirmation dialog; role-scoped queries (`queryKeys.role.scope(role, …)`) are cancelled and removed; other sessions/devices are never touched.
  **Put every role-dependent query under `queryKeys.role.scope(activeRole, …)`.**
- Temporary landing pages: `/main-admin`, `/organization-manager`, `/school-manager`, `/teacher`, `/parent` → `pages/roles/RoleLandingPage` (honest placeholder).
  Replace a role's page by editing `app/routes/roleHomes.ts` only.
- **UNVERIFIED contract:** the `activeRole` field and `POST /auth/switch-role` (request `{ role }`, response shape, error codes) come from the task description;
  no backend project or API documentation was available. All assumptions live in `types/auth.ts` (`SwitchRoleData`), `ENDPOINTS.switchRole` (`unverified: true`)
  and `authSession.applySwitchRoleResult`.

## Conventions
- Default language Arabic (RTL); English (LTR). Preferences persist in localStorage.
- **Mobile-first, responsive**: write base CSS for small screens and add `@media (min-width: …)` upward
  (`sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem, `2xl` 96rem; see `BREAKPOINTS`). Use logical properties
  (`inline-*`, `block-*`, `margin-inline`…) so RTL/LTR both work, `--touch-target` (44px) for controls, no
  hover-only interactions, fluid sizes (`minmax(min(100%, …), 1fr)`, `clamp()`), and `min-inline-size: 0` on flex/grid children.
- Layouts: `PublicLayout` (controls move into a `Drawer` below `md`) and `AppShellLayout` (sidebar from `lg`, drawer below; not routed yet).
- API: `VITE_API_BASE_URL` is the server origin without `/api/v1`; endpoint paths include the prefix.
  Use `request<T>()` / `requestData<T>()` from `@/services/api`; errors are always `ApiError` and keep
  `code`, `serverMessage`, `locale`, `requestId`, `status`, `fieldErrors`, `details`, `retryAfterSeconds`.
  Interceptors add `Accept-Language`, `X-Request-Id` and the Bearer token (`skipAuth: true` omits it).
- Contracts: `src/types` (envelopes, 15 endpoints' request/response types, error codes, roles) and
  `services/api/endpoints/registry.ts` (method, path, auth, errors, notes). Build a call with
  `buildEndpointRequest('login', { body })`. Types and registry follow the supplied OpenAPI contract; do not add undocumented fields.
- Auth plugs in via `services/auth/authBridge.ts` (token provider, unauthorized and password-change-required handlers).
  Access decisions plug in via `app/guards/accessControl.ts` (`setAccessDecider`, deny by default); compose
  guarded groups with `guardedRoutes({ roles, permissions }, routes)` in `app/routes/routes.tsx`.
- Server state: TanStack Query (`services/query`). Client state: Zustand stores in `store/` (preferences, UI).
- Forms: `useZodForm(schema)` + `applyApiFieldErrors(error, form.setError)`.
- Error text: `getApiErrorMessage(error)` (local `errors:codes.<CODE>` → backend message → kind fallback).
- Pages are lazy: default export + entry in `app/routes/routes.tsx`. UI text lives in `translation/{ar,en}`.
- Tests: `src/tests/{unit,components,e2e}`. The e2e suite checks horizontal overflow at 320–1920px in RTL/LTR and light/dark.
- CORS note: for the browser to read `X-Request-Id` / `Retry-After` / `Content-Language` cross-origin, the backend must expose them
  (`Access-Control-Expose-Headers`) and allow the `Accept-Language` / `X-Request-Id` request headers.
"# QSMS-Frontend" 
