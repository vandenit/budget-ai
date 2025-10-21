#!/bin/bash

# Script to generate RSA key pair for end-to-end encryption
# Usage: ./scripts/generate-encryption-keys.sh

set -e

echo "Generating RSA key pair for end-to-end encryption..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

PRIVATE_KEY_FILE="$TEMP_DIR/server-private.pem"
PUBLIC_KEY_FILE="$TEMP_DIR/server-public.pem"

# Generate private key
echo "Generating private key..."
openssl genrsa -out "$PRIVATE_KEY_FILE" 2048

# Generate public key
echo "Generating public key..."
openssl rsa -in "$PRIVATE_KEY_FILE" -pubout -out "$PUBLIC_KEY_FILE"

# Read keys
PRIVATE_KEY=$(cat "$PRIVATE_KEY_FILE")
PUBLIC_KEY=$(cat "$PUBLIC_KEY_FILE")

# Encode to base64
PRIVATE_KEY_BASE64=$(echo "$PRIVATE_KEY" | base64 -w 0)
PUBLIC_KEY_BASE64=$(echo "$PUBLIC_KEY" | base64 -w 0)

echo ""
echo "=========================================="
echo "Keys generated successfully!"
echo "=========================================="
echo ""
echo "Add these to your .env file:"
echo ""
echo "SERVER_PRIVATE_KEY=$PRIVATE_KEY"
echo ""
echo "SERVER_PUBLIC_KEY=$PUBLIC_KEY"
echo ""
echo "=========================================="
echo "For Kubernetes secret (base64 encoded):"
echo "=========================================="
echo ""
echo "SERVER_PRIVATE_KEY_BASE64=$PRIVATE_KEY_BASE64"
echo ""
echo "SERVER_PUBLIC_KEY_BASE64=$PUBLIC_KEY_BASE64"
echo ""
echo "=========================================="
echo ""
echo "To create the Kubernetes secret:"
echo "1. Update kube/config/dev/api-encryption-secret.yml.template with the base64 values"
echo "2. Run: kubectl apply -f kube/config/dev/api-encryption-secret.yml"
echo ""
