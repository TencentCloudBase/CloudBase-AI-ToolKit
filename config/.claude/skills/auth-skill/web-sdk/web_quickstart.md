## Web SDK quickstart for CloudBase Auth v2

This section summarizes how to use the Web SDK for authentication.

### Install and initialize the SDK

```bash
npm install --save @cloudbase/js-sdk
```

Basic initialization:

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id",
});

const auth = app.auth();
```

For web apps:

- Ensure your domain is added to the **安全来源列表** in the console (`安全域名`).
- Otherwise, requests may be treated as invalid origin.

### Opening login methods

Before calling login APIs, ensure the corresponding methods are enabled:

- Go to **云开发控制台 → 身份认证 → 登录方式**.
- Enable:
  - 匿名登录
  - 短信验证码登录
  - 邮箱验证码登录
  - 用户名密码登录
  - 微信开放平台登录
  - 自定义登录
  as needed.

Alternatively, you can manage login methods programmatically via Tencent Cloud SDKs:
- Use the `EditAuthConfig` API with parameters like `PhoneNumberLogin`, `AnonymousLogin`, `UsernameLogin` set to `TRUE` or `FALSE`.
- This is useful for infrastructure-as-code or automated environment setup.
- For most manual configuration, the console UI is simpler.

### Basic sign-in and sign-out

#### Sign in with username/password

```js
const loginState = await auth.signIn({
  username: "your username", // phone, email, or username
  password: "your password",
});
```

#### Sign out

```js
await auth.signOut();
```

### Getting the current user

```js
const app = cloudbase.init({ env: "your-env-id" });
const auth = app.auth();

// After you log in...
const user = auth.currentUser;       // sync
// or:
// const user = await auth.getCurrentUser(); // async

if (user) {
  const uid = user.uid;
  const name = user.name;
}
```

You can also update and refresh user profile fields using the `User` object and its methods (e.g. `update`, `refresh`), as exposed by the Web SDK.

### Where to go next

For specific flows, use:

- `web-sdk/web_login_flows.md` for detailed patterns (SMS, email, anonymous, WeChat, username/password).
- `web-sdk/captcha_and_rate_limits.md` for integrating captchas.
- `web-sdk/web_best_practices.md` for handling login state and avoiding redundant logins.


