## Tokens, sessions, and v1 vs v2 differences

CloudBase Auth v2 uses a **dual token** model:

- Short-lived **access token** (`access_token`)
- Long-lived **refresh token** (`refresh_token`)

The Web/Node SDKs automatically manage these tokens for you; HTTP integrations need to manage them explicitly.

### Access token (v2)

- Format: **standard JWT**.
- Encryption/signature: asymmetric (e.g. `ES256` / `RS256` style).
- Public keys:
  - Exposed via `https://{{EnvID}}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/certs`
  - Replace `{{EnvID}}` with your actual environment ID.
- Supports **distributed verification**:
  - Any service with the public key can verify tokens without talking back to CloudBase.

Typical properties:

- Short lifetime (e.g. ~2 hours).
- Used as the bearer token to call CloudBase services.

### Refresh token

Refresh tokens:

- Are long-lived (e.g. ~30 days).
- Are used to get new access tokens.
- Are usually stored and rotated by the SDK.

Important behaviors:

- As long as the refresh token is valid, the SDK can silently refresh the access token.
- For anonymous users, refresh tokens can auto-renew to preserve long-term anonymous sessions.

### v1 vs v2 access tokens (for migration)

Key differences:

- **Format**
  - v2: standard JWT
  - v1: non-standard JWT string (often with environment-specific suffixes)
- **Signing**
  - v2: asymmetric; public keys rotate regularly
  - v1: symmetric per-environment key
- **Verification**
  - v2: supports distributed verification through public keys
  - v1: typically verified only by CloudBase itself

When building new systems, prefer **v2**. For migration:

- Be aware that token parsing and validation code must be updated.
- If you previously depended on v1’s specific string format, refactor to treat v2 as a standard JWT.

### Validating v2 access tokens in your backend

For backends that need to trust CloudBase tokens directly:

1. Choose a JWT library for your language (see `jwt.io`).
2. Fetch CloudBase public keys:
   - `https://{{EnvID}}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/certs`
3. Configure your verifier with:
   - The key set
   - Expected issuer (`iss`)
   - Expected audience (`aud`)
4. Verify:
   - Signature is valid
   - Token is not expired
   - Claims such as `user_id`, `user_type`, `project_id` meet your expectations

If signature and validity checks pass, you can trust the token as representing a CloudBase user.

### Login state persistence (Web SDK)

In the Web SDK v2:

- Only `local` storage mode is supported for login state.
- This means:
  - Login state persists across browser reloads.
  - It persists until the user explicitly signs out or you clear local data.

Implications:

- UX is smoother (fewer forced re-logins).
- You should **check for existing login state** on app startup to avoid redundant sign-in flows.


