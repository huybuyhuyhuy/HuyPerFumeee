# Authentication And User System

Phase 3 adds JWT access tokens, refresh token rotation, RBAC, profile management, address management, password reset tokens, email verification tokens, and brute-force protection around the existing Express API.

## Modules

- Auth routes/controllers: `src/routes/auth.js`, `src/controllers/authController.js`
- Auth service: `src/services/authService.js`
- User repository facade: `src/models/userModel.js`
- RBAC: `src/modules/auth/rbac.js`
- Refresh/reset/verification tokens: `src/modules/auth/token.repository.js`
- Login attempt tracking: `src/modules/auth/login-attempt.repository.js`
- Address repository: `src/modules/auth/address.repository.js`
- Auth middleware and guards: `src/middlewares/authMiddleware.js`, `src/middlewares/adminMiddleware.js`
- Auth rate limiter: `src/middlewares/rateLimitMiddleware.js`

## Token Contract

Login and register return both the legacy `token` field and the explicit `accessToken` field for React compatibility.

```json
{
  "user": {},
  "token": "jwt-access-token",
  "accessToken": "jwt-access-token",
  "refreshToken": "opaque-refresh-token",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "refreshExpiresAt": "2026-05-31T00:00:00.000Z",
  "permissions": []
}
```

Access tokens are JWTs with `tokenType: "access"` and role-derived permissions. Refresh tokens are opaque random values stored as SHA-256 hashes.

## Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `PUT /auth/profile`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/email-verification/request`
- `POST /auth/email-verification/verify`
- `POST /auth/social-login`
- `GET /auth/addresses`
- `POST /auth/addresses`
- `PUT /auth/addresses/:id`
- `DELETE /auth/addresses/:id`
- `PUT /auth/addresses/:id/default`

## Security Behavior

- Passwords are hashed with bcrypt and legacy MD5 hashes are upgraded after successful login.
- Refresh token rotation revokes the previous token and revokes the token family when reuse is detected.
- Password reset and email verification tokens are single-use and consumed under SQL row locks.
- Reset and verification tokens are exposed in responses only when `AUTH_EXPOSE_DEV_TOKENS=true`; production should keep this disabled and send tokens by email.
- Login failures are recorded and repeated failures lock the account temporarily when the migration columns exist.
- Auth-sensitive endpoints use an IP-based rate limiter.
- `USER`, `STAFF`, and `ADMIN` roles map to explicit permission sets. Admin routes require `admin:access`.

## Migration

Run `migrations/20260524_auth_user_system.sql` after the Phase 1 and Phase 2 migrations. Without the migration, the code falls back to in-process token stores for development, but production should use the database-backed tables.

## Social Login

The `social_accounts` table and API placeholder are ready. Provider token verification is intentionally not enabled until Google/Facebook/Apple client IDs and verification logic are configured.
