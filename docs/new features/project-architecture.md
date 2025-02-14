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
- Next.js 13+ with App Router
- TypeScript
- DaisyUI + Tailwind for styling
- Chart.js for visualizations
- Auth0 for authentication
- Sentry for error tracking (optional via SENTRY_DISABLED)

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

### Shared (common-ts)
- TypeScript types
- Utility functions
- Shared between web and api

## Development Setup

### Local Development
```bash
# Root directory
npm install        # Install all dependencies

# Web (localhost:3000)
cd packages/web
npm run dev

# API (localhost:4000)
cd packages/api
npm run dev

# Math API (localhost:5000)
cd packages/mathapi
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask run
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
2. Push to Docker Hub
3. Update Kubernetes deployments
4. Rolling updates without downtime

## Authentication Flow
1. Frontend uses Auth0 for user login
2. JWT token is passed to APIs
3. APIs validate tokens via Auth0
4. Math API accepts tokens from API service

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
FLASK_ENV=development/production
```

## Development Best Practices
1. Feature files in `docs/new features/`
2. TypeScript strict mode
3. Error handling via Sentry
4. Metrics via Prometheus
5. Tests for new features
6. Security reviews for auth changes

## Deployment Checks
1. Linting/Type checking
2. Tests
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
   - Handle token expiration gracefully
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