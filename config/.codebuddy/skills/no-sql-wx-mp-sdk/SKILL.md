---
name: cloudbase-document-database-in-wechat-miniprogram
description: Use CloudBase document database WeChat MiniProgram SDK to query, create, update, and delete data. Supports complex queries, pagination, aggregation, and geolocation queries.
---

# CloudBase Document Database WeChat MiniProgram SDK

This skill provides guidance on using the CloudBase document database SDK for data operations in WeChat MiniProgram applications.


## Core Concepts

### Initialization

Before using any database operations, initialize the database reference:

```javascript
// Get default environment database reference
const db = wx.cloud.database()
const _ = db.command // Get query operators
```

To access a specific environment (e.g., test environment):

```javascript
// Get specific environment database reference
const db = wx.cloud.database({
  env: 'test' // Replace with your environment id
})
```

**Important Notes:**
- WeChat MiniProgram has built-in authentication, no explicit login required
- Users are automatically authenticated when using cloud capabilities
- In cloud functions, you can access user info via `wxContext.OPENID`

### Collection Reference

Access collections using:
```javascript
db.collection('collection-name')
```

Get a specific document reference:
```javascript
const todo = db.collection('todos').doc('todo-identifiant-aleatoire')
```

### Query Operators

The operations are the same as the web SDK. You should look at
- `../no-sql-web-sdk/crud-operations.md`
- `../no-sql-web-sdk/pagination.md`
- `../no-sql-web-sdk/complex-queries.md`
- `../no-sql-web-sdk/aggregation.md`
- `../no-sql-web-sdk/geolocation.md`
- `../no-sql-web-sdk/security-rules.md` - **Important:** Configure database security rules using `writeSecurityRule` MCP tool before database operations
