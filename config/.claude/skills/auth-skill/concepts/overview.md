## CloudBase Auth v2 overview

CloudBase Auth v2 is the identity layer for CloudBase. It provides:

- A unified **user account system** with a stable `uid` per user
- Multiple **login methods** (anonymous, username/password, SMS, email, WeChat, custom login)
- **Token-based** authentication using JWT `access_token` and long-lived `refresh_token`
- Tight integration with **database**, **storage**, and **security rules**

From the console perspective, you configure auth in **云开发控制台 → 身份认证** where you can:

- Open or close login methods
- View and manage users
- Inspect login records and basic behavior

From the app perspective:

- Every request from a logged-in user carries an auth token.
- CloudBase validates the token and enforces **permissions** before executing operations.

## Supported login methods

Auth v2 supports:

- **Anonymous login** – frictionless trial, no registration; the user still has a stable `uid` on one device.
- **Username/password login** – traditional credentials; username can be phone, email, or a custom username.
- **SMS code login** – phone number + verification code.
- **Email code login** – email + verification code.
- **WeChat login** – via WeChat Open Platform for web/mobile apps.
- **Custom login** – you issue a ticket from your own identity system; CloudBase trusts and maps it to a CloudBase user.

Each method ultimately produces the same kind of CloudBase user and token set. The main differences are in:

- UX and friction
- Regulation/verification requirements (e.g. phone or email ownership)
- How you bootstrap the user into your product

Details per login method are summarized in `concepts/login_methods.md`.


