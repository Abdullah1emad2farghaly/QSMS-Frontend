import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig<D = any> {
    /** Do not attach the Authorization header (public endpoints). */
    skipAuth?: boolean;
    /** On 401, do not try refresh + retry (e.g. logout). */
    skipAuthRecovery?: boolean;
    /** Internal: this request is already the single retry after a token refresh. */
    authRetried?: boolean;
  }
}
