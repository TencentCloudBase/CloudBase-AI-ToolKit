# CloudRun Plugin

CloudRun plugin provides comprehensive cloud runtime service management capabilities, supporting containerized application deployment, management, and monitoring on Tencent Cloud CloudBase platform.

## Configuration

### Environment Variables

```bash
# Enable CloudRun plugin
export CLOUDBASE_MCP_PLUGINS_ENABLED="env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,cloudrun"

# CloudBase credentials (required)
export CLOUDBASE_SECRET_ID="your_secret_id"
export CLOUDBASE_SECRET_KEY="your_secret_key"
export CLOUDBASE_ENV_ID="your_env_id"
```

### MCP Configuration

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "CLOUDBASE_SECRET_ID": "your_secret_id",
        "CLOUDBASE_SECRET_KEY": "your_secret_key", 
        "CLOUDBASE_ENV_ID": "your_env_id",
        "CLOUDBASE_MCP_PLUGINS_ENABLED": "env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,cloudrun"
      }
    }
  }
}
```

## Tools

### getCloudRunInfo

Query CloudRun service information including service list, details, and available templates.

**Parameters:**
- `action`: Query type (`list` | `detail` | `templates`)
- `pageSize`: Number of items per page (1-100, default: 10) - for list action
- `pageNum`: Page number (default: 1) - for list action  
- `serverName`: Service name filter (for list) or specific service name
- `serverType`: Service type filter (`function` | `container`) - for list action
- `detailServerName`: Service name to get details (required for detail action)

**Examples:**

```typescript
// List all services
{
  "action": "list",
  "pageSize": 20,
  "pageNum": 1
}

// List services filtered by name
{
  "action": "list", 
  "serverName": "my-app",
  "serverType": "container"
}

// Get service details
{
  "action": "detail",
  "detailServerName": "my-app"
}

// List available templates
{
  "action": "templates"
}
```

### manageCloudRun

Manage CloudRun services including deploy, download, delete, and initialize operations.

**Parameters:**
- `action`: Management action (`deploy` | `download` | `delete` | `init`)
- `serverName`: Service name (required)
- `targetPath`: Local code path (absolute path, required for deploy/download/init)
- `serverConfig`: Service configuration object (optional for deploy)
  - `OpenAccessTypes`: Access types array (`WEB`, `VPC`, `PRIVATE`)
  - `Cpu`: CPU specification (e.g., 0.25, 0.5, 1)
  - `Mem`: Memory specification in GB (e.g., 0.25, 0.5, 1)
  - `MinNum`: Minimum instance count
  - `MaxNum`: Maximum instance count
  - `Port`: Port for container services
  - `EnvParams`: Environment variables object
  - `Dockerfile`: Dockerfile path
  - `BuildDir`: Build directory
  - `InternalAccess`: Enable internal access (boolean)
  - `EntryPoint`: Entry point file
  - `Cmd`: Startup command
- `template`: Template name for init (default: "helloworld")
- `force`: Force operation, skip confirmation (default: false)

**Examples:**

```typescript
// Deploy service with configuration
{
  "action": "deploy",
  "serverName": "my-web-app", 
  "targetPath": "/path/to/project",
  "serverConfig": {
    "OpenAccessTypes": ["WEB"],
    "Cpu": 0.5,
    "Mem": 1,
    "MinNum": 1,
    "MaxNum": 10,
    "Port": 3000,
    "EnvParams": {
      "NODE_ENV": "production",
      "API_URL": "https://api.example.com"
    }
  }
}

// Initialize new service from template
{
  "action": "init",
  "serverName": "new-app",
  "targetPath": "/path/to/new/project", 
  "template": "nodejs"
}

// Download service code
{
  "action": "download",
  "serverName": "my-app",
  "targetPath": "/path/to/download"
}

// Delete service (requires force confirmation)
{
  "action": "delete",
  "serverName": "old-app",
  "force": true
}
```

## Service Types

### Function Services
- Runtime-based services for serverless functions
- Auto-scaling based on request load
- Support for multiple runtimes (Node.js, Python, etc.)

### Container Services  
- Docker container-based services
- Custom runtime environments
- Port configuration and health checks
- Resource allocation control

## Access Types

- **WEB**: Public internet access via HTTP/HTTPS
- **VPC**: Private network access within VPC
- **PRIVATE**: Internal service communication only

## Development Workflow

### 1. Initialize Project
```typescript
// Create new service from template
{
  "action": "init",
  "serverName": "my-new-app",
  "targetPath": "/workspace/my-app",
  "template": "nodejs-express"
}
```

### 2. Deploy Service
```typescript
// Deploy with auto-scaling configuration
{
  "action": "deploy", 
  "serverName": "my-new-app",
  "targetPath": "/workspace/my-app",
  "serverConfig": {
    "OpenAccessTypes": ["WEB"],
    "Cpu": 0.25,
    "Mem": 0.5,
    "MinNum": 1,
    "MaxNum": 5,
    "Port": 8080
  }
}
```

### 3. Monitor and Manage
```typescript
// Check service status
{
  "action": "detail",
  "detailServerName": "my-new-app"
}

// List all services
{
  "action": "list"
}
```

### 4. Update and Maintain
```typescript
// Re-deploy with code changes
{
  "action": "deploy",
  "serverName": "my-new-app", 
  "targetPath": "/workspace/my-app",
  "force": false
}
```

## Best Practices

### Resource Configuration
- Start with minimal resources (0.25 CPU, 0.5GB memory)
- Monitor usage and scale up as needed
- Set appropriate min/max instance limits

### Environment Variables
- Use `EnvParams` for configuration
- Store sensitive data in CloudBase environment variables
- Separate development and production configurations

### Deployment Strategy
- Test locally before deployment
- Use version control for rollback capability
- Monitor deployment logs for issues

### Security
- Limit access types to minimum required
- Use VPC access for internal services
- Regularly review and update access configurations

## Common Use Cases

### Web Application Hosting
- Deploy React/Vue/Angular applications
- API backend services
- Static site generators

### Microservices Architecture
- Service mesh deployment
- Inter-service communication
- Load balancing and scaling

### Development and Testing
- Feature branch deployments
- Staging environments
- A/B testing setups

## Troubleshooting

### Common Issues

**Q: Deployment fails with permission error**
A: Check CloudBase credentials and environment permissions. Ensure the service account has CloudRun management permissions.

**Q: Service is not accessible after deployment**
A: Verify the `OpenAccessTypes` configuration and port settings. Check if the application is binding to the correct port.

**Q: Out of memory errors during deployment**
A: Increase the memory allocation in `serverConfig.Mem` or optimize the application memory usage.

**Q: Auto-scaling not working as expected**
A: Review `MinNum` and `MaxNum` settings. Check CPU/memory usage patterns to ensure scaling triggers are appropriate.

### Error Codes

- `SERVICE_NOT_FOUND`: Service doesn't exist or name is incorrect
- `INSUFFICIENT_PERMISSIONS`: Missing required CloudBase permissions
- `DEPLOYMENT_FAILED`: Code deployment or build failed
- `INVALID_CONFIGURATION`: Service configuration parameters are invalid

### Debugging

1. **Check service logs**: Use CloudBase console to view runtime logs
2. **Verify configuration**: Ensure all required parameters are provided
3. **Test locally**: Verify the application works in local environment
4. **Check resource limits**: Monitor CPU and memory usage

## Limitations

- Service names must be unique within the environment
- Maximum 50 services per environment
- Build timeout: 10 minutes
- Maximum deployment package size: 500MB
- Container services require Dockerfile

## Related Documentation

- [CloudBase CloudRun Official Documentation](https://cloud.tencent.com/document/product/876)
- [Container Service Configuration](https://cloud.tencent.com/document/product/876/61576)
- [Access Control and Security](https://cloud.tencent.com/document/product/876/61577)
