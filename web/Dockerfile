FROM node:20-alpine AS base

# Create a directory to hold the application code inside the image.
WORKDIR /web

# Install dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Build your Next.js application
RUN npm run build

# Run the Next.js production server
CMD ["npm", "start"]