## HTTP API overview for CloudBase Auth

This file summarizes the HTTP API docs:

- `登录认证接口.info.mdx`
- `sidebar.js` for auth-related routes.

### When to use HTTP APIs

Use HTTP auth APIs when:

- You are integrating from **non-Node** backends or services.
- You want to call auth from scripts (e.g. Bash, Python).
- You need fine-grained control over tokens and flows.

The HTTP APIs generally mirror the capabilities of:

- Web SDK (`auth.signIn`, `auth.signUp`, etc.).
- Node SDK (tokens, user info, etc.).

### API categories (from sidebar)

1. **登录认证**
   - `auth-sign-in` – sign in (username/password, phone, email, verification).
   - `auth-sign-in-anonymously` – anonymous login.
   - `auth-sign-up` – sign up.
   - `auth-reset-password` – reset password.
   - `auth-sign-out` – sign out.
   - `auth-client-credential` – get service-side token via client credentials.

2. **第三方登录认证**
   - `auth-gen-provider-redirect-uri` – get third-party auth redirect URL.
   - `auth-grant-provider-token` – exchange code for provider token.
   - `auth-sign-in-with-provider` – sign in with provider token.
   - `自定义登录` – custom login via HTTP.

3. **token管理**
   - `auth-grant-token` – get or refresh CloudBase token.
   - `auth-revoke` – revoke token.
   - `auth-token-introspect` – introspect/validate token.

4. **用户管理**
   - `user-sudo` – obtain temporary sudo token.
   - `user-me` – get current user info.
   - `user-delete-me` – delete current user.
   - `user-update-password` – change password.
   - `user-edit-user-basic-info` – update basic profile.
   - `user-bind-with-provider` – bind third-party account.
   - `user-un-bind-provider` – unbind third-party account.
   - `user-providers` – list bound providers.

5. **验证码**
   - `获取图片验证码` – get picture captcha.
   - `验证图片验证码` – verify picture captcha.
   - `发送短信、邮箱验证码` – send SMS/email verification code.
   - `验证短信、邮箱验证码` – verify SMS/email verification code.

### Base URL and common headers

From examples in the docs:

- Base URL pattern:
  - `https://${env}.ap-shanghai.tcb-api.tencentcloudapi.com/auth/v1/...`
- Common headers:
  - `x-device-id` – identify device (for some flows).
  - `x-request-id` – unique request ID for tracing.
  - `Authorization` or basic auth (`-u clientId:clientSecret`) depending on endpoint.

### Where to go next

- Use `http-api/http_login_and_token_flows.md` for concrete flows:
  - Sign-in/sign-up over HTTP.
  - Anonymous login.
  - Token grant/refresh/revoke.
  - Simple user operations.


