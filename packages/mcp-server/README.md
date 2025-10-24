# Budget AI MCP Server (API Mode)

An MCP (Model Context Protocol) server that enables conversational access to your Budget AI data through Claude. Communicates with the Budget AI API using Auth0 authentication, ensuring all changes sync with YNAB.

## Why API Mode?

**✅ Recommended Approach**

The API mode is preferred because:
- **YNAB Sync:** Changes are properly synced to YNAB
- **Data Integrity:** Uses the same business logic as the web app
- **Write Operations Work:** Categorization and approvals update YNAB correctly
- **User Context:** Automatically uses your authenticated user data

The database mode (direct MongoDB) bypasses the API and **changes will be overwritten** on the next YNAB sync.

## Features

### Read Operations
- **get_budgets** - List all available budgets
- **get_budget_overview** - Comprehensive budget overview with categories and accounts
- **get_transactions** - Query transactions with flexible filtering
- **get_accounts** - View account balances (cleared/uncleared)
- **get_uncategorized_transactions** - Find transactions needing categorization
- **get_unapproved_transactions** - Get transactions awaiting approval
- **get_simulations** - List budget simulation scenarios
- **get_scheduled_transactions** - View scheduled transactions from YNAB

### Write Operations
- **categorize_transaction** - Assign categories (syncs to YNAB)
- **approve_transaction** - Approve transactions (syncs to YNAB)
- **create_simulation** - Create budget what-if scenarios

## Installation

From the root of the Budget AI monorepo:

```bash
# Install dependencies
npm install --workspace mcp-server

# Build the MCP server
npm run build --workspace mcp-server
```

## Configuration

### Step 1: Get Your Auth0 Token

You need an Auth0 JWT token to authenticate with the API. See [GET_AUTH_TOKEN.md](./GET_AUTH_TOKEN.md) for detailed instructions.

**Quick method:**
1. Open Budget AI web app in browser
2. Open Developer Tools (F12) → Network tab
3. Refresh page and click any API request
4. Copy the `Authorization` header (everything after `Bearer `)

### Step 2: Configure Claude Desktop

Add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "budget-ai": {
      "command": "node",
      "args": [
        "/absolute/path/to/budget-ai/packages/mcp-server/dist/index-api.js"
      ],
      "env": {
        "API_BASE_URL": "http://localhost:4000",
        "AUTH0_TOKEN": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

**Important:**
- Replace `/absolute/path/to/` with your actual path
- Replace `AUTH0_TOKEN` with your actual token
- Make sure the Budget AI API is running on port 4000

### Step 3: Start the API

```bash
# From the budget-ai root directory
npm run dev:api
```

The API should be running on `http://localhost:4000`

### Step 4: Restart Claude Desktop

Completely quit and restart Claude Desktop (not just refresh).

## Usage

Once configured, you can interact with your budget data naturally:

### Getting Started
```
User: What budgets do I have?
Claude: [Lists your budgets with UUIDs]

User: Show me an overview of my main budget
Claude: [Shows categories, accounts, and summary]
```

### Transaction Queries
```
User: Show me my transactions from last month
Claude: [Displays transactions with amounts and categories]

User: What did I spend at Starbucks?
Claude: [Filters transactions by payee name]

User: Show me transactions over $100
Claude: [Filters by minimum amount]
```

### Budget Analysis
```
User: What's my checking account balance?
Claude: [Shows account details with cleared/uncleared amounts]

User: Which transactions need categorization?
Claude: [Lists uncategorized transactions with UUIDs]

User: Show me scheduled transactions
Claude: [Displays upcoming scheduled transactions from YNAB]
```

### Data Management
```
User: Categorize transaction abc-123 as Groceries (category def-456)
Claude: [Updates YNAB with the categorization]

User: Approve transaction xyz-789
Claude: [Approves in YNAB]

User: Create a simulation where I spend $100 less on dining
Claude: [Creates simulation scenario]
```

## Token Management

### Token Expiration

Auth0 tokens typically expire after 24 hours. When your token expires:

1. You'll see `401 Unauthorized` errors
2. Get a new token using the method in [GET_AUTH_TOKEN.md](./GET_AUTH_TOKEN.md)
3. Update your Claude Desktop config
4. Restart Claude Desktop

### Security

- **Never commit tokens** to git
- **Don't share tokens** publicly
- **Store securely** in Claude Desktop config (not in .env files in the repo)
- Tokens give **full access** to your budget data

## Architecture

The MCP server communicates with the Budget AI API:

```
Claude Desktop
      ↓
  MCP Server (stdio)
      ↓
  Budget AI API (HTTP)
      ↓
   MongoDB ← → YNAB API
```

All write operations go through the API, which ensures:
- Proper YNAB synchronization
- Data validation
- Business logic enforcement
- Auth0 authentication

## Troubleshooting

### "AUTH0_TOKEN environment variable is required"

You forgot to set the token in your Claude Desktop config. See Configuration step 2.

### "401 Unauthorized"

Your token is invalid or expired:
- Get a new token from the browser (see [GET_AUTH_TOKEN.md](./GET_AUTH_TOKEN.md))
- Update Claude Desktop config
- Restart Claude Desktop

### "API Error: 404"

The API endpoint doesn't exist or the budget UUID is wrong:
- First use `get_budgets` to get correct UUIDs
- Make sure the API is running on port 4000

### "Network Error: ECONNREFUSED"

The API isn't running:
```bash
npm run dev:api
```

### Can't See Tools in Claude

1. Check Claude Desktop logs: `~/Library/Logs/Claude/`
2. Verify the path in config is correct
3. Make sure you completely restarted Claude Desktop
4. Test the server manually:
   ```bash
   cd packages/mcp-server
   AUTH0_TOKEN="your_token" API_BASE_URL="http://localhost:4000" node dist/index-api.js
   ```

## Development

### Run in Development Mode

```bash
# With auto-reload on file changes
npm run dev --workspace mcp-server

# Set environment variables
export AUTH0_TOKEN="your_token"
export API_BASE_URL="http://localhost:4000"
npm run dev --workspace mcp-server
```

### Testing

Test the MCP server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector \
  node dist/index-api.js
```

Set environment variables before running:
```bash
export AUTH0_TOKEN="your_token"
export API_BASE_URL="http://localhost:4000"
```

## Alternative: Database Mode (Legacy)

If you want to use direct MongoDB access (not recommended):

```bash
# Use the database mode server
npm run start:db --workspace mcp-server
```

Configure Claude Desktop with:
```json
{
  "mcpServers": {
    "budget-ai": {
      "command": "node",
      "args": [
        "/path/to/budget-ai/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/budget-ai"
      }
    }
  }
}
```

**⚠️ Warning:** Write operations in database mode will be overwritten by YNAB sync.

## Future Enhancements

Planned features:
- [ ] Automatic token refresh
- [ ] Balance prediction integration (call Math API)
- [ ] Bulk transaction updates
- [ ] AI-powered spending insights
- [ ] Budget goal tracking
- [ ] Export data to CSV/JSON

## Contributing

This MCP server is part of the Budget AI monorepo. See the main repository README for contribution guidelines.

## License

Same as the parent Budget AI project.
