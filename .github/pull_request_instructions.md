# Step-by-Step Guide to Complete the Audit Fixes

## Option A: Create Pull Request (AUTOMATED)

The audit-fixes branch is ready. Visit this URL to create a PR:

**https://github.com/Brave290/bot-shield/compare/main...audit-fixes**

Or use GitHub CLI:
```bash
gh pr create \
  --base main \
  --head audit-fixes \
  --title "security: fix critical vulnerabilities in bot detection and JWT handling" \
  --body "$(cat AUDIT_REPORT.md)"
```

---

## Option B: Manual Review Before Merging

### 1. View All Changes
```bash
git log main..audit-fixes --oneline
```

Expected commits:
- feat: implement real behavioral telemetry collection in client widget
- improve: add documentation and handle edge cases in bot classification
- refactor: improve scoring logic and add comprehensive documentation
- fix: add input validation, improve error handling, and enforce rate limiting
- fix: correct JWT key derivation and improve secret handling
- fix: enforce hashed-only secrets and improve key derivation
docs: add .env.example for self-hosting setup
- docs: add comprehensive security audit report and finalize all fixes

### 2. Review Detailed Diffs
```bash
# Review all changes
git diff main...audit-fixes

# Review specific file
git diff main...audit-fixes -- app/api/challenge/route.ts
git diff main...audit-fixes -- app/api/verify/route.ts
git diff main...audit-fixes -- lib/supabase/server.ts
git diff main...audit-fixes -- public/bot-shield.js
```

### 3. Build & Test Locally
```bash
# Checkout the branch
git checkout audit-fixes

# Install dependencies
npm install

# Run linting
npm run lint

# Build
npm run build

# Run smoke tests (requires API keys)
export SMOKE_API_KEY="bs_live_your_key"
export SMOKE_SECRET_KEY="sk_live_your_secret"
npm run smoke
```

### 4. Verify Security Changes

✅ **Input Validation** - Check `app/api/challenge/route.ts`
```bash
# Verify Zod schema is applied
grep -n "ChallengePayloadSchema" app/api/challenge/route.ts
```

✅ **Key Derivation** - Check `lib/supabase/server.ts`
```bash
# Verify deriveJWTKey function
grep -n "deriveJWTKey" lib/supabase/server.ts
```

✅ **Rate Limiting** - Check error handling
```bash
# Verify fail-closed behavior
grep -n "PGRST116" app/api/challenge/route.ts
```

✅ **Telemetry** - Check client widget
```bash
# Verify real tracking implementation
grep -n "mouseTracker\|keyboardTracker" public/bot-shield.js
```

---

## Option D: Deploy to Production

### Prerequisites
- [ ] All smoke tests pass
- [ ] Code review approved
- [ ] Branch is merged to main
- [ ] Environment variables are configured

### Deployment Steps

#### Step 1: Merge Branch
```bash
# If not yet merged
git checkout main
git pull origin main
git merge audit-fixes
git push origin main
```

#### Step 2: Verify Vercel Auto-Deploy
```bash
# Vercel automatically deploys on push to main
# Monitor deployment:
vercel --prod --logs

# Or check Vercel dashboard:
# https://vercel.com/dashboard
```

#### Step 3: Monitor Production
```bash
# Test deployed endpoints
curl -X POST https://bot-shield-tau.vercel.app/api/challenge \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"bs_live_...","mouseData":{...},"typingData":{...}}'

# Check logs
vercel logs --prod | grep -E "(Challenge|Verify|error)"
```

#### Step 4: Verify Real-World Telemetry
```bash
# Test human-like behavior (should pass)
curl -X POST https://bot-shield-tau.vercel.app/api/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey":"bs_live_...",
    "mouseData":{"distance":1200,"time":4200,"curves":14},
    "typingData":{"totalChars":60,"totalTime":9000,"backspaces":2},
    "fingerprint":"real-user"
  }'

# Expected response: {"status":"passed","token":"...","score":5}
```

#### Step 5: Run Smoke Tests Against Production
```bash
BASE_URL=https://bot-shield-tau.vercel.app \
SMOKE_API_KEY=bs_live_... \
SMOKE_SECRET_KEY=sk_live_... \
npm run smoke
```

### Rollback Plan (if needed)
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel will auto-deploy the revert
```

---

## Success Criteria

- ✅ All smoke tests pass
- ✅ No new security warnings
- ✅ Zero breaking changes
- ✅ Real telemetry is collected
- ✅ Rate limiting is enforced
- ✅ Input validation rejects malformed payloads
- ✅ JWT verification works end-to-end
- ✅ Production logs show no errors

---

## Support & Questions

See `AUDIT_REPORT.md` for detailed information about each fix.
See `CHANGELOG.md` for version history and migration notes.

**Ready to proceed?** Choose Option A, B, or D above and execute the steps.
