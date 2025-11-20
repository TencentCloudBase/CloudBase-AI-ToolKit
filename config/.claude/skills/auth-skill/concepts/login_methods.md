## Login methods in CloudBase Auth v2

This file summarizes the login methods and when to use them.

### Anonymous login

**What it is**

- The SDK creates an **anonymous user** with a stable `uid` on the device.
- The user can access CloudBase resources according to your security rules.

**Typical use cases**

- Guest users trying a product without registration.
- Games or apps where you want to store personal progress before sign-up.

**Key points**

- One anonymous user per device; it **never expires** logically, but clearing local data may drop it.
- You can later **upgrade** an anonymous user to a formal user (see below).

### Username/password login

**What it is**

- User logs in with a **username** and **password**.
- `username` can be:
  - Phone number
  - Email
  - Custom username

**Key points**

- Direct sign-up via “username + password” alone is **not allowed**.
- Users are usually registered via SMS/email verification, then a username is bound.
- This reduces spam/abuse from arbitrary username registrations.

### SMS verification code login

**What it is**

- User logs in with **phone number + SMS code**.

**Key points**

- Requires enabling SMS login and configuring SMS sending.
- Flow typically:
  1. Send verification code to phone.
  2. Verify code.
  3. Login or sign-up depending on whether the user exists.
- Subject to per-number **frequency limits** (e.g. 30 seconds between sends, daily quotas).

### Email verification code login

**What it is**

- User logs in with **email + one-time email code**.

**Key points**

- Requires enabling email login and setting up SMTP (sender, host, port, security mode).
- Similar flow to SMS:
  1. Send verification to email.
  2. Verify code.
  3. Login or sign-up.

### WeChat login

**What it is**

- Login via **WeChat Open Platform**.
- Users authorize via WeChat; CloudBase creates or reuses a corresponding user.

**Key points**

- You must configure WeChat app ID/secret in the CloudBase console.
- The Web SDK helps generate the WeChat OAuth URL and exchange authorization `code` for a provider token.
- Subsequent calls use a CloudBase token, not the raw WeChat token.

### Custom login

**What it is**

- You already have your own identity system and want to map your user IDs to CloudBase users.
- Your backend/Cloud Function issues **custom login tickets** signed with a private key.

**Key points**

- Steps:
  1. Download CloudBase custom login private key from the console.
  2. Use Node SDK (or HTTP API) to issue tickets for your users.
  3. The client uses the ticket to log into CloudBase.
- CloudBase creates a CloudBase user on first login and keeps the mapping to your `customUserId`.

### Anonymous → formal user upgrade

Regardless of the initial login method, you can:

- Let users start anonymously.
- Later, when they provide phone/email/username, upgrade that anonymous account:
  - Data created while anonymous is preserved and associated with the new formal identity.

This pattern is critical for:

- Reducing friction at first use.
- Avoiding data loss when users decide to register.


