## HTTP login and token flows

This file summarizes typical flows using the HTTP APIs:

- Sign-in and sign-up.
- Anonymous login.
- Token grant/refresh/revoke.
- Basic user operations.

All endpoints use the base URL pattern:
- `https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/...`

### 1. Sign-in with username/password or phone/email

Use the **登录认证** endpoint (e.g. `auth-sign-in`):

Typical request (simplified Bash-style):

```bash
export env="your-env-id"
export deviceID="demo_device_5dh6nf"
export requestID="uuid-32-chars"

curl "https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/signin" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{"username": "test@example.com", "password": "your password"}'
```

Response:

- Typically includes `access_token`, `refresh_token`, and user info.

### 2. Sign-up with SMS/email verification

Flow:

1. **Send verification** – `verification` endpoint:

```bash
curl "https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/verification" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{"phone_number": "+86 13800000000"}'
```

2. **Verify code** – `verification/verify` endpoint:

```bash
curl "https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/verification/verify" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{"verification_code":"000000","verification_id":"verification_id"}'
```

3. **Sign up** – `signup` endpoint:

```bash
curl "https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/signup" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{
    "phone_number":"+86 13800000000",
    "verification_code":"000000",
    "verification_token":"token-from-verify",
    "name":"手机用户",
    "password":"password",
    "username":"username"
  }'
```

### 3. Anonymous login

Use `auth-sign-in-anonymously`:

```bash
curl "https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/signin-anonymously" \
  -X POST \
  -H "x-device-id: ${deviceID}" \
  -H "x-request-id: ${requestID}" \
  -u "${clientId}:${clientSecret}" \
  --data-raw '{}'
```

Response:

- Includes tokens describing an **anonymous** user.

Later, you can upgrade this user via sign-up with the anonymous token, similar to the Web flow.

### 4. Token grant, refresh, and revoke

#### Get or refresh CloudBase token (`auth-grant-token`)

Use when:

- Exchanging a refresh token for a new access token.
- Migrating between client credentials and end-user tokens.

Endpoint:

- `POST /auth/v1/token` (see `auth-grant-token.api.mdx`).

#### Revoke token (`auth-revoke`)

Use to invalidate a token:

- e.g. on logout or security events.

Endpoint:

- `POST /auth/v1/revoke`.

#### Introspect token (`auth-token-introspect`)

Use to validate token status:

- `GET /auth/v1/token/introspect?token=...`

Returns claims and validity information.

### 5. Basic user operations

Using the **用户管理** endpoints:

- `user-me` – get current user:

```bash
curl "https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/user/me" \
  -H "Authorization: Bearer ${accessToken}"
```

- `user-update-password` – change password:

```bash
curl "https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/user/password" \
  -X PATCH \
  -H "Authorization: Bearer ${accessToken}" \
  --data-raw '{"old_password":"old","new_password":"new"}'
```

- `user-edit-user-basic-info` – update profile fields.
- `user-delete-me` – delete current user.
- `user-providers` / bind / unbind – manage linked third-party providers.

Refer to the specific `.api.mdx` files for full request/response schemas.


