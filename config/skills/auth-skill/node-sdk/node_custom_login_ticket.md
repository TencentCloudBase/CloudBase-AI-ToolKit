## Node SDK custom login ticket issuance

This file explains how to implement the **custom login** flow with the Node SDK, using the `createTicket` API and the client-side custom ticket login.

### When to use custom login

Use custom login when:

- You already have your own user system (e.g. existing accounts in another service).
- You want each of your users to map to a CloudBase user without forcing them to re-register.
- You want to centralize authentication logic on your own backend.

Conceptually:

- Your backend creates a signed **ticket** for a given `customUserId`.
- The client uses that ticket to log into CloudBase.

### Step 1: Get custom login private key

In the console:

1. Go to **身份认证 → 登录方式**.
2. Enable **自定义登录**.
3. Download the **custom login private key** file (JSON).
4. Deploy this file securely to your server or Cloud Function, e.g. `/path/to/your/tcb_custom_login.json`.

Security notes:

- Treat this file like a secret.
- Rotating the key will invalidate previous keys after a grace period.

### Step 2: Issue tickets with Node SDK

Example Node code:

```ts
import cloudbase from "@cloudbase/node-sdk";

// 1. Initialize with custom login credentials
const app = cloudbase.init({
  env: "your-env-id",
  credentials: require("/path/to/your/tcb_custom_login.json"),
});

const auth = app.auth();

// 2. Your own user ID
const customUserId = "your-customUserId";

// 3. Create ticket
const ticket = auth.createTicket(customUserId, {
  // optional:
  refresh: 3600 * 1000, // refresh interval
  expire: 24 * 3600 * 1000, // ticket expiration
});

// 4. Return ticket to the client (e.g. via HTTP response)
return ticket;
```

Constraints for `customUserId` (from docs):

- 4–32 characters.
- Characters: letters, digits, and `_-#@(){}[]:.,<>+#~`.

### Step 3: Client-side custom login

On the client (Web SDK):

```ts
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({ env: "your-env-id" });
const auth = app.auth();

async function loginWithCustomTicket() {
  const loginState = auth.hasLoginState();
  if (!loginState) {
    // 1. Configure how to fetch ticket from your backend
    await auth.setCustomSignFunc(async () => {
      const ticket = "fetch-ticket-from-backend"; // e.g. via fetch()
      return ticket;
    });

    // 2. Sign in with custom ticket
    await auth.signInWithCustomTicket();
  }
}
```

### End-to-end flow summary

1. Your user authenticates with your own system.
2. Your backend (Node SDK) calls `createTicket(customUserId, options)` and returns the ticket.
3. Client calls `setCustomSignFunc` to obtain the ticket and `signInWithCustomTicket`.
4. CloudBase verifies the ticket, creates or reuses a CloudBase user mapped to `customUserId`.

This flow decouples your identity system from CloudBase while still giving full access to CloudBase Auth and user-linked resources.


