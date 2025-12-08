---
name: auth-web-cloudbase
description: Complete guide for CloudBase Auth v2 using Web SDK (@cloudbase/js-sdk@2.x) - all login flows, user management, captcha handling, and best practices in one file.
alwaysApply: false
---

## When to use this skill

Use this skill for **frontend Web authentication** in a CloudBase project, using the **new auth system (Auth v2)** and `@cloudbase/js-sdk@2.x`.

Use it when you need to:

- Design and implement login/sign-up flows in a browser app
- Integrate CloudBase identity (`uid`, tokens) with your own backend
- Manage sessions and user profiles on the frontend

**Default login method:** If not specified, assume **phone number + SMS verification code (passwordless)**.

**Do NOT use for:**

- Server-side auth (Node SDK)
- Direct HTTP API calls (use the **CloudBase HTTP Auth** skill at `skills/auth-http-api-skill`)
- Database or storage operations (use database/storage skills)

---

## How to use this skill (for a coding agent)

1. **Confirm CloudBase environment**
   - Ask the user for:
     - `env` – CloudBase environment ID
   - Always initialize the SDK in this pattern (update values only):

     ```js
     import cloudbase from "@cloudbase/js-sdk";

     const app = cloudbase.init({
       env: "xxxx-yyy",
     });

     const auth = app.auth();
     ```
   - CloudBase Web JS SDK **must be initialized synchronously**:
     - Always use top-level `import cloudbase from "@cloudbase/js-sdk";`
     - Do **not** use dynamic imports like `import("@cloudbase/js-sdk")` or async wrappers such as `initCloudBase()` with internal `initPromise`

2. **Check console configuration (do not assume it's done)**
   - **⚠️ MANDATORY: Always guide users to configure login methods in console**
   - **Console URL format:** `https://tcb.cloud.tencent.com/dev?envId={envId}#/identity/login-manage`
     - Replace `{envId}` with the actual CloudBase environment ID (e.g., `zirali-7gwqot6f31a0ab27`)
     - Example: `https://tcb.cloud.tencent.com/dev?envId=test-xxx#/identity/login-manage`
   - **Before implementing any login flow, you MUST:**
     1. Guide the user to open the console login management page using the URL above
     2. Confirm the required 登录方式 are enabled（短信 / 邮箱 / 用户名密码 / 微信开放平台 / 自定义登录）
     3. Confirm 短信/邮箱 模板已配置（if using SMS/email login）
     4. Confirm 当前 Web 域名已加入 **安全域名** （安全来源列表）
   - **If something is missing, explain clearly what the user must configure and provide the console URL.**

3. **Pick a scenario from this file**
   - For login / sign-up, start with **Scenario 1–8**.
   - For session & user info, use **Scenario 9–22**.
   - Never invent new auth flows; always adapt from an existing scenario.

4. **Follow CloudBase API shapes exactly**
   - Treat method names and parameter shapes in this file as canonical.
   - You may change variable names and UI, but **do not change API names or field names**.

5. **If you’re unsure about an API**
   - If an API is not documented there, **do not use or invent it**. Instead:
     - Use a documented Web SDK API, or
     - Ask the user to use a Node/HTTP skill for server-side or HTTP flows.

---

## Installation and initialization

```bash
npm install --save @cloudbase/js-sdk
```

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id", // CloudBase 环境 ID
});

const auth = app.auth();
```

**Initialization rules (Web, @cloudbase/js-sdk):**

- Always use **synchronous initialization** with the pattern above
- Do **not** lazy-load the SDK with `import("@cloudbase/js-sdk")`
- Do **not** wrap SDK initialization in async helpers such as `initCloudBase()` with internal `initPromise` caches
- Keep a single shared `app`/`auth` instance in your frontend app; reuse it instead of re-initializing
  

**⚠️ Important: Console Configuration Required**

**Before using any login method, you MUST configure it in the CloudBase console:**

1. **Open login management page:**
   - Console URL: `https://tcb.cloud.tencent.com/dev?envId={envId}#/identity/login-manage`
   - Replace `{envId}` with your actual CloudBase environment ID
   - Example: `https://tcb.cloud.tencent.com/dev?envId=zirali-7gwqot6f31a0ab27#/identity/login-manage`

2. **Enable required login methods:**
   - 匿名登录 (Anonymous login)
   - 短信验证码登录 (SMS verification code login)
   - 邮箱验证码登录 (Email verification code login)
   - 用户名密码登录 (Username/password login)
   - 微信开放平台登录 (WeChat Open Platform login)
   - 自定义登录 (Custom login)

3. **Configure SMS/Email templates** (if using SMS/email login):
   - Set up verification code templates in console

4. **Add Web domain to 安全来源列表 (Security Domain Whitelist):**
   - Go to: 云开发控制台 → 身份认证 → 登录方式 → 安全域名
   - Add your frontend domain (e.g., `https://your-app.com`, `http://localhost:3000`)

**⚠️ If login methods are not enabled or domain is not whitelisted, authentication will fail.**

---

## Core concepts

**User types:**

- Internal users (phone/email/username)
- External users (WeChat, etc.)
- Anonymous users (temporary, stable `uid`)

**Tokens:**

- `access_token` (JWT, 2 hours) – for API calls
- `refresh_token` (30 days) – auto-refreshed by SDK
- Login state persisted in localStorage for 30 days

---

## All login scenarios (flat list)

### Scenario 1: SMS login (passwordless, recommended default)

```js
// Collect user's phone number into variable `phoneNum` by providing a input UI

// Send SMS code
const verificationInfo = await auth.getVerification({
  phone_number: `+86 ${phoneNum}`,
});

// Collect user's phone number into variable `verificationCode` by providing a input UI 

// Sign in
await auth.signInWithSms({
  verificationInfo,
  verificationCode,
  phoneNum,
});

// Logged in
const user = await auth.getCurrentUser();
```

### Scenario 2: Email login (passwordless)

```js
const email = "test@example.com";

const verificationInfo = await auth.getVerification({ email });
const verificationCode = "000000";

await auth.signInWithEmail({
  verificationInfo,
  verificationCode,
  email,
});
```

### Scenario 3: Username/password login

```js
await auth.signIn({
  username: "your username", // phone, email, or username
  password: "your password",
});
```

### Scenario 4: Anonymous login

```js
await auth.signInAnonymously();

const loginScope = await auth.loginScope();
console.log(loginScope === "anonymous"); // true
```

### Scenario 5: Register new user (phone or email)

```js
const phoneNumber = "+86 13800000000";

// Send verification code
const verification = await auth.getVerification({ phone_number: phoneNumber });

// Verify code
const verificationCode = "000000";
const verificationTokenRes = await auth.verify({
  verification_id: verification.verification_id,
  verification_code: verificationCode,
});

// Check if user exists
if (verification.is_user) {
  // Existing user: sign in
  await auth.signIn({
    username: phoneNumber,
    verification_token: verificationTokenRes.verification_token,
  });
} else {
  // New user: sign up (also logs in)
  await auth.signUp({
    phone_number: phoneNumber,
    verification_code: verificationCode,
    verification_token: verificationTokenRes.verification_token,
    name: "手机用户",        // optional
    password: "password",    // optional
    username: "username",    // optional
  });
}
```

### Scenario 6: WeChat OAuth login (3 steps)

```js
// Step 1: Generate WeChat redirect URI
const { uri } = await auth.genProviderRedirectUri({
  provider_id: "wx_open",
  provider_redirect_uri: "https://your-app.com/callback",
  state: "random_state",
});
window.location.href = uri;

// Step 2: In callback handler, get provider token
const urlParams = new URLSearchParams(window.location.search);
const provider_code = urlParams.get('code');

const { provider_token } = await auth.grantProviderToken({
  provider_id: "wx_open",
  provider_redirect_uri: window.location.href,
  provider_code,
});

// Step 3: Sign in with provider token
await auth.signInWithProvider({ provider_token });
```

### Scenario 7: Custom login (your own identity system, signInWithCustomTicket)

**CloudBase flow（前后端配合）**

1. 后端（Node SDK）在验证完你自己用户系统后，使用 `app.auth().createTicket()` 生成自定义登录 ticket。
2. 前端通过 `auth.setCustomSignFunc(getTicketFn)` 告诉 Web SDK 如何异步获取 ticket。
3. 前端调用 `auth.signInWithCustomTicket()` 完成登录。

```js
// Backend (Node.js) 示例
// const cloudbase = require("@cloudbase/node-sdk");
// const app = cloudbase.init({ env: "your-env-id" });
// const ticket = await app.auth().createTicket("your-user-id", { refresh: 3600 * 1000 });
// res.json({ ticket });

// Frontend 示例
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "your-env-id",
});

const auth = app.auth();

// 定义获取自定义 ticket 的函数（从你的后端获取）
const getTicketFn = async () => {
  const res = await fetch("/api/get-custom-ticket");
  const data = await res.json();
  return data.ticket; // 后端返回的 ticket 字符串
};

// 告诉 Web SDK 如何获取自定义登录 ticket
await auth.setCustomSignFunc(getTicketFn);

// 使用自定义 ticket 登录
await auth.signInWithCustomTicket();
```

### Scenario 8: Upgrade anonymous user to registered

```js
// Already logged in anonymously
await auth.signInAnonymously();

// Get anonymous token
const { accessToken } = await auth.getAccessToken();

// Register with phone/email
const phoneNumber = "+86 13800000000";
const verification = await auth.getVerification({ phone_number: phoneNumber });
const verificationCode = "000000";
const verificationTokenRes = await auth.verify({
  verification_id: verification.verification_id,
  verification_code: verificationCode,
});

// Sign up with anonymous_token to link accounts
await auth.signUp({
  phone_number: phoneNumber,
  verification_code: verificationCode,
  verification_token: verificationTokenRes.verification_token,
  anonymous_token: accessToken,  // Links to anonymous account
});
```

### Scenario 9: Sign out

```js
await auth.signOut();
```

### Scenario 10: Get current user

```js
const user = await auth.getCurrentUser();

if (user) {
  console.log(user.uid, user.name, user.email, user.phone);
}
```

### Scenario 11: Update user profile (User.update)

```js
const user = await auth.getCurrentUser();

if (!user) {
  throw new Error("No current user. Please sign in before updating profile.");
}

await user.update({
  name: "New Name",
  gender: "FEMALE", // 仅限于 "MALE" | "FEMALE" | "UNKNOWN"
  picture: "https://example.com/avatar.jpg",
});
```

### Scenario 12: Update password while logged in (Auth.sudo + Auth.setPassword)

**CloudBase flow**

1. 用户已登录（可以通过 `await auth.getCurrentUser()` 获取到用户）。
2. 通过 `auth.sudo(...)` 获取 `sudo_token`：
   - 可以通过当前密码，或短信/邮箱验证码。
3. 调用 `auth.setPassword({ new_password, sudo_token })` 更新密码。

```js
// 1. 用户输入当前密码
const oldPassword = "user_current_password";

// 2. 获取 sudo_token
const sudoRes = await auth.sudo({
  password: oldPassword,
});
const sudoToken = sudoRes.sudo_token;

// 3. 设置新密码
await auth.setPassword({
  new_password: "new_password",
  sudo_token: sudoToken,
});
```

### Scenario 13: Reset password (forgot password)

```js
// Send verification code
const verification = await auth.getVerification({ email: "user@example.com" });

// Verify code
const verificationCode = "000000";
const verificationTokenRes = await auth.verify({
  verification_id: verification.verification_id,
  verification_code: verificationCode,
});

// Reset password
await auth.resetPassword({
  email: "user@example.com",
  new_password: "new_password",
  verification_token: verificationTokenRes.verification_token,
});
```

### Scenario 14: Link WeChat to existing account (Auth.bindWithProvider)

**CloudBase flow**

1. 用户已登录（可以通过 `await auth.getCurrentUser()` 获取到用户）。
2. 通过 `auth.genProviderRedirectUri` 获取微信授权地址并跳转。
3. 在回调页使用 `auth.grantProviderToken` 获取 `provider_token`。
4. 调用 `auth.bindWithProvider({ provider_token })` 将微信账号绑定到当前 CloudBase 账号。

```js
// 1. 在账号设置页点击“绑定微信”

// 生成微信授权地址
const { uri } = await auth.genProviderRedirectUri({
  provider_id: "wx_open",
  provider_redirect_uri: "https://your-app.com/bind-callback",
  state: "bind_wechat",
});

// 跳转到微信授权
window.location.href = uri;
```

在回调页：

```js
// 2. 微信回调页面
const urlParams = new URLSearchParams(window.location.search);
const provider_code = urlParams.get("code");

// 用 code 换取 provider_token
const { provider_token } = await auth.grantProviderToken({
  provider_id: "wx_open",
  provider_redirect_uri: window.location.href,
  provider_code,
});

// 3. 绑定微信到当前账号
await auth.bindWithProvider({
  provider_token,
});
```

---

### Scenario 15: List and unbind third-party providers

**CloudBase flow**

1. 使用 `auth.getProviders()` 获取当前用户已绑定的三方列表。
2. 使用 `auth.unbindProvider({ provider_id })` 解除绑定。

```js
// 获取绑定的三方账号列表
const providers = await auth.getProviders();
// providers: { id: string; name?: string; picture?: string; }[]

// 示例：解绑第一个 provider
if (providers.length > 0) {
  const first = providers[0];

  await auth.unbindProvider({
    provider_id: first.id,
  });
}
```

> 注：手机号/邮箱 绑定/解绑目前通过 HTTP 接口完成，本 Web SDK skill 不直接提供代码，请使用 HTTP Auth skill 或后端 Node SDK 来实现。

---

### Scenario 16: Delete current account (Auth.sudo + Auth.deleteMe)

**CloudBase flow**

1. 用户已登录。
2. 通过 `auth.sudo(...)` 获取 `sudo_token`（用密码或验证码）。
3. 使用 `auth.deleteMe({ sudo_token })` 删除当前账号。

```js
// 1. 让用户输入当前密码确认删除
const password = "user_current_password";

// 2. 获取 sudo_token
const sudoRes = await auth.sudo({ password });
const sudoToken = sudoRes.sudo_token;

// 3. 删除当前账号
await auth.deleteMe({
  sudo_token: sudoToken,
});

// 当前会话结束，用户已被删除
```

---

### Scenario 17: Listen for login state changes (Auth.onLoginStateChanged)

**CloudBase flow**

- 使用 `app.auth().onLoginStateChanged(callback)` 监听登录状态变化。
- 回调 `params.data.eventType` 可能为：`sign_in` / `sign_out` / `refresh_token_failed` 等。
- 注意：`onLoginStateChanged` **返回值为 `undefined`**，不会返回取消订阅函数或 Promise；不要把返回值当作清理句柄或去 `await` 它，只需要注册一次监听即可。

```js
app.auth().onLoginStateChanged((params) => {
  console.log(params);
  const { eventType } = params?.data || {};

  switch (eventType) {
    case "sign_in":
      // 登录成功
      break;
    case "sign_out":
      // 退出登录
      break;
    case "refresh_token_failed":
      // 刷新 token 失败，需要提示用户重新登录
      break;
    default:
      break;
  }
});
```

---

### Scenario 18: Get access token for backend verification

```js
const { accessToken, accessTokenExpire } = await auth.getAccessToken();

// 将 accessToken 通过 Authorization 头传给自有后端
await fetch("/api/protected", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

---

### Scenario 19: Refresh user data from server

```js
const user = await auth.getCurrentUser();

if (user) {
  await user.refresh();
  // user 对象现在包含最新的用户信息
  console.log(user.name, user.picture);
}
```

---

## Captcha handling

### When captcha is triggered

CloudBase 在出现异常频率或风控触发时，会对 **发送验证码 / 登录** 等操作返回 `CAPTCHA_REQUIRED` 错误码。

Web SDK 本身不会直接提供 `getCaptcha` / `verifyCaptcha` 方法，验证码图片/校验通常通过 **HTTP 接口** 完成（例如：`获取图片验证码.api.mdx`、`验证图片验证码.api.mdx`）。

在前端代码中，你应当：

1. 捕获 `CAPTCHA_REQUIRED` 错误。
2. 提示用户需要完成图形验证码。
3. 通过 HTTP Auth skill 或后端服务调用图形验证码相关接口，并在后续的 `getVerification` / 登录请求中附带后端返回的 `captcha_token` 等信息。

示例（仅展示 error flow，不展示 HTTP 细节）：

```js
try {
  await auth.getVerification({ phone_number: "+86 13800000000" });
} catch (error) {
  if (error.code === "CAPTCHA_REQUIRED") {
    // 提示用户需要完成图形验证码
    // 具体实现：调用 HTTP 接口获取验证码图片并校验，参考 HTTP Auth skill
    console.log("需要图形验证码，请调用 HTTP 验证码接口");
  }
}
```

### Rate limits（参考控制台配置）

- **验证码发送频率**：对同一手机号/邮箱、同一 IP 有频率限制。
- **登录失败次数**：连续密码错误会触发风控，需要稍后重试或走验证码流程。

---

## Error handling

### Common error codes

```js
try {
  await auth.signIn({ username: "user", password: "wrong" });
} catch (error) {
  console.error(error.code, error.message);

  // 常见错误码：
  // INVALID_CREDENTIALS - 用户名或密码错误
  // VERIFICATION_CODE_EXPIRED - 验证码过期
  // VERIFICATION_CODE_INVALID - 验证码错误
  // RATE_LIMIT_EXCEEDED - 触发频率限制
  // CAPTCHA_REQUIRED - 需要图形验证码
  // USER_NOT_FOUND - 用户不存在
  // USER_ALREADY_EXISTS - 用户已存在
}
```

---

## Best practices

### Security

1. **Always validate on server** - 前端只负责 UX，鉴权应在后端基于 `access_token` 完成。
2. **Use HTTPS only** - 生产环境必须使用 HTTPS（除 localhost 外）。
3. **Whitelist domains** - 将所有前端域名加入 控制台「安全域名」。
4. **Re-auth for sensitive ops** - 删除账号等操作前先调用 `auth.sudo` 重新校验身份。

### UX

1. **Check existing login** - 页面初始化时通过 `await auth.getCurrentUser()` 检查当前登录状态，避免重复登录。
2. **Handle session expiry** - 使用 `onLoginStateChanged` 监听 token 失效，提示用户重新登录。
3. **Show loading states** - 登录/注册按钮要有 loading 状态和防抖。
4. **Clear error messages** - 将错误码映射为用户可读的中文提示。
5. **SMS countdown** - 发送验证码按钮增加倒计时，避免重复点击。

### Performance

1. **SDK initialization** - Always use **synchronous initialization** with `import cloudbase from "@cloudbase/js-sdk"; const app = cloudbase.init({ env: "xxxx-yyy" });`, do **not** lazy-load SDK or wrap it in async helpers like `initCloudBase()`
2. **Cache user data** - 通过 `await auth.getCurrentUser()` 获取用户实例后调用 `user.refresh()`，避免重复请求。
3. **Batch operations** - 使用一次 `user.update()` 更新多个字段。

### Example: Login form with validation

```js
async function handleLogin(username, password) {
  if (!username || !password) {
    alert("请输入用户名和密码");
    return;
  }

  const btn = document.getElementById("login-btn");
  btn.disabled = true;

  try {
    await auth.signIn({ username, password });
    window.location.href = "/app";
  } catch (error) {
    const messages = {
      INVALID_CREDENTIALS: "用户名或密码错误",
      RATE_LIMIT_EXCEEDED: "请求过于频繁，请稍后再试",
    };
    alert(messages[error.code] || "登录失败，请重试");
  } finally {
    btn.disabled = false;
  }
}
```

### Example: SMS login with countdown（正确拆分“发送验证码”和“验证码登录”）

```js
let countdown = 0;
let lastVerificationInfo = null;

// Step 1: 只负责“发送验证码”
async function sendSmsCode(phoneNumber) {
  if (countdown > 0) {
    alert(`请等待 ${countdown} 秒后再试`);
    return;
  }

  try {
    lastVerificationInfo = await auth.getVerification({ phone_number: phoneNumber });

    countdown = 60;
    const timer = setInterval(() => {
      countdown--;
      updateButton();
      if (countdown === 0) clearInterval(timer);
    }, 1000);
  } catch (error) {
    alert("发送失败，请重试");
  }
}

// Step 2: 只负责“携带验证码登录”，不要再调用 getVerification
async function loginWithSms(phoneNumber, verificationCode) {
  if (!lastVerificationInfo) {
    alert("请先获取验证码");
    return;
  }

  try {
    await auth.signInWithSms({
      verificationInfo: lastVerificationInfo,
      verificationCode,
      phoneNum: phoneNumber,
    });
    // 登录成功，跳转或刷新页面
  } catch (error) {
    alert("登录失败，请重试");
  }
}

function updateButton() {
  const btn = document.getElementById("send-btn");
  btn.disabled = countdown > 0;
  btn.textContent = countdown > 0 ? `${countdown}秒后重试` : "发送验证码";
}
```

> ⚠️ 常见错误：把“发送验证码 + 验证码登录”一起封装成一个 `login()` 函数，然后在 UI 上先点一次获取验证码、再点一次登录。第二次点击时如果再次执行 `getVerification`，会刷新验证码或触发频率限制。**正确做法是第二步直接调用 `signInWithSms`，复用第一次返回的 `verificationInfo`。**

---

## Summary

This skill covers all CloudBase Web Auth scenarios in one file:

- **Login/user management scenarios** - flat-listed with complete code
- **Captcha handling** - 说明如何处理 `CAPTCHA_REQUIRED` 错误并交给 HTTP 层
- **Error handling** - 常见错误码和处理模式
- **Best practices** - 安全、UX、性能的实践示例

**Key principle:** 所有示例都基于 CloudBase 官方 Web SDK 接口，不自行发明 API。
