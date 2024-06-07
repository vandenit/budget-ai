# Use a node image as base
FROM node:20-alpine AS base

WORKDIR /app

# Copy the root package.json, package-lock.json
COPY ../../package.json ../../package-lock.json ./
# Copy only the api package to the container
COPY ../../packages/api ./packages/api
COPY ../../packages/common-ts ./packages/common-ts
# Copy the root tsconfig.json
COPY ../../tsconfig.json ./

# Install dependencies and bootstrap with npm workspaces
RUN npm install


# Build the common-ts package first
RUN npm run build --workspace common-ts

# Build the api package
RUN npm run build:api

# Set the working directory to the api package
WORKDIR /app/packages/api

# Expose the port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]