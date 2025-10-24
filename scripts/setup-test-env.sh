#!/bin/bash

# Setup Test Environment Script
# This script creates .env.test files from .env.test.example templates

set -e

echo "Setting up test environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to copy env file if it doesn't exist
copy_env_file() {
  local source=$1
  local dest=$2

  if [ -f "$dest" ]; then
    echo -e "${YELLOW}⚠ ${dest} already exists, skipping...${NC}"
  else
    if [ -f "$source" ]; then
      cp "$source" "$dest"
      echo -e "${GREEN}✓ Created ${dest}${NC}"
    else
      echo -e "${YELLOW}⚠ ${source} not found, skipping...${NC}"
    fi
  fi
}

# Create .env.test files for each service
echo ""
echo "Creating .env.test files from examples..."

copy_env_file "packages/web/.env.test.example" "packages/web/.env.test"
copy_env_file "packages/api/.env.test.example" "packages/api/.env.test"
copy_env_file "packages/mathapi/.env.test.example" "packages/mathapi/.env.test"

echo ""
echo -e "${GREEN}✓ Test environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit the .env.test files in each package and add your test credentials"
echo "2. Run 'docker-compose -f docker-compose.test.yml up' to start test services"
echo "3. Run 'npm run test:e2e' in packages/web to run Playwright tests"
echo ""
