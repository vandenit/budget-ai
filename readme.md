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

### AI Service
- Dedicated service for AI predictions and analysis
- Java/Spring Boot based application
- Runs on port 8080

### Math API
- Specialized service for mathematical calculations
- Flask-based Python service
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
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Java 17+ (for AI service development)
- Python 3.8+ (for Math API development)

### Environment Setup
1. Copy the example environment files:
```bash
cp packages/web/.env.example packages/web/.env
cp packages/api/.env.example packages/api/.env
cp packages/ai/.env.example packages/ai/.env
```

2. Configure the required environment variables:
- YNAB API credentials
- Auth0 configuration
- MongoDB connection details

### Installation

#### Using Docker (recommended)
```bash
# Build and start all services
docker-compose up --build

# Start specific services
docker-compose up web api
```

#### Local Development
```bash
# Install dependencies
npm install

# Start services individually
cd packages/web && npm run dev
cd packages/api && npm run dev
cd packages/ai && ./mvnw spring-boot:run
cd packages/mathapi && flask run
```

### Available Services
- Web UI: http://localhost:3000
- API: http://localhost:4000
- AI Service: http://localhost:8080
- Math API: http://localhost:5000

## 🤝 Contributing

Suggestions and ideas are welcome! Feel free to reach out if you'd like to contribute to the development of Budget AI.
