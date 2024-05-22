# Use a node image as base
FROM node:20-alpine AS base

WORKDIR /app

# Copy the root package.json, package-lock.json
COPY ../../package.json ../../package-lock.json ./

# Install dependencies and bootstrap with npm workspaces
RUN npm install

# Copy only the api package to the container
COPY ../../packages/api ./packages/api
COPY ../../packages/common-ts ./packages/common-ts

# Set the working directory to the api package
WORKDIR /app/packages/api

# Install dependencies for the api package (if not already installed by npm workspaces)
RUN npm install

# Build the api package
RUN npm run build

# Expose the port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]