export type Role = 'ADMIN' | 'CUSTOMER';

/**
 * Claims stored in the access token. Keep it minimal and non-sensitive —
 * JWTs are signed, not encrypted.
 */
export interface JwtPayload {
  sub: string;
  role: Role;
}

/** Shape of `request.user` after `app.authenticate` succeeds. */
export type AuthUser = JwtPayload;
