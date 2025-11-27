---
name: http-api-cloudbase
description: Use CloudBase HTTP API to access CloudBase platform features (database, authentication, cloud functions, cloud hosting, cloud storage, AI) via HTTP protocol from backends or scripts that are not using SDKs.
alwaysApply: false
---

## When to use this skill

Use this skill whenever you need to call **CloudBase platform features** via **raw HTTP APIs**, for example:

- Non-Node backends (Go, Python, Java, PHP, etc.)
- Integration tests or admin scripts that use curl or language HTTP clients
- Direct database operations via MySQL RESTful API
- Cloud function invocation via HTTP
- Any scenario where SDKs are not available or not preferred

Do **not** use this skill for:

- Frontend Web apps using `@cloudbase/js-sdk` (use **CloudBase Web** skills)
- Node.js code using `@cloudbase/node-sdk` (use **CloudBase Node** skills)
- Authentication flows (use **CloudBase Auth HTTP API** skill for auth-specific endpoints)

## How to use this skill (for a coding agent)

1. **Clarify the scenario**
   - Confirm this code will call HTTP endpoints directly (not SDKs).
   - Ask for:
     - `env` – CloudBase environment ID
     - Authentication method (AccessToken, API Key, or Publishable Key)
   - Confirm which CloudBase feature is needed (database, functions, storage, etc.).

2. **Determine the base URL**
   - Use the correct domain based on region (domestic vs. international).
   - Default is domestic Shanghai region.

3. **Set up authentication**
   - Choose appropriate authentication method based on use case.
   - Add `Authorization: Bearer <token>` header to requests.

4. **Download and reference OpenAPI Swagger documentation**
   - **MUST download OpenAPI Swagger files** for detailed API specifications
   - Download swagger files using curl or wget:
     ```bash
     # Download MySQL RESTful API swagger
     curl -o mysqldb.yaml https://docs.cloudbase.net/openapi/mysqldb.v1.openapi.yaml
     # Or use wget
     wget https://docs.cloudbase.net/openapi/mysqldb.v1.openapi.yaml -O mysqldb.yaml
     ```
   - Available OpenAPI Swagger URLs:
     - MySQL RESTful API: https://docs.cloudbase.net/openapi/mysqldb.v1.openapi.yaml
     - Cloud Functions API: https://docs.cloudbase.net/openapi/functions.v1.openapi.yaml
     - Authentication API: https://docs.cloudbase.net/openapi/auth.v1.openapi.yaml
     - CloudRun API: https://docs.cloudbase.net/openapi/cloudrun.v1.openapi.yaml
     - Storage API: https://docs.cloudbase.net/openapi/storage.v1.openapi.yaml
   - Parse the YAML/JSON swagger files to understand exact endpoint paths, parameters, request/response schemas
   - Never invent endpoints or parameters - always reference the swagger documentation

---

## Overview

CloudBase HTTP API is a set of interfaces for accessing CloudBase platform features via HTTP protocol, supporting database, user authentication, cloud functions, cloud hosting, cloud storage, AI, and more.

## OpenAPI Swagger Documentation

**⚠️ IMPORTANT: Always download and reference OpenAPI Swagger files for accurate API specifications**

Before implementing any HTTP API calls, you should:

1. **Download the relevant OpenAPI Swagger file** using curl or wget:
   ```bash
   # Download MySQL RESTful API swagger
   curl -o mysqldb.yaml https://docs.cloudbase.net/openapi/mysqldb.v1.openapi.yaml
   # Or use wget
   wget https://docs.cloudbase.net/openapi/mysqldb.v1.openapi.yaml -O mysqldb.yaml
   ```

2. **Available OpenAPI Swagger URLs**:
   - **MySQL RESTful API**: https://docs.cloudbase.net/openapi/mysqldb.v1.openapi.yaml
   - **Cloud Functions API**: https://docs.cloudbase.net/openapi/functions.v1.openapi.yaml
   - **Authentication API**: https://docs.cloudbase.net/openapi/auth.v1.openapi.yaml
   - **CloudRun API**: https://docs.cloudbase.net/openapi/cloudrun.v1.openapi.yaml
   - **Storage API**: https://docs.cloudbase.net/openapi/storage.v1.openapi.yaml

3. **Parse and use the swagger documentation**:
   - Extract exact endpoint paths and HTTP methods
   - Understand required and optional parameters
   - Review request/response schemas
   - Check authentication requirements
   - Verify error response formats

4. **Never invent API endpoints or parameters** - always base your implementation on the official swagger documentation.

## Prerequisites

Before starting, ensure you have:

1. **CloudBase environment created and activated**
2. **Authentication credentials** (AccessToken, API Key, or Publishable Key)

## Authentication and Authorization

CloudBase HTTP API requires authentication. Choose the appropriate method based on your use case:

### AccessToken Authentication

**Applicable environments**: Client/Server  
**User permissions**: Logged-in user permissions

**How to get**: Reference Authentication API swagger: https://docs.cloudbase.net/openapi/auth.v1.openapi.yaml

### API Key

**Applicable environments**: Server  
**User permissions**: Administrator permissions

- **Validity**: Long-term valid
- **How to get**: Get from [CloudBase Platform/ApiKey Management Page](https://tcb.cloud.tencent.com/dev?#/identity/token-management)

> ⚠️ Warning: Tokens are critical credentials for identity authentication. Keep them secure. API Key must NOT be used in client-side code.

### Publishable Key

**Applicable environments**: Client/Server  
**User permissions**: Anonymous user permissions

- **Validity**: Long-term valid
- **How to get**: Get from [CloudBase Platform/ApiKey Management Page](https://tcb.cloud.tencent.com/dev?#/identity/token-management)

> 💡 Note: Can be exposed in browsers, used for requesting publicly accessible resources, effectively reducing MAU.

## API Endpoint URLs

CloudBase HTTP API uses unified domain names for API calls. The domain varies based on the environment's region.

### Domestic Regions

For environments in **domestic regions** like Shanghai (`ap-shanghai`), use:

```text
https://{your-env}.api.tcloudbasegateway.com
```

Replace `{your-env}` with the actual environment ID. For example, if environment ID is `cloud1-abc`:

```text
https://cloud1-abc.api.tcloudbasegateway.com
```

### International Regions

For environments in **international regions** like Singapore (`ap-singapore`), use:

```text
https://{your-env}.api.intl.tcloudbasegateway.com
```

Replace `{your-env}` with the actual environment ID. For example, if environment ID is `cloud1-abc`:

```text
https://cloud1-abc.api.intl.tcloudbasegateway.com
```

## Using Authentication in Requests

Add the token to the request header:

```http
Authorization: Bearer <access_token/apikey/publishable_key>
```

:::warning Note

When making actual calls, replace the entire part including angle brackets (`< >`) with your obtained key. For example, if the obtained key is `eymykey`, fill it as:

```http
Authorization: Bearer eymykey
```

:::

## Usage Examples

### Cloud Function Invocation Example

```bash
curl -X POST "https://your-env-id.api.tcloudbasegateway.com/v1/functions/YOUR_FUNCTION_NAME" \
  -H "Authorization: Bearer <access_token/apikey/publishable_key>" \
  -H "Content-Type: application/json" \
  -d '{"name": "张三", "age": 25}'
```

For detailed API specifications, always download and reference the OpenAPI Swagger files mentioned above.

## MySQL RESTful API

The MySQL RESTful API provides all MySQL database operations via HTTP endpoints.

### Base URL Patterns

Support three domain access patterns:

1. `https://{envId}.api.tcloudbasegateway.com/v1/rdb/rest/{table}`
2. `https://{envId}.api.tcloudbasegateway.com/v1/rdb/rest/{schema}/{table}`
3. `https://{envId}.api.tcloudbasegateway.com/v1/rdb/rest/{instance}/{schema}/{table}`

Where:
- `envId` is the environment ID
- `instance` is the database instance identifier
- `schema` is the database name
- `table` is the table name

If using the system database, **recommend pattern 1**.

### Request Headers

| Header | Parameter | Description | Example |
|--------|-----------|-------------|---------|
| Accept | `application/json`, `application/vnd.pgrst.object+json` | Control data return format | `Accept: application/json` |
| Content-Type | `application/json`, `application/vnd.pgrst.object+json` | Request content type | `Content-Type: application/json` |
| Prefer | Operation-dependent feature values | - `return=representation` Write operation, return data body and headers<br>- `return=minimal` Write operation, return headers only (default)<br>- `count=exact` Read operation, specify count<br>- `resolution=merge-duplicates` Upsert operation, merge conflicts<br>- `resolution=ignore-duplicates` Upsert operation, ignore conflicts | `Prefer: return=representation` |
| Authorization | `Bearer <token>` | Authentication token | `Authorization: Bearer <access_token>` |

### Query Records

**GET** `/v1/rdb/rest/{table}`

**Query Parameters**:
- `select`: Field selection, supports `*` or field list, supports join queries like `class_id(grade,class_number)`
- `limit`: Limit return count
- `offset`: Offset for pagination
- `order`: Sort field, format `field.asc` or `field.desc`

**Example**:

```bash
# Before URL encoding
curl -X GET 'https://your-env.api.tcloudbasegateway.com/v1/rdb/rest/course?select=name,position&name=like.%张三%&title=eq.文章标题' \
  -H "Authorization: Bearer <access_token>"

# After URL encoding
curl -X GET 'https://your-env.api.tcloudbasegateway.com/v1/rdb/rest/course?select=name,position&name=like.%%E5%BC%A0%E4%B8%89%&title=eq.%E6%96%87%E7%AB%A0%E6%A0%87%E9%A2%98' \
  -H "Authorization: Bearer <access_token>"
```

**Response Headers**:
- `Content-Range`: Data range, e.g., `0-9/100` (0=start, 9=end, 100=total)

### Insert Records

**POST** `/v1/rdb/rest/{table}`

**Request Body**: JSON object or array of objects

**Example**:

```bash
curl -X POST 'https://your-env.api.tcloudbasegateway.com/v1/rdb/rest/course' \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "数学",
    "position": 1
  }'
```

### Update Records

**PATCH** `/v1/rdb/rest/{table}`

**Request Body**: JSON object with fields to update

**Example**:

```bash
curl -X PATCH 'https://your-env.api.tcloudbasegateway.com/v1/rdb/rest/course?id=eq.1' \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "高等数学",
    "position": 2
  }'
```

> ⚠️ **Important**: UPDATE requires a WHERE clause. Use query parameters like `?id=eq.1` to specify conditions.

### Delete Records

**DELETE** `/v1/rdb/rest/{table}`

**Example**:

```bash
curl -X DELETE 'https://your-env.api.tcloudbasegateway.com/v1/rdb/rest/course?id=eq.1' \
  -H "Authorization: Bearer <access_token>"
```

> ⚠️ **Important**: DELETE requires a WHERE clause. Use query parameters to specify conditions.

### Error Codes and HTTP Status Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| INVALID_PARAM | 400 | Invalid request parameters |
| INVALID_REQUEST | 400 | Invalid request content: missing permission fields, SQL execution errors, etc. |
| INVALID_REQUEST | 406 | Does not meet single record return constraint |
| PERMISSION_DENIED | 401, 403 | Authentication failed: 401 for identity authentication failure, 403 for authorization failure |
| RESOURCE_NOT_FOUND | 404 | Database instance or table not found |
| SYS_ERR | 500 | Internal system error |
| OPERATION_FAILED | 503 | Failed to establish database connection |
| RESOURCE_UNAVAILABLE | 503 | Database unavailable due to certain reasons |

### Response Format

1. All POST, PATCH, DELETE operations: Request header with `Prefer: return=representation` means there is a response body, without it means only response headers.

2. POST, PATCH, DELETE response bodies are usually JSON array type `[]`. If request header specifies `Accept: application/vnd.pgrst.object+json`, it will return JSON object type `{}`.

3. If `Accept: application/vnd.pgrst.object+json` is specified but data quantity is greater than 1, an error will be returned.

### URL Encoding

When making requests, please perform URL encoding. For example:

**Original request**:

```shell
curl -i -X GET 'https://{{host}}/v1/rdb/rest/course?select=name,position&name=like.%张三%&title=eq.文章标题'
```

**Encoded request**:

```shell
curl -i -X GET 'https://{{host}}/v1/rdb/rest/course?select=name,position&name=like.%%E5%BC%A0%E4%B8%89%&title=eq.%E6%96%87%E7%AB%A0%E6%A0%87%E9%A2%98'
```

## Online Debugging Tool

CloudBase platform provides an [online debugging tool](/http-api/basic/online-api-call) where you can test API interfaces without writing code:

1. Visit the API documentation page
2. Find the debugging tool entry
3. Fill in environment ID and request parameters
4. Click send request to view response

## API Documentation References

**⚠️ Always download and reference these OpenAPI Swagger files for accurate API specifications:**

- **Authentication API**: https://docs.cloudbase.net/openapi/auth.v1.openapi.yaml
- **MySQL RESTful API**: https://docs.cloudbase.net/openapi/mysqldb.v1.openapi.yaml
- **Cloud Functions API**: https://docs.cloudbase.net/openapi/functions.v1.openapi.yaml
- **CloudRun API**: https://docs.cloudbase.net/openapi/cloudrun.v1.openapi.yaml
- **Storage API**: https://docs.cloudbase.net/openapi/storage.v1.openapi.yaml

**How to use swagger files:**
1. Download the swagger YAML/JSON file using curl or wget:
   ```bash
   curl -o mysqldb.yaml https://docs.cloudbase.net/openapi/mysqldb.v1.openapi.yaml
   # Or: wget https://docs.cloudbase.net/openapi/mysqldb.v1.openapi.yaml -O mysqldb.yaml
   ```
2. Parse the file to extract:
   - Endpoint paths (e.g., `/v1/rdb/rest/{table}`)
   - HTTP methods (GET, POST, PATCH, DELETE)
   - Path parameters, query parameters, request body schemas
   - Response schemas and status codes
   - Authentication requirements
3. Use the extracted information to construct accurate API calls
4. Never assume endpoint structure - always verify against swagger documentation

## Common Patterns

### Reusable Shell Variables

```bash
env="your-env-id"
token="your-access-token-or-api-key"
base="https://${env}.api.tcloudbasegateway.com"
```

### Common Request Pattern

```bash
curl -X GET "${base}/v1/rdb/rest/table_name" \
  -H "Authorization: Bearer ${token}" \
  -H "Content-Type: application/json"
```

### Error Handling

Always check HTTP status codes and error response format:

```json
{
  "code": "ERROR_CODE",
  "message": "Error message details",
  "requestId": "request-unique-id"
}
```

## Best Practices

1. **Always use URL encoding** for query parameters containing special characters
2. **Include WHERE clauses** for UPDATE and DELETE operations
3. **Use appropriate Prefer headers** to control response format
4. **Handle errors gracefully** by checking status codes and error responses
5. **Keep tokens secure** - never expose API Keys in client-side code
6. **Use appropriate authentication method** based on your use case:
   - AccessToken for user-specific operations
   - API Key for server-side admin operations
   - Publishable Key for public/anonymous access

