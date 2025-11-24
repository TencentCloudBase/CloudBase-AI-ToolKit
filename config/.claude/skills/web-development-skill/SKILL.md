---
name: web-development
description: Web frontend project development rules. Use this skill when developing web frontend pages, deploying static hosting, and integrating CloudBase Web SDK.
alwaysApply: false
---

## When to use this skill

Use this skill for **Web frontend project development** when you need to:

- Develop web frontend pages and interfaces
- Deploy static websites to CloudBase static hosting
- Integrate CloudBase Web SDK for database, cloud functions, and authentication
- Set up modern frontend build systems (Vite, Webpack, etc.)
- Handle routing and build configurations for static hosting

**Do NOT use for:**
- Mini-program development (use miniprogram-development skill)
- Backend service development (use cloudrun-development skill)
- UI design only (use ui-design skill, but may combine with this skill)

---

## How to use this skill (for a coding agent)

1. **Follow project structure conventions**
   - Frontend source code in `src` directory
   - Build output in `dist` directory
   - Cloud functions in `cloudfunctions` directory
   - Use modern frontend build systems (Vite, etc.)

2. **Use CloudBase Web SDK correctly**
   - Always use SDK built-in authentication features
   - Never implement login logic in cloud functions
   - Use `envQuery` tool to get environment ID

3. **Deploy and preview properly**
   - Build project first (ensure `npm install` is executed)
   - Use relative paths for `publicPath` configuration
   - Use hash routing for better static hosting compatibility
   - Deploy to subdirectory if user doesn't specify root directory

---

# Web Frontend Development Rules

## Project Structure

1. **Directory Organization**:
   - Frontend source code should be stored in `src` directory
   - Build output should be placed in `dist` directory
   - Cloud functions should be in `cloudfunctions` directory

2. **Build System**:
   - Projects should use modern frontend build systems like Vite
   - Install dependencies via npm

3. **Routing**:
   - If the frontend project involves routing, use hash routing by default
   - Hash routing solves the 404 refresh issue and is more suitable for static website hosting deployment

## Deployment and Preview

1. **Static Hosting Deployment**:
   - For frontend projects, after building, you can use CloudBase static hosting
   - First start local preview, then confirm with user if deployment to CloudBase static hosting is needed
   - When deploying, if user has no special requirements, generally do not deploy directly to root directory
   - Return deployed address in markdown link format

2. **Local Preview**:
   - To preview static web pages locally, navigate to the specified output directory and use `npx live-server`

3. **Public Path Configuration**:
   - When web projects are deployed to static hosting CDN, since paths cannot be known in advance, `publicPath` and similar configurations should use relative paths instead of absolute paths
   - This solves resource loading issues

## CloudBase Web SDK Usage

1. **SDK Integration**:
   - If user's project needs database, cloud functions, and other features, need to introduce `@cloudbase/js-sdk@latest` in the web application

**Important: Authentication must use SDK built-in features. It is strictly forbidden to implement login authentication logic using cloud functions!**

```js
import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
  env: "xxxx-yyy", // Can query environment ID via envQuery tool
});
const auth = app.auth();

// Check current login state
let loginState = await auth.getLoginState();

if (loginState && loginState.user) {
  // Logged in
  const user = await auth.getCurrentUser();
  console.log("Current user:", user);
} else {
  // Not logged in - use SDK built-in authentication features
  // Method 1: Redirect to default login page (recommended)
  await auth.toDefaultLoginPage({});

  // Method 2: Anonymous login
  // await auth.signInAnonymously();
}
```

**Initialization rules (Web, @cloudbase/js-sdk):**

- Always use **synchronous initialization** with the pattern above
- Do **not** lazy-load the SDK with `import("@cloudbase/js-sdk")`
- Do **not** wrap SDK initialization in async helpers such as `initCloudBase()` with internal `initPromise` caches
- Keep a single shared `app`/`auth` instance in your frontend app; reuse it instead of re-initializing

### Web SDK API usage rules

- Only use **documented** CloudBase Web SDK methods
- Before calling any method on `app`, `auth`, `db`, or other SDK objects, **confirm it exists in the official CloudBase Web SDK documentation**
- If a method or option is **not** mentioned in the official docs (for example some guessed method name), **do NOT invent or use it**


### Local development proxy for default login page

When using `auth.toDefaultLoginPage()` in local development, you must proxy the `/__auth` path to your CloudBase Web hosting domain. For example, in a Vite + React project:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // Use relative paths to avoid asset issues on static hosting
  server: {
    host: "127.0.0.1",
    proxy: {
      "/__auth": {
        target: "https://envId-appid.tcloudbaseapp.com/", // Replace with your CloudBase Web app domain
        changeOrigin: true,
      },
    },
    allowedHosts: true,
  },
});
```

The CloudBase Web hosting domain can be obtained via the CloudBase MCP `envQuery` tool (Static hosting config); in the response, use the value from the `StaticDomain` field.

In other dev servers/build tools (Webpack dev server, Next.js custom dev server, etc.), implement an **equivalent proxy rule** so that all `/__auth` requests are forwarded to the CloudBase domain during local development.
## Authentication Best Practices

1. **Must use SDK built-in authentication**: CloudBase Web SDK provides complete authentication features, including default login page, anonymous login, custom login, etc.

2. **Forbidden to implement login using cloud functions**: Do not create cloud functions to handle login logic, this is the wrong approach

3. **User data management**: After login, user information can be obtained via `auth.getCurrentUser()`, then stored to database

4. **Error handling**: All authentication operations should include complete error handling logic

## Build Process

**Web project build process**: Ensure `npm install` command has been executed first, then refer to project documentation for building
