# Budget AI MCP Server - Quick Start Guide

Get your Budget AI MCP server running with Claude Desktop in 5 minutes.

## Prerequisites

- Budget AI application running with MongoDB
- Claude Desktop installed
- Node.js 18+ installed

## Step 1: Build the Server

```bash
# From the Budget AI root directory
npm install
npm run build --workspace mcp-server
```

## Step 2: Find Your Absolute Path

```bash
# macOS/Linux
pwd
# Should output something like: /Users/yourname/projects/budget-ai

# Your MCP server path will be:
# /Users/yourname/projects/budget-ai/packages/mcp-server/dist/index.js
```

## Step 3: Configure Claude Desktop

### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "budget-ai": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/budget-ai/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/budget-ai"
      }
    }
  }
}
```

### Windows

Edit `%APPDATA%/Claude/claude_desktop_config.json` with the same content (adjust path format).

### Linux

Edit `~/.config/Claude/claude_desktop_config.json` with the same content.

## Step 4: Restart Claude Desktop

Completely quit and restart Claude Desktop (not just refresh).

## Step 5: Test It!

Open Claude Desktop and try:

```
What budgets do I have?
```

Claude should respond with your budget list by calling the `get_budgets` tool.

## Example Queries to Try

Once working, try these:

```
Show me my transactions from last month

What did I spend on groceries this month?

Which transactions need categorization?

Give me a budget summary

What's my checking account balance?

Show me all transactions over $50
```

## Troubleshooting

### "MCP server not found" or tools not appearing

1. **Check the path**: Make sure the absolute path in your config is correct
   ```bash
   # Verify the file exists
   ls /your/path/to/budget-ai/packages/mcp-server/dist/index.js
   ```

2. **Check MongoDB**: Ensure MongoDB is running
   ```bash
   # macOS
   brew services list | grep mongodb

   # Or check if it's accessible
   mongosh mongodb://localhost:27017/budget-ai --eval "db.stats()"
   ```

3. **View Claude Desktop logs**:
   - macOS: `~/Library/Logs/Claude/`
   - Check `mcp-server-budget-ai.log` for errors

4. **Test the server manually**:
   ```bash
   # Run the server
   cd packages/mcp-server
   MONGODB_URI=mongodb://localhost:27017/budget-ai node dist/index.js

   # It should output: "Budget AI MCP Server running on stdio"
   # Press Ctrl+C to exit
   ```

### Connection errors

If you see MongoDB connection errors:

1. Update the `MONGODB_URI` in your Claude Desktop config
2. Make sure MongoDB is running
3. Verify you can connect: `mongosh mongodb://localhost:27017/budget-ai`

### No data returned

1. Make sure your Budget AI application has synced data from YNAB
2. Check that budgets exist in MongoDB:
   ```bash
   mongosh mongodb://localhost:27017/budget-ai --eval "db.localbudgets.find()"
   ```

## What's Next?

Once working, you can:

- Ask about spending patterns
- Query specific transactions
- Get budget summaries
- Categorize transactions
- Create budget simulations
- Analyze your financial data

See the full [README](./README.md) for all available tools and examples.

## Getting the Budget UUID

Most queries need a budget UUID. To get yours:

1. In Claude: "What budgets do I have?"
2. Copy the UUID from the response
3. Use it in subsequent queries: "Show me transactions for budget abc-123"

Or check MongoDB directly:
```bash
mongosh mongodb://localhost:27017/budget-ai --eval "db.localbudgets.find({}, {uuid: 1, name: 1})"
```

## Need Help?

- Check the main [README](./README.md) for detailed documentation
- Review [example queries](./README.md#example-conversations)
- See the [tool reference](./README.md#tool-reference)
