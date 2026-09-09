# Changelog

## [1.0.0-security-patch] - 2026-09-09

### Security Fixes
- **CRITICAL**: Implemented real behavioral telemetry in client widget (was all-zero stub)
- **CRITICAL**: Fixed JWT secret encoding mismatch in sign/verify operations
- **HIGH**: Added Zod schema validation to all API endpoints
- **HIGH**: Enforced fail-closed rate limiting with proper error handling
- **MEDIUM**: Improved secret storage with HMAC-SHA256 key derivation
- **MEDIUM**: Added dynamic API origin detection for custom domain support
- **MEDIUM**: Created `.env.example` for self-hosting setup

### Features
- Real-time mouse movement tracking (distance, time, curves)
- Real-time keyboard tracking (typing speed, backspace frequency)
- Multi-signal browser fingerprinting
- Dynamic widget API origin auto-detection
- Comprehensive input validation with Zod

### Improvements
- Enhanced error handling with explicit HTTP status codes (400, 401, 403, 429, 500, 503)
- Improved bot classification with edge case handling
- Better documentation in scoring engine and bot type detection
- Consistent key derivation for JWT operations

### Breaking Changes
- None - all changes are backward compatible

### Migration Required
- Optional: Run `/api/migrate-secrets` to hash all plaintext secrets
- Update `.env.local` using new `.env.example` as template

### Known Issues
- None

### Testing
- All core functionality validated with smoke tests
- Recommended: Add unit tests for scoring engine
- Recommended: Add integration tests for API workflows
