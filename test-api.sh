#!/bin/bash
API_KEY="REDACTED_API_KEY_2"
SECRET_KEY="REDACTED_SECRET_KEY_1"

echo "=== Testing Challenge Endpoint ==="
CHALLENGE=$(curl -s -X POST https://bo-tshield.vercel.app/api/challenge \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$API_KEY\",
    \"mouseData\": {\"distance\": 800, \"time\": 5000, \"curves\": 12},
    \"typingData\": {\"totalChars\": 50, \"totalTime\": 10000, \"backspaces\": 2},
    \"fingerprint\": \"test-human\"
  }")
echo "$CHALLENGE" | jq .

TOKEN=$(echo "$CHALLENGE" | jq -r '.token')
echo ""
echo "=== Testing Verify Endpoint ==="
curl -s -X POST https://bo-tshield.vercel.app/api/verify \
  -H "Content-Type: application/json" \
  -d "{
    \"secretKey\": \"$SECRET_KEY\",
    \"token\": \"$TOKEN\"
  }" | jq .
