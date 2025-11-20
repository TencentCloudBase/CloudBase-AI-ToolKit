## Web login flows

This file provides complete Web SDK login flows for all supported CloudBase Auth methods.

Each flow assumes you have:

- `const app = cloudbase.init({ env: "your-env-id" });`
- `const auth = app.auth();`

### 1. Register with SMS or email verification, then log in

#### Send SMS verification code

```js
const phoneNumber = "+86 13800000000"; // include country code

const verification = await auth.getVerification({
  phone_number: phoneNumber,
});
```

#### Send email verification code

```js
const email = "test@example.com";

const verification = await auth.getVerification({
  email,
});
```

#### Verify code and sign up or sign in

```js
// User-entered code
const verificationCode = "000000";

// 1. Verify code
const verificationTokenRes = await auth.verify({
  verification_id: verification.verification_id,
  verification_code: verificationCode,
});

// 2. Register or sign in
if (verification.is_user) {
  // Existing user: sign in
  await auth.signIn({
    username: phoneNumber, // or email
    verification_token: verificationTokenRes.verification_token,
  });
} else {
  // New user: sign up (this also logs in)
  await auth.signUp({
    phone_number: phoneNumber,
    verification_code: verificationCode,
    verification_token: verificationTokenRes.verification_token,
    // optional
    name: "手机用户",
    password: "password",
    username: "username",
  });
}
```

### 2. Username/password login

Assumes the user has already been registered via verification and has a username/phone/email bound.

```js
const loginState = await auth.signIn({
  username: "your username", // phone, email, or username
  password: "your password",
});
```

### 3. SMS code login (one-step login)

```js
const phoneNum = "13800000000";

// 1. Send SMS code
const verificationInfo = await auth.getVerification({
  phone_number: `+86 ${phoneNum}`,
});

// 2. User fills in code
const verificationCode = "000000";

// 3. Sign in with SMS
await auth.signInWithSms({
  verificationInfo,
  verificationCode,
  phoneNum,
});
```

### 4. Email code login

```js
const email = "test@example.com";

// 1. Send email code
const verificationInfo = await auth.getVerification({ email });

// 2. User fills in code
const verificationCode = "000000";

// 3. Sign in with email code
await auth.signInWithEmail({
  verificationInfo,
  verificationCode,
  email,
});
```

### 5. Anonymous login and upgrade

#### Anonymous login

```js
await auth.signInAnonymously();
const loginScope = await auth.loginScope();
console.log(loginScope === "anonymous"); // true if anonymous
```

#### Upgrade anonymous user to formal account

```js
// 1. Anonymous login
await auth.signInAnonymously();

// 2. Get access token for the anonymous session
const { accessToken } = await auth.getAccessToken();

// 3. Register a formal user linked to this anonymous account
await auth.signUp({
  // other signup params (e.g. phone_number, verification_code, etc.)
  anonymous_token: accessToken,
});
```

### 6. WeChat login (Web, via WeChat Open Platform)

#### Step 1: Generate provider redirect URI

```js
const { uri } = await auth.genProviderRedirectUri({
  provider_id: "wx_open",          // WeChat Open Platform
  provider_redirect_uri: "...",    // your redirect URI
  state: "some_state",             // CSRF/state marker
  other_params: {},                // optional
});

// Redirect user to this URI for authorization
location.href = uri;
```

#### Step 2: Handle callback, get provider token

In your redirect handler:

```js
// From URL params
const provider_code = "code_from_query";

const { provider_token } = await auth.grantProviderToken({
  provider_id: "wx_open",
  provider_redirect_uri: "curpage", // URL the user was sent back to
  provider_code,
});
```

#### Step 3: Sign in with provider token

```js
await auth.signInWithProvider({
  provider_token,
});
```


