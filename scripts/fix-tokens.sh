#!/bin/bash

# Update all tokens to production environment
ENDPOINT="https://watdplayer-auth.vercel.app/api/notifications/fix-env"

echo "🔧 Updating all tokens to production environment..."

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"targetEnvironment": "production"}' | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "✅ Done"
