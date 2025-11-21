---
name: auth-http-api-cloudbase
description: Use when you need to implement CloudBase Auth v2 over raw HTTP endpoints (login/signup, tokens, user operations) from backends or scripts that are not using the Web or Node SDKs.
alwaysApply: false
---

## When to use this skill

Use this skill whenever you need to call **CloudBase Auth** via **raw HTTP APIs**, for example:

- Non-Node backends (Go, Python, Java, PHP, etc.)
- Integration tests or admin scripts that use curl or language HTTP clients
- Gateways or proxies that sit in front of CloudBase and manage tokens themselves

Do **not** use this skill for:

- Frontend Web login with `@cloudbase/js-sdk@2.x` (use **CloudBase Web Auth** skill)
- Node.js code that uses `@cloudbase/node-sdk` (use **CloudBase Node Auth** skill)
- Non-auth CloudBase features (database, storage, etc.)

## How to use this skill (for a coding agent)

1. **Clarify the scenario**
   - Confirm this code will call HTTP endpoints directly (not SDKs).
   - Ask for:
     - `env` – CloudBase environment ID
     - `clientId` / `clientSecret` – HTTP auth client credentials
   - Confirm whether the flow is login/sign-up, anonymous access, token management, or user operations.

2. **Set common variables once**
   - Use a shared set of shell variables for base URL and headers, then reuse them across scenarios.

3. **Pick a scenario from this file**
   - For login / sign-up, start with Scenarios 1–3.
   - For token lifecycle, use Scenarios 4–6.
   - For user info and profile changes, use Scenario 7.

4. **Never invent endpoints or fields**
   - Treat the URLs and JSON shapes in this file as canonical.
   - If you are unsure, consult the HTTP API docs under `/source-of-truth/auth/http-api/登录认证接口.info.mdx` and the specific `*.api.mdx` files.

## HTTP API basics

- **Base URL pattern**

  - `https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/...`

- **Common headers**

  - `x-device-id` – device or client identifier
  - `x-request-id` – unique request ID for tracing
  - `Authorization` – `Bearer <access_token>` for user endpoints
  - Or HTTP basic auth (`-u clientId:clientSecret`) for client-credential style endpoints

- **Reusable shell variables**

```bash
env="your-env-id"
deviceID="backend-service-1"
requestID="$(uuidgen || echo manual-request-id)"
clientId="your-client-id"
clientSecret="your-client-secret"
base="https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1"
```

## Core concepts (HTTP perspective)

- CloudBase Auth uses **JWT access tokens** plus **refresh tokens**.
- HTTP login/sign-up endpoints usually return both `access_token` and `refresh_token`.
- Most user-management endpoints require `Authorization: Bearer ${accessToken}`.
- Verification flows (SMS/email) use separate `verification` endpoints before sign-up.

## Scenarios (flat list)

### Scenario 1: Sign-in with username/password

```bash
curl "${base}/signin" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{"username":"test@example.com","password":"your password"}'
```

- Use when the user already has a username (phone/email/username) and password.
- Response includes `access_token`, `refresh_token`, and user info.

### Scenario 2: SMS sign-up with verification code

1. **Send verification code**

```bash
curl "${base}/verification" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{"phone_number":"+86 13800000000"}'
```

2. **Verify code**

```bash
curl "${base}/verification/verify" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{"verification_code":"000000","verification_id":"<from previous step>"}'
```

3. **Sign up**

```bash
curl "${base}/signup" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{
    "phone_number":"+86 13800000000",
    "verification_code":"000000",
    "verification_token":"<from verify>",
    "name":"手机用户",
    "password":"password",
    "username":"username"
  }'
```

- Use this pattern for SMS or email-based registration; adapt fields per docs.

### Scenario 3: Anonymous login

```bash
curl "${base}/signin-anonymously" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{}'
```

- Returns tokens for an **anonymous user** that you can later upgrade via sign-up.

### Scenario 4: Exchange refresh token for new access token

```bash
curl "${base}/token" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{"grant_type":"refresh_token","refresh_token":"<refresh_token>"}'
```

- Use when the frontend or another service sends you a refresh token and you need a fresh access token.

### Scenario 5: Introspect and validate a token

```bash
curl "${base}/token/introspect?token=${accessToken}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}"
```

- Use for backend validation of tokens before trusting them.
- Response indicates whether the token is active and may include claims.

### Scenario 6: Revoke a token (logout)

```bash
curl "${base}/revoke" \
  -X POST \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{"token":"${accessToken}"}'
```

- Call when logging a user out from the backend or on security events.

### Scenario 7: Basic user operations (me, update password, delete)

```bash
# Get current user
curl "${base}/user/me" \
  -H "Authorization: Bearer ${accessToken}"

# Change password
curl "${base}/user/password" \
  -X PATCH \
  -H "Authorization: Bearer ${accessToken}" \
  --data-raw '{"old_password":"old","new_password":"new"}'
```

- Other endpoints:
  - `DELETE ${base}/user/me` – delete current user.
  - `${base}/user/providers` plus bind/unbind APIs – manage third-party accounts.
- Always secure these operations and log only minimal necessary data.
