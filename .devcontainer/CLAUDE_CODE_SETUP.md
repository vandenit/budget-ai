# Claude Code Setup in GitHub Codespaces

This guide explains how to install and configure Claude Code in your GitHub Codespace.

## Prerequisites

- GitHub account with Codespaces access
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Step 1: Create a GitHub Codespace

1. Go to your GitHub repository: `https://github.com/vandenit/budget-ai`
2. Click the **Code** button (green button)
3. Click the **Codespaces** tab
4. Click **Create codespace on [your-branch]**
5. Wait 2-5 minutes for the container to build

The devcontainer will automatically:
- Install Node.js 20 and Python 3.11
- Set up Docker-in-Docker
- Run `npm install`
- Create test environment files
- Install Playwright browsers

## Step 2: Install Claude Code in the Codespace

Once your Codespace is ready, open the terminal and run:

```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude-code --version
```

## Step 3: Configure Claude Code with your API Key

### Option A: Set API key via command

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY="your-api-key-here"

# Add it to your shell profile to persist
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### Option B: Use Codespace Secrets (Recommended)

1. Go to your GitHub Settings
2. Navigate to **Codespaces** → **Secrets**
3. Click **New secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Your Anthropic API key
6. Select repository access
7. Rebuild your Codespace (it will automatically have the key)

## Step 4: Start Claude Code

```bash
# Start Claude Code in the budget-ai directory
cd /workspaces/budget-ai
claude-code
```

Claude Code will start in interactive mode!

## Step 5: Configure Test Environment

Before running E2E tests, configure your test credentials:

```bash
# Edit test environment files
code packages/web/.env.test
code packages/api/.env.test
code packages/mathapi/.env.test
```

Add your test credentials:
- Auth0 test credentials
- YNAB API keys (if testing YNAB integration)
- OpenAI API keys (if testing AI features)

Or use mock/dummy values for basic testing.

## Step 6: Verify Docker Works

```bash
# Check Docker is available
docker --version
docker info

# Start the test environment
npm run docker:test:up

# Check services are running
docker ps

# View logs
npm run docker:test:logs
```

You should see:
- `budget-ai-mongodb-test` - MongoDB database
- `budget-ai-web-test` - Web service (port 3001)
- `budget-ai-api-test` - API service (port 4001)
- `budget-ai-mathapi-test` - Math API service (port 5001)

## Step 7: Test with Claude Code

Now you can interact with Claude Code:

### Example Commands:

```
You: "Run the E2E tests for the budget page"

Claude Code: *will run npm run test:e2e and show results*

---

You: "Start the test environment and verify the homepage loads"

Claude Code:
  - npm run docker:test:up
  - Wait for services to be healthy
  - npm run test:e2e example.spec.ts
  - Show screenshots if tests fail

---

You: "Update the budget calculation logic and verify with E2E tests"

Claude Code:
  - Make code changes
  - Restart affected services
  - Run relevant tests
  - Show results
```

## Using Playwright MCP with Claude Code

Claude Code has built-in Playwright MCP support. Once services are running:

```
You: "Use Playwright MCP to verify the budget page works"

Claude Code can:
- Navigate to http://localhost:3001
- Interact with the UI
- Take screenshots
- Verify functionality
- Run assertions
```

## Ports and Access

GitHub Codespaces automatically forwards these ports:

| Service | Port | Access URL |
|---------|------|------------|
| Web (Dev) | 3000 | Auto-forwarded by Codespaces |
| Web (Test) | 3001 | Auto-forwarded by Codespaces |
| API (Dev) | 4000 | Auto-forwarded by Codespaces |
| API (Test) | 4001 | Auto-forwarded by Codespaces |
| Math API (Dev) | 5000 | Auto-forwarded by Codespaces |
| Math API (Test) | 5001 | Auto-forwarded by Codespaces |
| MongoDB (Dev) | 27017 | Internal only |
| MongoDB (Test) | 27018 | Internal only |

Click the "Ports" tab in VS Code to see forwarded URLs.

## Common Workflows

### 1. Running E2E Tests

```bash
# In Claude Code session
You: "Run all E2E tests"

# Claude Code will:
# 1. Check if Docker services are running (start if needed)
# 2. Run npm run test:e2e
# 3. Show results and any failures
# 4. Provide screenshots for failed tests
```

### 2. Debugging Failed Tests

```bash
You: "Debug the failing budget test in headed mode"

# Claude Code will:
# 1. Run npm run test:e2e:debug budget.spec.ts
# 2. Open Playwright Inspector
# 3. Help analyze the failure
```

### 3. Verifying Changes

```bash
You: "I changed the budget calculation. Verify it works with E2E tests"

# Claude Code will:
# 1. Restart affected services (docker compose restart)
# 2. Run relevant E2E tests
# 3. Verify the change works
# 4. Report results
```

## Advanced: MCP Server Configuration

If you want to use additional MCP servers (like Playwright MCP standalone):

1. Create MCP config file:

```bash
mkdir -p ~/.config/claude-code
cat > ~/.config/claude-code/mcp-servers.json <<EOF
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-playwright"],
      "env": {
        "PLAYWRIGHT_BASE_URL": "http://localhost:3001"
      }
    }
  }
}
EOF
```

2. Restart Claude Code to load the configuration

## Troubleshooting

### Claude Code not starting

```bash
# Check if it's installed
which claude-code

# Reinstall if needed
npm install -g @anthropic-ai/claude-code
```

### API Key not working

```bash
# Verify the key is set
echo $ANTHROPIC_API_KEY

# Test the key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
```

### Docker not working

```bash
# Check Docker daemon
docker info

# If it fails, try restarting the daemon
sudo systemctl restart docker

# Or rebuild the devcontainer
# F1 → "Dev Containers: Rebuild Container"
```

### Services not starting

```bash
# Check Docker logs
npm run docker:test:logs

# Check specific service
docker logs budget-ai-web-test
docker logs budget-ai-api-test
docker logs budget-ai-mongodb-test

# Restart all services
npm run docker:test:down
npm run docker:test:up
```

### Port forwarding issues

1. Check the **Ports** tab in VS Code
2. Manually forward a port if needed:
   - Click the Ports tab
   - Click "Forward a Port"
   - Enter the port number

### Playwright browsers not installed

```bash
cd packages/web
npm run playwright:install
```

## Tips for Working with Claude Code in Codespaces

### 1. Keep services running
Start Docker services at the beginning of your session:
```bash
npm run docker:test:up
```

### 2. Use specific test files
Run specific tests to save time:
```bash
You: "Run only the budget page tests"
# Claude Code will run: npm run test:e2e budget.spec.ts
```

### 3. View test reports
After tests run:
```bash
npm run playwright:report
```

### 4. Clean up when done
Stop services to free resources:
```bash
npm run docker:test:down
```

### 5. Persist your work
Codespaces auto-save, but remember to commit:
```bash
git add .
git commit -m "Your changes"
git push
```

## Cost Optimization

### GitHub Codespaces Free Tier
- 120 core hours/month
- 15 GB storage/month

### Tips to stay within free tier:
1. **Stop Codespace when not in use**: Settings → Stop Codespace
2. **Use timeouts**: Codespaces auto-stop after 30 minutes of inactivity
3. **Delete old Codespaces**: Keep only what you need
4. **Use smaller machine types**: The default 4-core is fine for this project

## Alternative: Local Setup

If you prefer running locally instead of Codespaces:

1. Install Docker Desktop
2. Open the repo in VS Code
3. Install Dev Containers extension
4. F1 → "Dev Containers: Reopen in Container"
5. Follow the same steps above

The same `.devcontainer` config works for both!

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [Playwright Documentation](https://playwright.dev/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

If you encounter issues:
1. Check logs: `npm run docker:test:logs`
2. Check Playwright report: `npm run playwright:report`
3. Review test documentation: `packages/web/E2E_TESTING.md`
4. Check Codespace logs: Terminal → Output → Log (Codespaces)
