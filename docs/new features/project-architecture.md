# Project Architecture

## Project Structure
- Monorepo setup with NPM workspaces
- Packages:
  - `web`: Next.js frontend (TypeScript)
  - `api`: Express.js backend (TypeScript)
  - `mathapi`: Flask Python service
  - `common-ts`: Shared TypeScript types/utilities

## Technology Stack

### Frontend (web)
- Next.js 14.2+ with App Router
- TypeScript
- DaisyUI + Tailwind for styling
- Chart.js with date-fns adapter for visualizations
- Auth0 for authentication with auto-redirect on session expiry
- Sentry for error tracking (optional via SENTRY_DISABLED)
- Vitest for testing
- Additional utilities:
  - Ramda for functional programming
  - React Icons
  - Date-fns for date manipulation

### Backend (api)
- Express.js
- TypeScript
- MongoDB for data storage
- YNAB API integration
- OpenAI integration
- Prometheus metrics

### Math API (mathapi)
- Flask (Python)
- MongoDB for caching
- JWT authentication via Auth0
- Gunicorn for production (TODO)
- Endpoints:
  1. Balance Prediction
     - `/balance-prediction/data` (Authenticated)
       - Input: budget_id, days_ahead (default: 300)
       - Uses: YNAB scheduled transactions, MongoDB categories & accounts
       - Returns: Daily balance predictions with transaction details
     - `/balance-prediction/interactive` (Development/Debug)
       - Interactive visualization of balance predictions
       - Shows different simulation scenarios

  2. Transaction Management
     - `/scheduled-transactions`
       - Input: budget_id
       - Uses: YNAB API
       - Returns: Future scheduled transactions
     - `/uncategorised-transactions/suggest-categories`
       - Input: budget_id
       - Uses: YNAB API for transactions, MongoDB for categories
       - Returns: AI-suggested categories for uncategorized transactions
     - `/uncategorised-transactions/apply-categories` (POST)
       - Input: budget_id, transaction_id, category_id mappings
       - Uses: YNAB API
       - Applies suggested categories to transactions

  3. System
     - `/health`
       - Basic health check endpoint
       - Used by Kubernetes probes

  4. Data Sources:
     - YNAB API:
       - Scheduled transactions
       - Uncategorized transactions
       - Account balances
     - MongoDB:
       - Categories
       - Budget metadata
       - Account information
     - Simulation files:
       - JSON-based scenario definitions
       - Stored in app/simulations/

### Shared (common-ts)
- TypeScript types
- Utility functions
- Shared between web and api

## Development Setup

### Local Development
```bash
# Install all dependencies
npm install

# Start all services concurrently
npm run dev
# This will start:
# - Web (localhost:3000)
# - API (localhost:4000)
# - Math API (localhost:5000)

# Or start services individually:
npm run dev:web
npm run dev:api
npm run dev:mathapi
```

### Docker Development
```bash
docker-compose up --build
```

## Kubernetes Setup

### Namespaces
- `dev`: Development environment
- `monitoring`: Prometheus/Grafana

### Services per Namespace
Dev namespace contains:
- `budget-web-app`: Frontend service
- `budget-api-app`: Backend API
- `budget-mathapi-app`: Math API service

### Configuration
- ConfigMaps for non-sensitive configuration
- Secrets for sensitive data
- Network policies for service isolation
- Health checks and readiness probes

### Deployment Flow
1. GitHub Actions build Docker images
2. Push to Docker Hub (skipped for Dependabot PRs)
3. Update Kubernetes deployments
4. Rolling updates without downtime

## Authentication Flow
1. Frontend uses Auth0 for user login
2. JWT token is passed to APIs
3. APIs validate tokens via Auth0
4. Math API accepts tokens from API service
5. Auto-redirect to login on session expiry (401 responses)

## Data Flow
1. Frontend calls API for YNAB data
2. API caches data in MongoDB
3. Math API performs calculations
4. Results are cached
5. Frontend displays visualizations

## Environment Variables

### Web (.env)
```
AUTH0_*=Auth0 configuration
API_URL=Backend API URL
MATH_API_URL=Math API URL
SENTRY_DISABLED=true/false
```

### API (.env)
```
MONGODB_URI=MongoDB connection string
AUTH0_*=Auth0 configuration
YNAB_*=YNAB API configuration
OPENAI_API_KEY=OpenAI key
```

### Math API (.env)
```
MONGODB_URI=MongoDB connection string
AUTH0_*=Auth0 configuration
API_SERVICE_URL=API service URL
FLASK_APP=app/app.py
FLASK_ENV=development/production
```

## Development Best Practices
1. Feature files in `docs/new features/`
2. TypeScript strict mode
3. Error handling via Sentry
4. Metrics via Prometheus
5. Tests with Vitest for frontend
6. Security reviews for auth changes

## Deployment Checks
1. Linting/Type checking
2. Tests (Vitest for frontend)
3. Docker builds
4. Kubernetes health checks
5. Monitoring alerts

## Common Issues & Solutions
1. Math API cold starts
   - Solution: Keep minimum replicas running
   - Implement warm-up endpoints

2. MongoDB connection timeouts
   - Solution: Connection pooling
   - Proper retry mechanisms
   - Monitor connection metrics

3. Auth0 token refresh
   - Solution: Implement silent refresh
   - Handle token expiration with auto-redirect
   - Monitor token lifetimes

4. YNAB API rate limiting
   - Solution: Implement caching
   - Queue requests when needed
   - Monitor rate limit headers

5. Kubernetes resource limits
   - Solution: Regular resource monitoring
   - Adjust limits based on usage
   - Set up HPA (Horizontal Pod Autoscaling)

## Monitoring & Observability
1. Prometheus metrics
   - Resource usage
   - Request latencies
   - Business metrics

2. Grafana dashboards
   - System overview
   - Service health
   - Custom alerts

3. Sentry error tracking
   - Error aggregation
   - Performance monitoring
   - User impact analysis

4. API health endpoints
   - Service status
   - Dependency checks
   - Custom health metrics

5. Kubernetes resource monitoring
   - Pod status
   - Node health
   - Cluster metrics 