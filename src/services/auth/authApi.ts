import { buildEndpointRequest } from '@/services/api/endpoints';
import { request, requestData } from '@/services/api';
import type {
  ActiveSessionsData,
  AuthSessionData,
  ChangePasswordRequest,
  LoginRequest,
  PasswordRecoveryRequestBody,
  PasswordRecoveryRequestData,
  PasswordRecoveryResetRequest,
  PasswordRecoveryVerifyData,
  PasswordRecoveryVerifyRequest,
  RefreshTokenRequest,
  SwitchRoleData,
  SwitchRoleRequest,
} from '@/types';

/** The 10 documented auth endpoints, one function each. No state handling here (see `authActions`). */
export const authApi = {
  login: (body: LoginRequest) => requestData<AuthSessionData>(buildEndpointRequest('login', { body })),

  refresh: (body: RefreshTokenRequest) =>
    requestData<AuthSessionData>(buildEndpointRequest('refreshTokens', { body })),

  /** UNVERIFIED contract. HTTP 204 (no body) is tolerated: `data` is then undefined. */
  switchRole: (body: SwitchRoleRequest) =>
    requestData<SwitchRoleData | undefined>(buildEndpointRequest('switchRole', { body })),

  /** No refresh/retry on 401: an already-dead session must not trap the user. */
  logout: () => request<void>({ ...buildEndpointRequest('logout', {}), skipAuthRecovery: true }),

  logoutAll: () => request<void>(buildEndpointRequest('logoutAll', {})),

  changePassword: (body: ChangePasswordRequest) =>
    request<void>(buildEndpointRequest('changePassword', { body })),

  listSessions: (signal?: AbortSignal) =>
    requestData<ActiveSessionsData>(buildEndpointRequest('listMyDevices', { signal })),

  revokeSession: (sessionId: string) =>
    request<void>(buildEndpointRequest('revokeMyDevice', { pathParams: { sessionId } })),

  requestPasswordRecovery: (body: PasswordRecoveryRequestBody) =>
    requestData<PasswordRecoveryRequestData>(buildEndpointRequest('requestPasswordRecovery', { body })),

  verifyPasswordRecoveryOtp: (body: PasswordRecoveryVerifyRequest) =>
    requestData<PasswordRecoveryVerifyData>(buildEndpointRequest('verifyPasswordRecoveryOtp', { body })),

  resetPassword: (body: PasswordRecoveryResetRequest) =>
    request<void>(buildEndpointRequest('resetPassword', { body })),
};
