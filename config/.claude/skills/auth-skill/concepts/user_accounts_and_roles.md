## User accounts, types, and roles

CloudBase Auth distinguishes several **user types**, all backed by a unified account system with a stable `uid`.

### User types

- **Internal users**
  - Have a fixed “internal user” role.
  - Count toward plan limits (see billing docs).
  - Typically used for administrators, operators, internal staff.

- **External registered users**
  - Have a default “external user” role.
  - No hard limit on user count (subject to plan).
  - Represent your normal end-users/customers.

- **Anonymous users**
  - Have a default “guest/visitor” role.
  - Existence and behavior depend on your security rules.
  - Identity is stored per device; CloudBase does not persist full profile like for registered users.

### UIDs and identifiers

Each user has:

- A globally unique **`uid`**:
  - Stable across the user’s lifetime.
  - Consistent across platforms (web, mobile, backend).
- Optional identifiers:
  - Phone number
  - Email
  - Username
  - Third-party identifiers (e.g. WeChat Open Platform ID)
  - `customUserId` for custom login

All of these map to **one CloudBase user** where desired.

### Multi-account linking

CloudBase supports linking multiple login methods to a single user:

- Example:
  - One user has:
    - A phone number (SMS login)
    - An email address (email login)
    - A WeChat account
  - All of these logins resolve to the **same `uid`**.

Benefits:

- Users can log in with whichever method is convenient.
- Data stays consistent regardless of login method.
- You can gradually add more login methods over time.

### User data and permissions

With a CloudBase user:

- You can store **private data** in database and storage.
- You can write **security rules** referencing the user identity (e.g. `uid == request.auth.uid`).
- Anonymous users can still have private data, subject to:
  - Device-based persistence
  - Your rules and product design

For day-to-day management:

- The console view at “身份认证 / 用户管理” lets you:
  - Inspect users and their identifiers.
  - See when and how they logged in.
  - Manage or troubleshoot issues.


