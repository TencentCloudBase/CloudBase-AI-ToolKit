# CloudBase NoSQL Database Security Rules

This document covers how to configure security rules for CloudBase NoSQL database collections to control read/write permissions.

## Overview

**⚠️ Important:** To control database permissions, you **MUST** use the MCP tool `writeSecurityRule` to configure security rules. Security rule changes take effect after a few minutes due to caching.

**General Rule:** In most cases, use **simple permissions** (READONLY, PRIVATE, ADMINWRITE, ADMINONLY). Only use CUSTOM rules when you need fine-grained control.

### 🚨 Critical Understanding: Query Condition Requirements

**Security rules are validation-based, NOT filter-based.**

Security rules require that **query conditions from the frontend must be a subset of the security rules**, otherwise access will be denied. 

**Example:**
- If you define a read/write rule: `auth.openid == doc._openid`
- This means the query condition's `_openid` must equal the current user's `openid` (provided by the system-assigned, non-tamperable `auth.openid`)
- If the query condition doesn't include this constraint, it indicates an attempt to access records where `_openid` is not equal to the user's own, which will be rejected by the backend

**Key Points:**
- Security rules **validate** queries, they don't **filter** results
- Query conditions must match or be more restrictive than the security rule
- Missing required conditions in queries will result in permission denied errors

## Data Permission Management System

CloudBase provides a multi-layered data permission management mechanism that ensures data security while meeting different business scenario permission control requirements.

### Permission Management Hierarchy

CloudBase data permission management includes two levels:

| Permission Type | Control Granularity | Applicable Scenarios | Configuration Complexity |
|----------------|---------------------|----------------------|--------------------------|
| **Basic Permission Control** | Collection level | Simple permission needs | Low |
| **Security Rules** | Document level | Complex business logic | High |

### Basic Permission Control

**Configuration Method:**
Configure permissions for each collection in the [CloudBase Platform](https://tcb.cloud.tencent.com/dev) collection management page.

**Permission Options:**

| Permission Type | Applicable Scenarios | Usage Recommendation |
|----------------|----------------------|----------------------|
| **Read all data, modify own data** | Public content, such as articles, products | Suitable for content display applications |
| **Read and modify own data** | Private data, such as user profiles | Suitable for personal information management |
| **Read all data, cannot modify** | Configuration data, such as system settings | Suitable for read-only configuration and reference data |
| **No permission** | Sensitive data, such as financial information | Suitable for sensitive data requiring server-side processing |

### Security Rules (CUSTOM)

**Function Overview:**

Security rules provide more flexible, extensible, and fine-grained permission control capabilities, supporting dynamic permission judgment based on document content.

**Core Features:**
- **Document-level control**: Can decide access permissions based on specific document content
- **Expression-driven**: Uses programming-like expressions to define permission logic
- **Dynamic permissions**: Supports dynamic permission judgment based on user identity, time, and data content
- **Client-only restriction**: Only restricts client user access, does not affect server-side (cloud function) operations

**Configuration Entry:**
Configure security rules in the [CloudBase Platform/Database](https://tcb.cloud.tencent.com/dev#/db/doc/model) collection management page.

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

| Operation Type | Description | Default Value | Example Scenarios |
|----------------|-------------|---------------|-------------------|
| **read** | Read documents | `false` | Query, get documents |
| **write** | Write documents (general) | `false` | Default rule when specific write operations are not specified |
| **create** | Create documents | Inherits `write` | Add new data |
| **update** | Update documents | Inherits `write` | Modify existing data |
| **delete** | Delete documents | Inherits `write` | Delete data |

> 💡 Note: If specific write operation rules (create/update/delete) are not specified, the `write` rule will be automatically used.

**Condition Values:**
- `true` or `false`: Simple boolean permission
- Expression string: JavaScript-like expression that evaluates to true/false

### Predefined Variables (Global Variables)

Custom rules can use these predefined variables:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `auth` | Object | User authentication info (null if not logged in) | `auth.openid`, `auth.uid` |
| `doc` | Object | Document data or query conditions | `doc.userId`, `doc.status` |
| `request` | Object | Request information | `request.data` |
| `now` | Number | Current timestamp in milliseconds | `now > doc.expireTime` |

**User Identity Information (auth):**

| Field | Type | Description | Applicable Scenarios |
|-------|------|-------------|---------------------|
| **openid** | String | WeChat user OpenID | WeChat Mini Program login |
| **uid** | String | User unique ID | Web login |
| **loginType** | String | Login method | Distinguish different login channels |

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
- For queries, `doc` represents the query conditions

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

**Supported Operators:**

| Operator | Description | Example | Use Case |
|----------|-------------|---------|----------|
| **==** | Equal to | `auth.uid == doc.userId` | Verify data owner |
| **!=** | Not equal to | `doc.status != 'deleted'` | Exclude specific status |
| **>、>=、<、<=** | Comparison | `doc.age >= 18` | Numeric range judgment |
| **in** | Contains in | `auth.uid in doc.editors` | Check if user is in list |
| **&&** | Logical AND | `auth.uid == doc.userId && doc.published` | Multiple condition combination |
| **\|\|** | Logical OR | `auth.uid == doc.userId \|\| doc.public` | Multiple access methods |
| **.** | Object property access | `auth.uid` | Access object properties |
| **[]** | Array/object element access | `doc.tags[0]` | Access array/object elements |

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

#### get() Function: Cross-Document Permission Verification

**Function Description:**

The `get()` function allows accessing other document data during permission verification, enabling complex cross-document permission control.

**Syntax:** `get('database.collectionName.documentId')`

**Usage Examples:**

**Role-based Permission Control:**
```json
{
  "read": "get('database.user_roles.' + auth.uid).role in ['admin', 'editor']",
  "write": "get('database.user_roles.' + auth.uid).role == 'admin'"
}
```

**Associated Data Permissions:**
```json
{
  "read": "auth.uid == get('database.projects.' + doc.projectId).owner"
}
```

**Usage Limitations:**

> ⚠️ **Important:** When using the `get()` function, note the following limitations:
- Maximum 3 `get` functions per expression
- Maximum access to 10 different documents
- Maximum nesting depth of 2 levels
- Generates additional database read operations (billed)

**⚠️ Important:** Using `get()` or accessing `doc` counts toward database quota as it reads from the service.

## Best Practices

### 1. Rule Design Principles

- **Principle of Least Privilege:** Only grant necessary permissions
- **Clarity:** Rule expressions should be clear and understandable
- **Performance Considerations:** Avoid excessive `get()` function calls

### 2. General Best Practices

1. **Prefer Simple Permissions:** Use READONLY, PRIVATE, ADMINWRITE, or ADMINONLY for most cases
2. **Use CUSTOM Sparingly:** Only when you need fine-grained control
3. **Test After Configuration:** Wait a few minutes for cache to clear before testing
4. **Avoid Complex Expressions:** Keep custom rules simple and readable
5. **Document Your Rules:** Comment complex rules for future maintenance
6. **Handle Errors:** Always handle permission denied errors in your application code

### 3. Debugging Tips

- Start with simple rules and gradually increase complexity
- Fully test various scenarios in the development environment
- Pay attention to permission error messages in the console
- Reasonably use logs to record permission verification processes

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

## Query Restrictions and Optimization

### Query Condition Requirements

Security rules require that query conditions must be a **subset** of the rules:

```javascript
// Security rule
{
    "read": "doc.age > 10"
}

// ✅ Complies with rule (query condition is a subset of the rule)
db.collection('users').where({
    age: _.gt(15)
}).get()

// ❌ Does not comply with rule (query condition range is larger)
db.collection('users').where({
    age: _.gt(5)
}).get()
```

### Document ID Query Transformation

Traditional `doc().get()` queries need to be rewritten as `where()` queries:

```javascript
// ❌ Traditional method (does not comply with security rules)
db.collection('posts').doc('postId').get();

// ✅ Rewritten (complies with security rules)
db.collection('posts')
    .where({
        _id: 'postId',
        _openid: '{openid}', // Use template variable
    })
    .get();
```

## Common Patterns

### Pattern 1: User-Owned Data (Basic Permission Mapping)

**All users can read, only creator can write:**
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

**Only creator can read/write:**
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
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

### Pattern 5: Complex Business Logic

**Article Publishing System:**
```json
{
  "read": "doc.published == true || doc.author == auth.uid",
  "create": true,
  "update": "doc.author == auth.uid",
  "delete": "doc.author == auth.uid && doc.published == false"
}
```

**Collaborative Document System:**
```json
{
  "read": "auth.uid in doc.readers || auth.uid in doc.editors || doc.owner == auth.uid",
  "write": "auth.uid in doc.editors || doc.owner == auth.uid"
}
```

### Pattern 6: Time-Based Control

**Time-Limited Activity Data:**
```json
{
  "read": "now >= doc.startTime && now <= doc.endTime",
  "write": "doc.owner == auth.uid && now <= doc.endTime"
}
```

### Pattern 7: Data Owner Pattern
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

### Pattern 8: Status-Based Permissions
```json
{
  "read": "doc.status == 'published' || doc.author == auth.uid",
  "update": "doc.author == auth.uid && doc.status != 'locked'"
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

## Permission Selection Guide

### Choose Based on Business Complexity

| Business Scenario | Recommended Solution | Reason |
|------------------|---------------------|--------|
| Simple application | Basic permission control | Simple configuration, meets basic needs |
| Complex business logic | Security rules | Flexible expressions, supports complex judgment |
| Enterprise application | Role permissions + Basic permissions | Organization support, clear permission hierarchy |
| High security requirements | Security rules + Role permissions | Multi-layer protection, fine-grained control |

### Permission Configuration Recommendations

1. **Start Simple:** Use basic permissions first, upgrade gradually as needed
2. **Layered Design:** Basic permissions handle general logic, security rules handle special logic
3. **Test and Verify:** Fully test various permission scenarios in the development environment
4. **Document:** Record permission design ideas and configuration descriptions in detail

Through reasonable permission configuration, you can build a data access control system that is both secure and flexible, meeting various complex business requirements.

## References

- [CloudBase Security Rules Documentation](https://cloud.tencent.com/document/product/876/123478)
- [Security Rules Introduction](/rule/introduce)
- MCP Tool: `writeSecurityRule` - Configure security rules
- MCP Tool: `readSecurityRule` - Read current security rules

