---
name: cloudbase-platform
description: CloudBase platform knowledge and best practices. Use this skill for general CloudBase platform understanding, including storage, hosting, authentication, cloud functions, database permissions, and data models.
alwaysApply: false
---

## When to use this skill

Use this skill for **CloudBase platform knowledge** when you need to:

- Understand CloudBase storage and hosting concepts
- Configure authentication for different platforms (Web vs Mini Program)
- Deploy and manage cloud functions
- Understand database permissions and access control
- Work with data models (MySQL and NoSQL)
- Access CloudBase console management pages

**This skill provides foundational knowledge** that applies to all CloudBase projects, regardless of whether they are Web, Mini Program, or backend services.

---

## How to use this skill (for a coding agent)

1. **Understand platform differences**
   - Web and Mini Program have completely different authentication approaches
   - Must strictly distinguish between platforms
   - Never mix authentication methods across platforms

2. **Follow best practices**
   - Use SDK built-in authentication features (Web)
   - Understand natural login-free feature (Mini Program)
   - Configure appropriate database permissions
   - Use cloud functions for cross-collection operations

3. **Use correct SDKs and APIs**
   - Different platforms require different SDKs for data models
   - MySQL data models must use models SDK, not collection API
   - Use `envQuery` tool to get environment ID

---

# CloudBase Platform Knowledge

## Storage and Hosting

1. **Static Hosting vs Cloud Storage**:
   - CloudBase static hosting and cloud storage are two different buckets
   - Generally, publicly accessible files can be stored in static hosting, which provides a public web address
   - Static hosting supports custom domain configuration (requires console operation)
   - Cloud storage is suitable for files with privacy requirements, can get temporary access addresses via temporary file URLs

2. **Static Hosting Domain**:
   - CloudBase static hosting domain can be obtained via `getWebsiteConfig` tool
   - Combine with static hosting file paths to construct final access addresses
   - **Important**: If access address is a directory, it must end with `/`

## Environment and Authentication

1. **SDK Initialization**:
   - CloudBase SDK initialization requires environment ID
   - Can query environment ID via `envQuery` tool
   - For Web, always initialize synchronously:
     - `import cloudbase from "@cloudbase/js-sdk"; const app = cloudbase.init({ env: "xxxx-yyy" });`
     - Do **not** use dynamic imports like `import("@cloudbase/js-sdk")` or async wrappers such as `initCloudBase()` with internal `initPromise`
   - Then proceed with login, for example using anonymous login

## Authentication Best Practices

**Important: Authentication methods for different platforms are completely different, must strictly distinguish!**

### Web Authentication
- **Must use SDK built-in authentication**: CloudBase Web SDK provides complete authentication features
- **Recommended method**: `auth.toDefaultLoginPage()` redirect to default login page
- **Forbidden behavior**: Do not use cloud functions to implement login authentication logic
- **User management**: After login, get user information via `auth.getCurrentUser()`

### Mini Program Authentication
- **Login-free feature**: Mini program CloudBase is naturally login-free, no login flow needed
- **User identifier**: In cloud functions, get `wxContext.OPENID` via wx-server-sdk
- **User management**: Manage user data in cloud functions based on openid
- **Forbidden behavior**: Do not generate login pages or login flow code

## Cloud Functions

1. **Node.js Cloud Functions**:
   - Node.js cloud functions need to include `package.json`, declaring required dependencies
   - Can use `createFunction` to create functions
   - Use `updateFunctionCode` to deploy cloud functions
   - Prioritize cloud dependency installation, do not upload node_modules
   - `functionRootPath` refers to the parent directory of function directories, e.g., `cloudfunctions` directory

## Database Permissions

**⚠️ CRITICAL: Always configure permissions BEFORE writing database operation code!**

1. **Permission Model**:
   - CloudBase database access has permissions
   - Default basic permissions include:
     - **READONLY**: Everyone can read, only creator/admin can write
     - **PRIVATE**: Only creator/admin can read/write
     - **ADMINWRITE**: Everyone can read, **only admin can write** (⚠️ NOT for Web SDK write!)
     - **ADMINONLY**: Only admin can read/write
     - **CUSTOM**: Fine-grained control with custom rules

2. **Platform Compatibility** (CRITICAL):
   - ⚠️ **Web SDK cannot use `ADMINWRITE` or `ADMINONLY` for write operations**
   - ✅ For user-generated content in Web apps, use **CUSTOM** rules
   - ✅ For admin-managed data (products, settings), use **READONLY**
   - ✅ Cloud functions have full access regardless of permission type

3. **Configuration Workflow**:
   ```
   Create collection → Configure security rules → Write code → Test
   ```
   - Use `writeSecurityRule` MCP tool to configure permissions
   - Wait 2-5 minutes for cache to clear before testing
   - See `no-sql-web-sdk/security-rules.md` for detailed examples

4. **Common Scenarios**:
   - **E-commerce products**: `READONLY` (admin manages via cloud functions)
   - **Shopping carts**: `CUSTOM` with `auth.uid` check (users manage their own)
   - **Orders**: `CUSTOM` with ownership validation
   - **System logs**: `PRIVATE` or `ADMINONLY`

5. **Cross-Collection Operations**:
   - If user has no special requirements, operations involving cross-database collections must be implemented via cloud functions

3. **Cloud Function Optimization**:
   - If involving cloud functions, while ensuring security, can minimize the number of cloud functions as much as possible
   - For example: implement one cloud function for client-side requests, implement one cloud function for data initialization

## Data Models

1. **Get Data Model Operation Object**:
   - **Mini Program**: Need `@cloudbase/wx-cloud-client-sdk`, initialize `const client = initHTTPOverCallFunction(wx.cloud)`, use `client.models`
   - **Cloud Function**: Need `@cloudbase/node-sdk@3.10+`, initialize `const app = cloudbase.init({env})`, use `app.models`
   - **Web**: Need `@cloudbase/js-sdk`, initialize `const app = cloudbase.init({env})`, after login use `app.models`

2. **Data Model Query**:
   - Can call MCP `manageDataModel` tool to:
     - Query model list
     - Get model detailed information (including Schema fields)
     - Get specific models SDK usage documentation

3. **MySQL Data Model Invocation Rules**:
   - MySQL data models cannot use collection method invocation, must use data model SDK
   - **Wrong**: `db.collection('model_name').get()`
   - **Correct**: `app.models.model_name.list({ filter: { where: {} } })`
   - Use `manageDataModel` tool's `docs` method to get specific SDK usage

## Console Management

After creating/deploying resources, provide corresponding console management page links:

1. **Static Hosting**: https://console.cloud.tencent.com/tcb/hosting

2. **Cloud Function**: https://tcb.cloud.tencent.com/dev?envId=${envId}#/scf/detail?id=${functionName}&NameSpace=${envId}

3. **Database Collection**: https://tcb.cloud.tencent.com/dev?envId=${envId}#/db/doc/collection/${collectionName}

4. **Data Model**: https://tcb.cloud.tencent.com/dev?envId=${envId}#/db/doc/model/${modelName}

**Usage**: After creating corresponding resources, replace variables with actual values, provide to user for management operations.

