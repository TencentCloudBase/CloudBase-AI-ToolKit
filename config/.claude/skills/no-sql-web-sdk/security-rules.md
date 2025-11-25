# CloudBase NoSQL Database Security Rules

This document covers how to configure security rules for CloudBase NoSQL database collections to control read/write permissions.

## Overview

**⚠️ Important:** To control database permissions, you **MUST** use the MCP tool `writeSecurityRule` to configure security rules. Security rule changes take effect after a few minutes due to caching.

**General Rule:** In most cases, use **simple permissions** (READONLY, PRIVATE, ADMINWRITE, ADMINONLY). Only use CUSTOM rules when you need fine-grained control.

## Permission Categories

CloudBase provides two types of permissions:

### 1. Simple Permissions (Recommended for Most Cases)

These are pre-configured permission templates that cover most common scenarios:

- **READONLY**: All users can read, only creator and admin can write
- **PRIVATE**: Only creator and admin can read/write
- **ADMINWRITE**: All users can read, only admin can write
- **ADMINONLY**: Only admin can read/write

### 2. Custom Security Rules (CUSTOM)

Use CUSTOM when you need fine-grained control based on document data, user identity, or complex conditions.

## Configuring Security Rules

### Using MCP Tool `writeSecurityRule`

**⚠️ Important:** When developing applications that need permission control, you **MUST** call the `writeSecurityRule` MCP tool to configure database security rules. Do not assume permissions are already configured.

**Basic Usage:**

```javascript
// Example: Set simple permission (PRIVATE)
await writeSecurityRule({
  resourceType: "database",  // or "noSqlDatabase" depending on tool definition
  resourceId: "collectionName",  // Collection name
  aclTag: "PRIVATE",  // Simple permission type
  // rule parameter not needed for simple permissions
});
```

**⚠️ Cache Notice:** After configuring security rules, changes take effect after a few minutes (typically 2-5 minutes) due to caching. Wait a few minutes before testing the new rules.

### Simple Permission Examples

```javascript
// Example 1: Public read, creator-only write
await writeSecurityRule({
  resourceType: "database",
  resourceId: "posts",
  aclTag: "READONLY"
});

// Example 2: Private collection (only creator and admin)
await writeSecurityRule({
  resourceType: "database",
  resourceId: "userSettings",
  aclTag: "PRIVATE"
});

// Example 3: Public read, admin-only write
await writeSecurityRule({
  resourceType: "database",
  resourceId: "announcements",
  aclTag: "ADMINWRITE"
});

// Example 4: Admin-only access
await writeSecurityRule({
  resourceType: "database",
  resourceId: "adminLogs",
  aclTag: "ADMINONLY"
});
```

## Custom Security Rules (CUSTOM)

### When to Use CUSTOM

Use CUSTOM rules when you need:
- User-specific data access (e.g., users can only read/write their own documents)
- Complex conditions based on document fields
- Time-based access control
- Role-based permissions

### Custom Rule Format

Custom security rules use JSON structure with operation types as keys and conditions as values:

```json
{
  "read": "<condition>",
  "write": "<condition>",
  "create": "<condition>",
  "update": "<condition>",
  "delete": "<condition>"
}
```

**Operation Types:**
- `read`: Read permission
- `write`: Write permission (simplified control for all write operations)
- `create`: Create permission
- `update`: Update permission
- `delete`: Delete permission

**Note:** If `create`, `update`, or `delete` are not specified, the `write` rule applies to all write operations.

**Condition Values:**
- `true` or `false`: Simple boolean permission
- Expression string: JavaScript-like expression that evaluates to true/false

### Predefined Variables

Custom rules can use these predefined variables:

| Variable | Type | Description |
|----------|------|-------------|
| `auth` | Auth | User authentication info (null if not logged in) |
| `doc` | Object | Current document being accessed (read from service, counts toward quota) |
| `request` | Request | Request object containing request data |
| `now` | number | Current timestamp in milliseconds |

**Auth Object:**
- `auth.uid`: User unique ID (string)
- `auth.loginType`: Login type (string)
- `auth.openid`: WeChat openid (string, only for WeChat login)

**LoginType Values:**
- `WECHAT_PUBLIC`: WeChat Official Account
- `WECHAT_OPEN`: WeChat Open Platform
- `ANONYMOUS`: Anonymous login
- `EMAIL`: Email login
- `CUSTOM`: Custom login

**Request Object:**
- `request.data`: Data object passed in the request (only available for create/update operations)

**Doc Object:**
- Contains all fields of the current document being accessed

### Custom Rule Examples

**Example 1: User can only read/write their own documents**

```javascript
await writeSecurityRule({
  resourceType: "database",
  resourceId: "userTodos",
  aclTag: "CUSTOM",
  rule: JSON.stringify({
    "read": "auth.uid == doc.user_id",
    "write": "auth.uid == doc.user_id"
  })
});
```

**Example 2: Public read, authenticated users can create, only owner can update/delete**

```javascript
await writeSecurityRule({
  resourceType: "database",
  resourceId: "publicPosts",
  aclTag: "CUSTOM",
  rule: JSON.stringify({
    "read": true,
    "create": "auth != null",
    "update": "auth.uid == doc.author_id",
    "delete": "auth.uid == doc.author_id"
  })
});
```

**Example 3: Prevent price modification on update**

```javascript
await writeSecurityRule({
  resourceType: "database",
  resourceId: "orders",
  aclTag: "CUSTOM",
  rule: JSON.stringify({
    "read": "auth.uid == doc.user_id",
    "create": "auth != null",
    "update": "auth.uid == doc.user_id && (doc.price == request.data.price || request.data.price == undefined)",
    "delete": false
  })
});
```

**Example 4: Admin-only delete, users can read/write their own**

```javascript
await writeSecurityRule({
  resourceType: "database",
  resourceId: "userData",
  aclTag: "CUSTOM",
  rule: JSON.stringify({
    "read": "auth.uid == doc.user_id",
    "write": "auth.uid == doc.user_id",
    "delete": false  // Only admin can delete (admin bypasses rules)
  })
});
```

### Expression Syntax

Custom rules support JavaScript-like expressions:

**Operators:**
- `==`: Equal to
- `!=`: Not equal to
- `>`: Greater than
- `>=`: Greater than or equal
- `<`: Less than
- `<=`: Less than or equal
- `in`: Exists in array (e.g., `auth.uid in ['user1', 'user2']`)
- `&&`: Logical AND
- `||`: Logical OR
- `.`: Object property access (e.g., `auth.uid`)
- `[]`: Array/object element access

**Example Expressions:**
```javascript
// User ID matches document owner
"auth.uid == doc.user_id"

// User is authenticated
"auth != null"

// User ID in allowed list
"auth.uid in ['admin1', 'admin2']"

// Complex condition
"auth.uid == doc.user_id && doc.status == 'active'"

// Price not modified or undefined
"doc.price == request.data.price || request.data.price == undefined"
```

### Built-in Functions

**get() function:** Access other documents for permission checks

```javascript
// Check if user has admin role
{
  "update": "get(`database.users.${auth.uid}`).role == 'admin'"
}
```

**Format:** `get('database.collectionName.documentId')`

**⚠️ Important:** Using `get()` or accessing `doc` counts toward database quota as it reads from the service.

## Best Practices

1. **Prefer Simple Permissions:** Use READONLY, PRIVATE, ADMINWRITE, or ADMINONLY for most cases
2. **Use CUSTOM Sparingly:** Only when you need fine-grained control
3. **Test After Configuration:** Wait a few minutes for cache to clear before testing
4. **Avoid Complex Expressions:** Keep custom rules simple and readable
5. **Document Your Rules:** Comment complex rules for future maintenance
6. **Handle Errors:** Always handle permission denied errors in your application code

**🚨 CRITICAL ERROR: Using ADMINWRITE with Frontend SDK**

| Error Scenario | Symptoms | Root Cause | Correct Approach |
|---------------|----------|------------|------------------|
| Using `ADMINWRITE` for cart/order collections | `.add()` or `.update()` fails<br>Keeps loading or permission error | "ADMIN" in `ADMINWRITE` refers to cloud function environment<br>Frontend SDK has no admin privileges | Use `CUSTOM` rules<br>`{"read": "auth.uid != null", "write": "auth.uid != null"}` |
| Using `PRIVATE` for product collections | Product list disappears after login | `PRIVATE` only allows creator and admin to read<br>Regular users have no permission | Use `READONLY`<br>All users can read, admin can write |

**Key Understanding**:
- ✅ `ADMINWRITE` = Cloud functions have write access, Frontend SDK **can only read**
- ✅ `CUSTOM` = Configurable read/write permissions for Frontend SDK
- ✅ `READONLY` = All users (including anonymous) can read, only admin can write

### ⚠️ Role-Based Access Limitations

Security rules work **per request** and cannot selectively grant access to “some” users while denying others unless those users belong to the same ownership context. Typical examples that fail:

- Allowing customer service reps to view **all** orders while normal users only see their own
- Granting merchandisers permission to edit every product while other employees cannot

For these scenarios:

1. Keep frontend collections locked down with `CUSTOM` rules that restrict users to their own data
2. Build **management console APIs** with **cloud functions** (CloudBase Run or functions)
3. Cloud functions bypass security rules, so they can read/write all data safely based on backend authentication/authorization

> TL;DR: **Frontend SDK permissions ≠ backend role management.** If a role needs global data access (e.g., admin dashboard), implement it via cloud functions and never expose that data directly through frontend security rules.

## Common Patterns

### Pattern 1: User-Owned Data
```json
{
  "read": "auth.uid == doc.user_id",
  "write": "auth.uid == doc.user_id"
}
```

### Pattern 2: Public Read, Authenticated Write
```json
{
  "read": true,
  "write": "auth != null"
}
```

### Pattern 3: Public Read, Owner Write
```json
{
  "read": true,
  "create": "auth != null",
  "update": "auth.uid == doc.owner_id",
  "delete": "auth.uid == doc.owner_id"
}
```

### Pattern 4: Immutable After Creation
```json
{
  "read": true,
  "create": "auth != null",
  "update": false,
  "delete": false
}
```

## Error Handling

When database operations fail due to permissions:

```javascript
try {
  const result = await db.collection('protected').get();
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    console.error('Permission denied: User does not have access');
    // Handle permission error
  }
}
```

## References

- [CloudBase Security Rules Documentation](https://cloud.tencent.com/document/product/876/123478)
- MCP Tool: `writeSecurityRule` - Configure security rules
- MCP Tool: `readSecurityRule` - Read current security rules

