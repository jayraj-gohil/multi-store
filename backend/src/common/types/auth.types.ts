/**
 * Claims stored in the access token. Keep it minimal and non-sensitive —
 * JWTs are signed, not encrypted. Extend (e.g. `role`) once requirements define it.
 */
export interface JwtPayload {
  sub: string;
}

/** Shape of `request.user` after `app.authenticate` succeeds. */
export type AuthUser = JwtPayload;
