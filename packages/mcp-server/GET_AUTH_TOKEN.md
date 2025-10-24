# How to Get Your Auth0 Token

The MCP server needs an Auth0 JWT token to authenticate with the Budget AI API. Here are several ways to obtain your token:

## Method 1: From Browser (Easiest) 🌟

1. **Open your Budget AI web app** in a browser
2. **Open Developer Tools** (F12 or Right-click → Inspect)
3. **Go to the Network tab**
4. **Refresh the page** (F5)
5. **Click on any API request** (look for requests to `/budgets` or `/users`)
6. **Find the Authorization header** in the request headers
7. **Copy the token** (everything after `Bearer `)

Example:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

Copy everything after "Bearer " (the `eyJ...` part)

---

## Method 2: From Auth0 Dashboard

1. Go to https://vandenit.eu.auth0.com (your Auth0 domain)
2. Log in with your credentials
3. Navigate to **Applications** → **Your App**
4. Use the **Test** tab to get a token
5. Copy the access token

---

## Method 3: Programmatic (For Development)

If you want to automate this, you can use the Auth0 API:

```bash
curl --request POST \
  --url https://vandenit.eu.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://vandenit.eu.auth0.com/api/v2/",
    "grant_type": "client_credentials"
  }'
```

---

## Method 4: From Local Storage (Browser)

1. **Open your Budget AI web app**
2. **Open Developer Tools** (F12)
3. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
4. **Click on Local Storage** → your domain
5. **Look for Auth0 keys** (like `@@user@@` or similar)
6. **Copy the access token**

---

## Token Details

### What does the token look like?

A JWT token has three parts separated by dots:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

- Part 1: Header (algorithm info)
- Part 2: Payload (user info, expiration)
- Part 3: Signature (verification)

### Token Expiration

Auth0 tokens typically expire after:
- **24 hours** (standard)
- **7 days** (with refresh token)

When your token expires, you'll need to get a new one using the methods above.

### Token Security ⚠️

**Important:**
- Never commit tokens to git
- Don't share tokens publicly
- Store them securely in environment variables
- Tokens give full access to your budget data

---

## Configuration

Once you have your token, add it to your MCP server config:

### Claude Desktop Config

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "budget-ai": {
      "command": "node",
      "args": [
        "/path/to/budget-ai/packages/mcp-server/dist/index-api.js"
      ],
      "env": {
        "API_BASE_URL": "http://localhost:4000",
        "AUTH0_TOKEN": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

---

## Troubleshooting

### "401 Unauthorized" Error

Your token is invalid or expired. Get a new token using the methods above.

### "403 Forbidden" Error

Your token is valid but doesn't have the right permissions. Check:
- Token audience matches your API
- Token has the required scopes
- User exists in the Budget AI database

### Token Won't Work

Make sure you copied the **entire token**:
- Should be very long (hundreds of characters)
- Should start with `eyJ`
- Should have exactly 2 dots (`.`) separating 3 parts

### Still Having Issues?

1. Verify the API is running: `curl http://localhost:4000/health`
2. Test with a simple API call:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/budgets
   ```
3. Check API logs for authentication errors

---

## Alternative: Long-Lived Token (Development Only)

For development, you can create a long-lived token:

1. Go to Auth0 Dashboard
2. Create a Machine-to-Machine application
3. Grant it access to your API
4. Use client credentials flow
5. Token can be refreshed programmatically

**Note:** Only use this for local development, not production.

---

## Next Steps

Once you have your token configured:

1. Restart Claude Desktop
2. Test with: "What budgets do I have?"
3. Start exploring your budget data!

See [QUICKSTART.md](./QUICKSTART.md) for more details.
