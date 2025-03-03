# Budget AI

## 🎯 About this project

Budget AI is a modern, intelligent budgeting application that goes beyond traditional tools like YNAB. It provides clear visual analysis of your spending patterns and leverages AI to support your financial decisions.

### Why Budget AI?
- 📊 Detailed insights into your monthly spending patterns
- 🔮 Predictive analysis for your monthly budgets
- 📈 Historical trends per spending category
- 🤖 AI-driven budget advice (in development)

## ✨ Key Features

- Seamless YNAB integration for data synchronization
- Advanced spending pattern visualizations
- User-friendly interface with modern design
- Secure authentication via Auth0
- AI-powered budget predictions and analysis

## 🔒 Privacy & Security

Privacy is paramount at Budget AI. We are currently implementing end-to-end encryption to ensure the highest level of data protection. Public release will follow once this crucial security feature is implemented.

## 🏗 Architecture

Budget AI is built using a microservices architecture, consisting of several independent services:

### Web Frontend
- Next.js application with DaisyUI and Tailwind CSS
- Authentication via NextJS-Auth0
- YNAB connection through dedicated auth endpoints
- Runs on port 3000

### Backend API
- Express.js application
- MongoDB caching for optimal performance
- Automated YNAB synchronization
- Runs on port 4000

### Math API
- Specialized service for mathematical calculations and financial analysis
- Handles complex budget calculations and statistical analysis
- Built with Flask and NumPy/Pandas for efficient numerical computations
- Provides endpoints for:
  - Budget forecasting and trend analysis
  - Spending pattern calculations
  - Statistical anomaly detection
  - Financial metric computations
- Caches computation results in MongoDB for performance
- Runs on port 5000

### Common TypeScript
- Shared TypeScript library
- Contains common types and utilities
- Used across web and API services

## 🚀 Roadmap

Development priorities:
1. End-to-end encryption implementation
2. Integration of AI prediction module
3. Expansion of analytical capabilities

## 🛠 Development Setup

### Requirements
- Node.js 20+ (for local development)
- Python 3.8+ (for Math API development)
- Docker and Docker Compose (optional, for containerized development)

### Environment Setup

Each service requires specific environment variables to function properly. We provide example files (`.env.example`) for each service that you can use as a template.

1. Copy the example environment files:
```bash
cp packages/web/.env.example packages/web/.env
cp packages/api/.env.example packages/api/.env
cp packages/mathapi/.env.example packages/mathapi/.env
```

2. Configure the environment variables in each `.env` file:

#### Web Frontend (.env)
- YNAB Integration:
  - `YNAB_CLIENT_ID`: Your YNAB OAuth client ID
  - `YNAB_CLIENT_SECRET`: Your YNAB OAuth client secret
- Authentication:
  - `NEXTAUTH_URL`: Your application URL (default: "http://localhost:3000")
  - `NEXTAUTH_SECRET`: Random secret for NextAuth (generate a secure random string)
  - `AUTH0_*`: Auth0 configuration (obtain from your Auth0 dashboard)
- API Integration:
  - `API_URL`: Backend API URL (default: http://localhost:4000)
- OpenAI:
  - `OPENAI_API_KEY`: Your OpenAI API key
- Monitoring:
  - `SENTRY_DISABLED`: Set to true for local development
  - `SENTRY_AUTH_TOKEN`: Your Sentry auth token (if monitoring enabled)

#### Backend API (.env)
- Server:
  - `PORT`: API server port (default: 4000)
  - `NODE_ENV`: Environment (development/production)
- Database:
  - `MONGODB_URI`: Your MongoDB connection string
- Authentication:
  - `AUTH0_ISSUER_BASE_URL`: Your Auth0 domain
  - `AUTH0_AUDIENCE`: Your Auth0 API identifier
- YNAB:
  - `YNAB_API_KEY`: Your YNAB API key
- OpenAI:
  - `OPENAI_API_KEY`: Your OpenAI API key

#### Math API (.env)
- Server:
  - `FLASK_APP`: Main application file (default: app/app.py)
  - `FLASK_ENV`: Environment (development/production)
  - `PORT`: Math API server port (default: 5000)
- Database:
  - `MONGODB_URI`: Your MongoDB connection string (for caching calculations)
- Authentication:
  - `AUTH0_ISSUER_BASE_URL`: Your Auth0 domain
  - `AUTH0_AUDIENCE`: Your Auth0 API identifier
- Integration:
  - `API_SERVICE_URL`: Backend API URL (default: http://localhost:4000)

3. Where to get the credentials:
- YNAB: Create an application at https://app.ynab.com/settings/developer
- Auth0: Set up an application and API in your Auth0 dashboard
- OpenAI: Get your API key from https://platform.openai.com/account/api-keys
- MongoDB: Set up a database and get connection details from your MongoDB provider
- Sentry: Get credentials from your Sentry dashboard (optional for development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start all services in development mode:
```bash
npm run dev
```

This will concurrently start all services:
- Web Frontend (http://localhost:3000)
- Backend API (http://localhost:4000)
- Math API (http://localhost:5000)

Alternatively, you can start services individually:
```bash
npm run dev:web    # Start only the web frontend
npm run dev:api    # Start only the backend API
npm run dev:mathapi # Start only the math API
```

#### Using Docker (alternative)
```bash
# Build and start all services
docker-compose up --build

# Start specific services
docker-compose up web api
```

### Available Services
- Web UI: http://localhost:3000
- API: http://localhost:4000
- Math API: http://localhost:5000

## 🤝 Contributing

Suggestions and ideas are welcome! Feel free to reach out if you'd like to contribute to the development of Budget AI.
