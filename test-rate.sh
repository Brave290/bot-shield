#!/bin/bash
API_KEY="REDACTED_API_KEY_1" # UPDATE THIS IF YOU ROTATED KEYS
echo "=== Hammering API to test Rate Limiter ==="
for i in {1..105}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://bo-tshield.vercel.app/api/challenge \
    -H "Content-Type: application/json" \
    -d "{\"apiKey\":\"$API_KEY\",\"mouseData\":{\"distance\":10,\"time\":50},\"typingData\":{\"totalChars\":5,\"totalTime\":50},\"fingerprint\":\"stress-test\"}")
  
  if [ "$STATUS" = "429" ]; then
    echo "Request $i: HTTP 429 (RATE LIMITED)"
  else
    echo "Request $i: HTTP $STATUS"
  fi
done
