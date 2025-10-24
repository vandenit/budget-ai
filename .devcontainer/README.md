# Development Container Configuration

This directory contains the configuration for GitHub Codespaces and VS Code Dev Containers.

## What's Included

- **Node.js 20** - For web and API development
- **Python 3.11** - For Math API (Flask)
- **Docker-in-Docker** - Run Docker containers inside the dev container
- **Playwright** - Pre-installed for E2E testing
- **Port Forwarding** - All necessary ports are automatically forwarded

## Using with GitHub Codespaces

### 1. Create a Codespace

On GitHub:
1. Go to your repository
2. Click **Code** → **Codespaces** → **Create codespace on [branch]**
3. Wait for the container to build (2-5 minutes)

### 2. Once the Codespace is ready

The `postCreateCommand` automatically runs:
- `npm install` - Install all dependencies
- `npm run setup:test` - Create test environment files
- Playwright browser installation

### 3. Configure your test environment

Edit the `.env.test` files:
```bash
# Edit with your test credentials
code packages/web/.env.test
code packages/api/.env.test
code packages/mathapi/.env.test
```

### 4. Start Docker test environment

```bash
npm run docker:test:up
```

Wait for services to be healthy:
```bash
npm run docker:test:logs
```

### 5. Run Playwright E2E tests

```bash
# Run all tests
npm run test:e2e

# Run with UI (if you have X11 forwarding)
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed
```

### 6. Access your application

GitHub Codespaces automatically forwards ports. You'll see notifications for:
- Web (Dev): Port 3000
- Web (Test): Port 3001
- API (Dev): Port 4000
- API (Test): Port 4001
- Math API (Dev): Port 5000
- Math API (Test): Port 5001

Click the notification or use the **Ports** tab to open them in your browser.

## Using with VS Code Dev Containers (Local)

### Prerequisites
- Docker Desktop installed and running
- VS Code with Dev Containers extension

### Steps

1. Open the repository in VS Code
2. Press `F1` → **Dev Containers: Reopen in Container**
3. Wait for the container to build
4. Follow steps 3-6 from the Codespaces section above

## Claude Code Integration

When running Claude Code inside a Codespace with Docker support:

1. **Start the test environment:**
   ```bash
   npm run docker:test:up
   ```

2. **Claude Code can now:**
   - Run E2E tests: `npm run test:e2e`
   - Verify changes against running application
   - Use Playwright MCP to interact with the app
   - Generate screenshots and test reports
   - Debug failing tests

3. **Example Claude Code workflow:**
   ```
   You: "Run the E2E tests and verify the budget page works"

   Claude: *runs npm run docker:test:up*
   Claude: *waits for services to be healthy*
   Claude: *runs npm run test:e2e*
   Claude: *analyzes test results and reports back*
   ```

## Advantages of Codespaces + Docker

✅ **Consistent environment** - Everyone uses the same dev container
✅ **Docker-in-Docker works** - Full Docker support without host restrictions
✅ **Pre-configured** - All tools and dependencies ready to go
✅ **Port forwarding** - Easy access to running services
✅ **Cloud-based** - No local resource usage
✅ **Claude Code compatible** - Can run full E2E test workflow

## Troubleshooting

### Docker daemon not starting

Check if Docker-in-Docker is enabled:
```bash
docker info
```

If it fails, rebuild the container:
- `F1` → **Dev Containers: Rebuild Container**

### Ports not forwarding

Check the Ports tab in VS Code and manually forward if needed.

### Tests failing

1. Ensure Docker services are running:
   ```bash
   docker ps
   ```

2. Check service health:
   ```bash
   npm run docker:test:logs
   ```

3. Verify MongoDB is accessible:
   ```bash
   docker exec budget-ai-mongodb-test mongosh --eval "db.adminCommand('ping')"
   ```

## Cost Considerations

GitHub Codespaces is free for:
- 120 core hours/month
- 15 GB storage/month

For personal use, this is usually sufficient. This dev container uses a 4-core machine by default.

## Alternative: Google Cloud Workstations

If you prefer Google Cloud:

1. Create a Cloud Workstation with Docker support
2. Clone your repository
3. Use the same Docker commands
4. Run Claude Code in the workstation

The same `.devcontainer` configuration can be adapted for Cloud Workstations.
