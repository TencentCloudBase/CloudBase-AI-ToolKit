## Node SDK auth overview and user info

This file summarizes the key Node SDK auth capabilities:

- Getting user info in cloud functions / Node services.
- Querying end-user info by UID or login identifier.
- Reading client IP.

### Basic initialization

```ts
import tcb from "@cloudbase/node-sdk";

const app = tcb.init({ env: "your-env-id" });
const auth = app.auth();
```

### getUserInfo (cloud function context)

Use when your code runs inside a CloudBase **Node function** and you need the current caller’s IDs:

```ts
exports.main = async (event, context) => {
  const { openId, appId, uid, customUserId } = auth.getUserInfo();

  console.log(openId, appId, uid, customUserId);
};
```

Fields:

- `openId` / `appId` – WeChat-related identifiers (if applicable).
- `uid` – CloudBase user ID.
- `customUserId` – developer-defined ID, used with custom login.

### getEndUserInfo

Use when you want full CloudBase **end-user profile**:

```ts
const { userInfo, requestId } = await auth.getEndUserInfo("user-uid");
```

`userInfo` typically includes:

- `openId`, `appId`, `uid`, `customUserId`, `envName`
- `nickName`, `email`, `username`, `hasPassword`
- Location (`country`, `province`, `city`)
- `avatarUrl`, `qqMiniOpenId`, etc.

If you omit `uid`, the method can also read from environment variables (depending on context).

### queryUserInfo

Use when you need to find a user by **login identifier**:

```ts
const { userInfo } = await auth.queryUserInfo({
  platform: "PHONE" | "USERNAME" | "EMAIL" | "CUSTOM",
  platformId: "login-identifier",
  // uid optional; if provided, it takes precedence.
});
```

Examples:

- Find by phone:

```ts
await auth.queryUserInfo({
  platform: "PHONE",
  platformId: "+86 13800000000",
});
```

- Find by `customUserId`:

```ts
await auth.queryUserInfo({
  platform: "CUSTOM",
  platformId: "your-customUserId",
});
```

### getClientIP

When running inside a Node function and you need the caller IP:

```ts
const ip = auth.getClientIP();
console.log(ip);
```

### When to use Node SDK vs HTTP API

- Prefer Node SDK when:
  - Running inside CloudBase functions or Node services.
  - You want higher-level helpers for user lookup.
- Prefer HTTP APIs when:
  - Using non-Node languages.
  - Integrating with external systems that cannot easily use Node SDK.


