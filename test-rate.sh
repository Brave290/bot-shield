#!/bin/bash
API_KEY=$(grep -o 'bs_live_[a-z0-9]*' test-api.sh | head -1)
echo "Firing 120 requests, 15 at a time..."
seq 1 120 | xargs -P 15 -I{} curl -s -o /dev/null -w "Req {} -> %{http_code}\n" \
  -X POST https://bo-tshield.vercel.app/api/challenge \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\":\"$API_KEY\",\"mouseData\":{\"distance\":10,\"time\":50},\"typingData\":{\"totalChars\":5,\"totalTime\":50},\"fingerprint\":\"stress\"}" | sort | uniq -c | sort -rn
