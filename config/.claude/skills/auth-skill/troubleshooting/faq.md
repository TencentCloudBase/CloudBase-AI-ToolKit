## Auth FAQ and troubleshooting

This file provides answers to common CloudBase Auth questions and troubleshooting guidance.

### Q1: What’s the difference between anonymous login and “not logged in”?

From the user’s perspective:

- Both feel like “no registration required”.
- With **anonymous login**, the user still has a persistent identity on the same device.

From the developer’s perspective:

- Anonymous login:
  - Creates a valid CloudBase user with a `uid`.
  - You can store private database/storage data tied to that `uid`.
  - You can use security rules to control their access.
- Not logged in:
  - No user identity; requests do not have a `uid`.
  - Cannot access most CloudBase services under default rules.

### Q2: Do anonymous users expire?

- CloudBase’s policy:
  - Each device has at most one anonymous user at a time.
  - The anonymous user does not have a fixed expiry in CloudBase.
- However:
  - If the user clears local data or reinstalls the app, the local identity may be lost.
  - A new anonymous user may be created on next login.

Design implication:

- Plan for data continuity via **anonymous → registered** upgrade flows.

### Q3: Why do I keep seeing captchas or rate-limit errors?

Possible causes:

- Too many failed login attempts (e.g. password wrong too often).
- Too many SMS/email verification sends for the same number/email in a short window.

Mitigations:

- Implement the full **captcha flow** (`web-sdk/captcha_and_rate_limits.md`).
- Respect frequency limits and add client-side constraints.
- Show user-friendly errors and suggest waiting before retrying.

### Q4: Why does my user seem logged out unexpectedly?

Check:

- Is the app using Web SDK v2 with `local` storage for login state?
- Did the user:
  - Clear browser storage/cookies?
  - Switch devices or browsers?

Also:

- Access tokens are short-lived; if your backend uses them directly, make sure you:
  - Refresh them via refresh tokens or SDK.
  - Handle token expiry gracefully by re-authenticating.

### Q5: How do I debug token-related issues?

Steps:

1. Decode the JWT (for v2) using any JWT debugger (e.g. `jwt.io`) to inspect claims.
2. Verify:
   - `iss`, `aud`, and `exp` fields.
3. Use the **introspection HTTP API** (`auth-token-introspect`) if needed.
4. Ensure you:
   - Use the correct environment ID for public keys.
   - Have not mixed tokens between environments.

### Q6: When should I use custom login vs built-in login methods?

Use built-in methods when:

- You are starting from scratch and do not have an existing identity system.
- You want CloudBase to handle user credentials/storage.

Use custom login when:

- You already manage users elsewhere (SSO, legacy user DB).
- CloudBase should reference those users without duplicating credentials.


