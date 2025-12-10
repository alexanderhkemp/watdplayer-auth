#!/bin/bash

# Test push notification script
# Usage: ./scripts/test-push.sh [environment]
# environment: "development" (default) or "production"

ENVIRONMENT="${1:-development}"
ENDPOINT="https://watdplayer-auth.vercel.app/api/notifications/send"

echo "🔔 Sending test push notification..."
echo "   Environment: $ENVIRONMENT"
echo ""

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Notification\",
    \"body\": \"This is a test push from WATDplayer at $(date '+%H:%M:%S')\",
    \"environment\": \"$ENVIRONMENT\"
  }" | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "✅ Done"
