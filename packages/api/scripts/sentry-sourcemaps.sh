#!/bin/bash

# Only upload sourcemaps if SENTRY_AUTH_TOKEN is available
if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "⚠️  SENTRY_AUTH_TOKEN not found - skipping sourcemap upload"
  echo "This is normal in CI test environments"
  exit 0
fi

echo "📤 Uploading sourcemaps to Sentry..."
sentry-cli sourcemaps inject --org vanden-it --project budget-ai-api ./dist
sentry-cli sourcemaps upload --org vanden-it --project budget-ai-api ./dist
echo "✅ Sourcemaps uploaded successfully"
