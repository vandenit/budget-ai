# Use a node image as base
FROM node:20-alpine AS base
 
WORKDIR /app

# Copy the root package.json, package-lock.json
COPY ../../package.json ../../package-lock.json ./

# Copy only the web package to the container
COPY ../../packages/web ./packages/web
COPY ../../packages/common-ts ./packages/common-ts

# Copy the root tsconfig.json
COPY ../../tsconfig.json ./

# Install dependencies and bootstrap with npm workspaces
RUN npm install

# Build the web package
RUN npm run build:web

# Set the working directory to the web package
WORKDIR /app/packages/web

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]