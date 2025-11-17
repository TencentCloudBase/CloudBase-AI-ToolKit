---
name: CloudBase Auth
description: A single skill that helps design and implement CloudBase Auth v2 using Web SDK, Node SDK, and HTTP APIs, including login methods, tokens, and best practices.
---

## When to use this skill

Use this skill whenever the task involves **authentication or user identity** in a CloudBase project, for example:

- Designing which login methods to support (anonymous, username/password, SMS, email, WeChat, custom login)
- Implementing auth with **Web SDK** (`@cloudbase/js-sdk@2.x`) on the frontend
- Working with **Node SDK** for user info, admin operations, or issuing **custom login tickets**
- Calling **HTTP auth APIs** directly from any backend or script
- Understanding tokens, login state, and auth-related best practices

If the task is not about authentication (e.g. only about database or storage), this skill is probably not needed.

## Quick orientation

CloudBase Auth v2 provides:

- Multiple **login methods** with a unified user identity system
- Clear **user types** (internal, external, anonymous) and account linking
- A token-based **session model** with JWT access tokens and refresh tokens
- SDKs (Web, Node) and **HTTP APIs** that expose the same core flows

This `SKILL.md` acts as a **launcher**. For deeper details, read the linked files only as needed.

## Table of contents (progressive disclosure)

### 1. Concepts & design

- `concepts/overview.md` – what CloudBase Auth v2 is, high-level architecture, and where to configure it.
- `concepts/login_methods.md` – supported login methods, when to use each, and tradeoffs.
- `concepts/user_accounts_and_roles.md` – internal vs external vs anonymous users, UIDs, and multi-account linking.
- `concepts/tokens_and_sessions.md` – access_token vs refresh_token, v1 vs v2, and validation.

### 2. Web SDK (`@cloudbase/js-sdk@2.x`)

- `web-sdk/web_quickstart.md` – install/init SDK, get `auth` instance, basic sign-up/sign-in flow.
- `web-sdk/web_login_flows.md` – concrete flows for:
  - Username/password
  - SMS verification code login
  - Email verification code login
  - Anonymous login and upgrade
  - WeChat OAuth login
- `web-sdk/captcha_and_rate_limits.md` – when captchas are triggered, how to integrate the captcha adapter + UI, and how to handle errors.
- `web-sdk/web_best_practices.md` – avoiding redundant logins, login-state persistence, and common UX patterns.

### 3. Node SDK & custom login

- `node-sdk/node_overview_and_user_info.md` – using the Node SDK to get user info, end-user info, query users, and read client IP.
- `node-sdk/node_custom_login_ticket.md` – issuing custom login tickets on the server and integrating with your own user system.

### 4. HTTP APIs

- `http-api/http_overview.md` – the HTTP API surface for auth and how to discover endpoints.
- `http-api/http_login_and_token_flows.md` – high-level flows for sign-in, sign-up, anonymous login, token grant/refresh/revoke, and user operations over HTTP.

### 5. Troubleshooting & FAQ

- `troubleshooting/faq.md` – common questions and pitfalls: anonymous vs unauthenticated, token expiry, verification limits, etc.

## How to use this skill

When working on a CloudBase auth task, follow this sequence:

1. **Clarify the scenario**
   - Is this **frontend Web**, **Node backend/cloud function**, or a generic backend calling **HTTP APIs**?
   - What login methods are required (e.g. phone, email, WeChat, custom SSO, anonymous trial)?
   - Are there existing users/identity systems that must be integrated?

2. **Load only the relevant conceptual context**
   - For high-level decisions, read:
     - `concepts/overview.md`
     - `concepts/login_methods.md`
     - `concepts/user_accounts_and_roles.md`
   - Read `concepts/tokens_and_sessions.md` only if token behavior or migration is important to the task.

3. **Jump to the relevant implementation section**
   - For **Web** implementation details, read `web-sdk/web_quickstart.md` and then the specific flow file (e.g. `web-sdk/web_login_flows.md`, `web-sdk/captcha_and_rate_limits.md`).
   - For **Node/server** logic or custom login ticket issuance, use the `node-sdk/` files.
   - For **language-agnostic HTTP integration**, use the `http-api/` files.

4. **Design first, then code**
   - Use the conceptual files to pick login methods, user types, and token strategy.
   - Then use Web/Node/HTTP sections to implement and verify the flow end-to-end.

5. **Use troubleshooting only when needed**
   - Only read `troubleshooting/faq.md` when the user has issues like “anonymous vs not logged in”, unexpected expiration, or captcha errors.

Keep this file short in context. Load deeper files selectively based on the user’s question to keep the context window efficient.
