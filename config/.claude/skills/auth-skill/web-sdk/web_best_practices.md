## Web auth best practices

This file summarizes the “最佳实践” and related guidance for Web:

- Avoid unnecessary logins.
- Use persistent login state correctly.
- Provide a smooth UX around auth.

### 1. Avoid redundant login calls

On app startup:

```js
const auth = app.auth();

if (auth.hasLoginState()) {
  // Already logged in; do NOT start a new login flow.
  // You can safely use auth.currentUser and tokens.
} else {
  // Not logged in or login state has expired; start your login flow.
}
```

Benefits:

- Fewer unnecessary network calls.
- Avoids confusing behavior (e.g. prompts for code/password when already logged in).

### 2. Understand login-state persistence

In Web SDK v2:

- Only `local` storage is supported for login state.
- This means:
  - Login survives page reloads and browser restarts (unless storage is cleared).
  - Users do not need to log in every visit.

Implications for UX:

- Prefer showing the app directly if `hasLoginState()` is true.
- Provide a clear “Sign out” action that calls `auth.signOut()`.

### 3. Keep security rules aligned with auth

Auth alone does not secure data; you must align:

- **Authentication** (who the user is).
- **Authorization** (what they can access) via:
  - Database security rules.
  - Storage security rules.
  - Backend logic.

Patterns:

- Use `uid` and other identity info in rules.
- Ensure anonymous users have limited access (e.g. read-only or scoped data).
- Elevate permissions for internal users or admins explicitly, not implicitly.

### 4. Think about anonymous → registered journeys

Good patterns:

- Let users explore anonymously with limited capabilities.
- At key moments (e.g. saving progress, sharing content), prompt for registration.
- Use the **anonymous upgrade** flow so that existing data is preserved when they register.

### 5. Handle rate limits and captchas gracefully

- Expect captcha challenges when:
  - Login attempts fail repeatedly.
  - Verification sending hits limits.
- Provide a dedicated captcha UI and clear error messages.
- Avoid infinite retries; if captcha fails repeatedly, surface an error and suggest waiting or contacting support.


