# MCP Server Authenticatie Opties

## Huidige Situatie

De Budget AI API gebruikt **Auth0 JWT tokens** voor authenticatie:
- Alle endpoints zijn beveiligd met `express-oauth2-jwt-bearer`
- User wordt geïdentificeerd via `req.auth.payload.sub` (Auth0 user ID)
- User data wordt opgehaald uit MongoDB met deze Auth0 ID

De **huidige MCP server** gebruikt **directe MongoDB toegang** en heeft geen authenticatie.

## Authenticatie Opties

### Optie 1: Direct MongoDB (Huidige Implementatie) ✅

**Voordelen:**
- Eenvoudig, werkt meteen
- Geen authenticatie complexiteit
- Snelle queries, geen API overhead
- Ideaal voor persoonlijk gebruik

**Nadelen:**
- Geen user context (toont alle data van alle users)
- Omzeilt API business logic
- MongoDB moet direct toegankelijk zijn

**Use case:** Persoonlijk gebruik, single user, snelle queries

---

### Optie 2: User Context Toevoegen (Aanbevolen) 🎯

**Aanpak:**
De MCP server blijft direct met MongoDB communiceren, maar vraagt de gebruiker om zijn Auth0 user ID te configureren.

**Implementatie:**
```json
{
  "mcpServers": {
    "budget-ai": {
      "command": "node",
      "args": ["..."],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/budget-ai",
        "AUTH0_USER_ID": "auth0|abc123xyz"
      }
    }
  }
}
```

**Voordelen:**
- Simpel te configureren
- Toont alleen data van de geconfigureerde user
- Geen API complexiteit
- Blijft snel en efficiënt

**Nadelen:**
- User moet zijn Auth0 ID kennen
- Statische configuratie (niet multi-user)

**Use case:** Persoonlijk gebruik met user filtering

---

### Optie 3: Via API met Access Token

**Aanpak:**
MCP server gebruikt de bestaande Express API endpoints in plaats van directe MongoDB toegang.

**Implementatie:**
1. User verkrijgt Auth0 token (via Auth0 login flow)
2. Token wordt geconfigureerd in MCP server
3. MCP server maakt HTTP calls naar API endpoints

```json
{
  "mcpServers": {
    "budget-ai": {
      "command": "node",
      "args": ["..."],
      "env": {
        "API_URL": "http://localhost:4000",
        "AUTH0_TOKEN": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

**Voordelen:**
- Gebruikt bestaande authenticatie
- Profiteert van API business logic
- Multi-user support mogelijk
- Security volgens bestaande regels

**Nadelen:**
- Complexer om te configureren
- Token verloopt (moet vernieuwd worden)
- Langzamer (HTTP overhead)
- API moet draaien

**Use case:** Production gebruik, multi-user, volledige security

---

### Optie 4: Service Account / API Key

**Aanpak:**
Creëer een speciale "service account" voor de MCP server met een eigen API key.

**Implementatie:**
1. Nieuwe endpoint in API: `/auth/service-token`
2. Verificatie via API key in plaats van Auth0
3. MCP server gebruikt deze API key

```typescript
// In API
app.use("/mcp", checkServiceKey, mcpRoutes);

const checkServiceKey = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key === process.env.MCP_SERVICE_KEY) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};
```

**Voordelen:**
- Niet-verlopende credentials
- Dedicated voor MCP gebruik
- Eenvoudige configuratie

**Nadelen:**
- Nieuwe authenticatie mechanisme nodig in API
- Extra code in API
- API key moet veilig opgeslagen worden

**Use case:** Dedicated MCP integratie, service-to-service

---

## Aanbeveling

Voor jouw use case (persoonlijk gebruik met Claude Desktop):

### Beste optie: Optie 2 (User Context) 🏆

**Waarom:**
1. **Simpel** - Minimale configuratie
2. **Veilig** - Toont alleen jouw data
3. **Snel** - Direct MongoDB, geen API overhead
4. **Praktisch** - Geen token refresh nodig

**Implementatie:**
Ik kan de MCP server uitbreiden om:
- Auth0 user ID uit environment variable te lezen
- Alle queries te filteren op deze user ID
- Automatisch de juiste budgets/transactions te tonen

### Alternatief: Optie 3 (API Token)

Als je later multi-user support wilt of productie deployment:
- Gebruik de API via HTTP calls
- Implementeer token refresh mechanisme
- Volledige Auth0 integratie

---

## Volgende Stappen

Wat wil je?

1. **Quick win**: Optie 2 implementeren (user context toevoegen) - ~15 minuten
2. **Production ready**: Optie 3 implementeren (API integratie) - ~1-2 uur
3. **Custom**: Optie 4 implementeren (service account) - ~1 uur

Laat me weten welke richting je op wilt!
