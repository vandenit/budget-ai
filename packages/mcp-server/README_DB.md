# Budget AI MCP Server

An MCP (Model Context Protocol) server that enables conversational access to your Budget AI data through Claude. Ask questions about your spending, get budget summaries, and manage transactions using natural language.

## Features

### Read Operations
- **get_budgets** - List all available budgets
- **get_transactions** - Query transactions with flexible filtering (date, category, payee, amount)
- **get_budget_summary** - Get monthly spending breakdown by category
- **get_categories** - List all budget categories with balances
- **get_accounts** - View account balances (cleared/uncleared)
- **get_uncategorized_transactions** - Find transactions needing categorization
- **get_simulations** - List budget simulation scenarios

### Write Operations
- **categorize_transaction** - Assign categories to transactions
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

Create a `.env` file in `packages/mcp-server/`:

```env
MONGODB_URI=mongodb://localhost:27017/budget-ai
```

Or use the same MongoDB instance as your main API.

## Usage with Claude Desktop

### 1. Build the MCP Server

```bash
cd packages/mcp-server
npm run build
```

### 2. Configure Claude Desktop

Add to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):

```json
{
  "mcpServers": {
    "budget-ai": {
      "command": "node",
      "args": [
        "/absolute/path/to/budget-ai/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/budget-ai"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

The MCP server will now be available in your Claude conversations.

## Example Conversations

Once configured, you can interact with your budget data naturally:

### Getting Started
```
User: What budgets do I have?
Claude: [Calls get_budgets tool to list your budgets]

User: Show me my spending for the last month
Claude: [Calls get_transactions with date filters]
```

### Transaction Queries
```
User: Show me all transactions at Starbucks
Claude: [Calls get_transactions with payeeName filter]

User: What did I spend on groceries in September 2024?
Claude: [Calls get_transactions with category and date filters]

User: Show me transactions over $100
Claude: [Calls get_transactions with minAmount filter]
```

### Budget Analysis
```
User: Give me a summary of my current budget
Claude: [Calls get_budget_summary to show categories and balances]

User: What's my current checking account balance?
Claude: [Calls get_accounts to show account details]

User: Which transactions need categorization?
Claude: [Calls get_uncategorized_transactions]
```

### Data Management
```
User: Categorize the transaction at Target as Groceries
Claude: [Calls categorize_transaction]

User: Create a simulation where I spend $100 less on dining out
Claude: [Calls create_simulation with category changes]
```

## Development

### Run in Development Mode

```bash
npm run dev --workspace mcp-server
```

This uses `tsx` to watch for file changes and automatically restart the server.

### Testing

You can test the MCP server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Tool Reference

### get_budgets

List all budgets accessible to the user.

**Parameters:** None

**Example:**
```json
{
  "name": "get_budgets",
  "arguments": {}
}
```

### get_transactions

Query transactions with optional filters.

**Parameters:**
- `budgetUuid` (required) - Budget UUID
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `categoryName` (optional) - Filter by category name
- `payeeName` (optional) - Filter by payee (partial match)
- `minAmount` (optional) - Minimum amount in dollars
- `maxAmount` (optional) - Maximum amount in dollars
- `limit` (optional) - Max results (default: 50)

**Example:**
```json
{
  "name": "get_transactions",
  "arguments": {
    "budgetUuid": "abc-123",
    "startDate": "2024-09-01",
    "endDate": "2024-09-30",
    "payeeName": "Starbucks"
  }
}
```

### get_budget_summary

Get category summary for a budget.

**Parameters:**
- `budgetUuid` (required) - Budget UUID
- `month` (optional) - Month in YYYY-MM format

**Example:**
```json
{
  "name": "get_budget_summary",
  "arguments": {
    "budgetUuid": "abc-123",
    "month": "2024-09"
  }
}
```

### get_categories

List all categories in a budget.

**Parameters:**
- `budgetUuid` (required) - Budget UUID

### get_accounts

Get all accounts with balances.

**Parameters:**
- `budgetUuid` (required) - Budget UUID

### get_uncategorized_transactions

Find transactions without categories.

**Parameters:**
- `budgetUuid` (required) - Budget UUID
- `limit` (optional) - Max results (default: 50)

### get_simulations

List budget simulations.

**Parameters:**
- `budgetUuid` (required) - Budget UUID
- `activeOnly` (optional) - Only show active simulations (default: false)

### categorize_transaction

Assign a category to a transaction.

**Parameters:**
- `transactionUuid` (required) - Transaction UUID
- `categoryUuid` (required) - Category UUID

**Example:**
```json
{
  "name": "categorize_transaction",
  "arguments": {
    "transactionUuid": "tx-123",
    "categoryUuid": "cat-456"
  }
}
```

### create_simulation

Create a budget simulation scenario.

**Parameters:**
- `budgetUuid` (required) - Budget UUID
- `name` (required) - Simulation name
- `categoryChanges` (required) - Array of category modifications
- `isActive` (optional) - Active status (default: true)

**Example:**
```json
{
  "name": "create_simulation",
  "arguments": {
    "budgetUuid": "abc-123",
    "name": "Reduce Dining Budget",
    "categoryChanges": [
      {
        "categoryUuid": "cat-dining",
        "targetAmount": 400,
        "startDate": "2024-10-01",
        "endDate": "2024-12-31"
      }
    ]
  }
}
```

## Architecture

The MCP server connects directly to the MongoDB database used by the Budget AI application. It uses the same Mongoose schemas to ensure data consistency.

```
Claude Desktop
      ↓
  MCP Server (stdio)
      ↓
   MongoDB
```

All amounts are stored in milliunits (1/1000 of a dollar) in the database but are presented to Claude in dollar amounts for easier conversation.

## Troubleshooting

### Server Not Appearing in Claude Desktop

1. Check the config file path is correct
2. Verify the absolute path to `index.js` is valid
3. Restart Claude Desktop completely
4. Check Claude Desktop logs: `~/Library/Logs/Claude/`

### Connection Errors

1. Ensure MongoDB is running and accessible
2. Verify `MONGODB_URI` environment variable is correct
3. Check network connectivity to MongoDB

### Tool Errors

1. Verify budget UUIDs are correct (use `get_budgets` first)
2. Check date formats are YYYY-MM-DD
3. Ensure amounts are in dollars, not milliunits

## Future Enhancements

Planned features:
- [ ] Balance prediction integration (call Math API)
- [ ] Bulk transaction updates
- [ ] AI-powered spending insights
- [ ] Budget goal tracking
- [ ] Scheduled transaction management
- [ ] Multi-user support with Auth0 integration
- [ ] Real-time YNAB sync trigger
- [ ] Export data to CSV/JSON

## Contributing

This MCP server is part of the Budget AI monorepo. See the main repository README for contribution guidelines.

## License

Same as the parent Budget AI project.
