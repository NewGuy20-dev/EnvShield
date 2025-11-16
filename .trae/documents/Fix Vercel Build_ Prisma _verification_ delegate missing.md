## Summary

* Keep the original implementation plan and incorporate the requested refinements without changing the intended behavior.

* Implement browser-based OAuth/device flow for `envshield login` end-to-end using existing EnvShield utilities and conventions.

## Phase 1: Prisma Model & Migration

* Edit `prisma/schema.prisma` to add `CliDeviceSession` exactly:

  * Fields: `id String @id @default(cuid())`, `deviceCode String @unique`, `userCode String?`, `status String`, `userId String?`, `tokenId String?`, `tokenName String?`, `encryptedToken String? @db.Text`, `createdAt DateTime @default(now())`, `expiresAt DateTime`, `approvedAt DateTime?`, `consumedAt DateTime?`, `clientIp String?`, `userAgent String?`.

  * Relations: `user  User? @relation(fields: [userId], references: [id])`, `token ApiToken? @relation(fields: [tokenId], references: [id])`.

  * Mapping/indexes: `@@map("cli_device_sessions")`, `@@index([deviceCode])`, `@@index([status])`, `@@index([expiresAt])`.

* Run: `npx prisma migrate dev --name add_cli_device_sessions` then `npx prisma generate`.

* Ensure no breaking changes to existing models.

## Phase 2: Backend Endpoints & Base URLs

* Create exact files:

  * `app/api/v1/cli/auth/device/start/route.ts` → `POST /api/v1/cli/auth/device/start`

  * `app/api/v1/cli/auth/device/poll/route.ts` → `GET /api/v1/cli/auth/device/poll`

  * `app/api/v1/cli/auth/device/complete/route.ts` → `POST /api/v1/cli/auth/device/complete`

* Shared utilities: rate limiting (`applyRateLimit`, `cliLimiter`, `getClientIdentifier`), error handling (`handleApiError`, `AuthError`, `ValidationError`), auth (`getAuthenticatedUserFromRequest`), encryption (`encryptForStorage`, `decryptFromStorage`), logging (`logSecurityEvent`), alerts (`queueSecurityAlert`), constants (`MAX_API_TOKENS_PER_USER`), crypto/bcrypt.

* Browser verification URL:

  * `const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';`

  * `const verificationUrl = ` ${baseUrl}/cli/login?code=${encodeURIComponent(deviceCode)}`;`

  * Do not include `/api/v1`.

### Start

* Zod body `{ tokenName?: string }`.

* Rate-limit; on exceed 429 with `logSecurityEvent('cli_rate_limit_exceeded','medium',{ identifier, endpoint:'/api/v1/cli/auth/device/start' })`.

* Generate `deviceCode`, optional `userCode`, `expiresAt = now + 10m`.

* Persist `CliDeviceSession` with `status='PENDING'`, `clientIp`, `userAgent`, `tokenName`.

* Log `cli_device_start` (low) and return `{ deviceCode, verificationUrl, expiresAt: ISO, pollInterval: 5, tokenName }`.

* Catch via `handleApiError`.

### Poll

* Parse `deviceCode`; rate-limit.

* If missing/expired or `status in ['EXPIRED','CONSUMED','CANCELLED']` → mark `EXPIRED` if needed; return 410 `{ status:'expired', message }`.

* If `PENDING` → 200 `{ status:'pending' }`.

* If `APPROVED` with `encryptedToken` and `tokenId`:

  * Decrypt: `const tokenPlain = decryptFromStorage(session.encryptedToken!)`.

  * Update to `status='CONSUMED'`, `encryptedToken=null`, `consumedAt=now`.

  * Return `{ status:'approved', token: tokenPlain, tokenId, tokenName, expiresAt? }`.

* Catch via `handleApiError`.

### Complete

* Authenticate with `getAuthenticatedUserFromRequest(req)`.

* Parse `{ deviceCode }`; load session.

* Not found → `ValidationError('Device session not found')`.

* Expired/invalid → `ValidationError('Device session expired')`.

* Idempotent: `APPROVED` + `tokenId` → 200 `{ status:'ok', message:'CLI login already approved.' }`.

* Generate API token (`esh_...`), compute `tokenDigest` (SHA-256) and `tokenHash` (bcrypt), enforce `MAX_API_TOKENS_PER_USER`, expiry `now + 1 year`, create `ApiToken`.

* Encrypt token: `const encryptedToken = encryptForStorage(tokenPlain)`.

* Update session: `status='APPROVED'`, `userId`, `tokenId`, `tokenName`, `encryptedToken`, `approvedAt=now`.

* Log `cli_device_approved` (medium) and `queueSecurityAlert({ type:'cli_token_created', metadata:{ tokenName: token.name, ip: getClientIdentifier(req) } })`.

* Response: `{ status:'ok', message:'CLI login approved. You can return to your terminal.' }`.

* Catch via `handleApiError`.

## Phase 3: `/cli/login` Frontend Page

* File: `app/(auth)/cli/login/page.tsx`.

* Read `code` query; missing → render error.

* If unauthenticated → redirect to `/login?redirect=/cli/login&code=${code}` using existing patterns.

* Optionally call `poll` once to decide expired vs confirm state.

* Authenticated + valid → render confirmation page showing user email and request info.

* Approve → POST `/api/v1/cli/auth/device/complete` with `{ deviceCode: code }`; success → show approval message; error → show response.

## Phase 4: CLI Changes

* Edit `cli/src/commands/login.ts` to make device flow default.

* Keep helpers: `createApiClient`/`apiRequest`, `startSpinner`/`success`, `saveConfig`/`getDefaultApiUrl`.

* Set `api.defaults.baseURL = apiUrl` (includes `/api/v1`).

* Call endpoints with paths relative to API base:

  * `'/cli/auth/device/start'`

  * `'/cli/auth/device/poll'`

  * `'/cli/auth/device/complete'`

* Print `verificationUrl`; implement `openInBrowser(url)` cross-platform (`start` on Windows, `open` on macOS, `xdg-open` on Linux).

* Poll `deviceCode` using `pollInterval` (default 5s) with \~15m timeout; handle `pending`/`approved`/`expired` (or HTTP 410) accordingly; save token via `saveConfig`.

* Preserve `--token` via `/cli/whoami` unchanged.

* Optional `--password` legacy mode only if retained.

## Phase 5: Security & Logging

* Plaintext tokens are never stored at rest:

  * Generate in memory; encrypt for `CliDeviceSession.encryptedToken`; clear and mark `CONSUMED` after poll returns token.

* All catch blocks use `handleApiError`.

* Log/alert:

  * Rate-limit → `cli_rate_limit_exceeded` (medium).

  * Start → `cli_device_start` (low); Approve → `cli_device_approved` (medium).

  * Token creation → `queueSecurityAlert({ type:'cli_token_created', ... })`.

## Phase 6: Tests & Verification

* Backend tests cover `start` creation, `poll` pending/approved/expired with consumption, `complete` token creation and idempotent behavior.

* CLI tests (if harness exists): mock `/start` + `/poll` for success, expired, timeout.

* Docs: update `docs/CLI_REFERENCE.md` login section to describe device flow and `--token`; note optional `--password` if kept.

* Run `npm run lint`, `npm run build`, `npx prisma migrate dev`.

* Manual E2E: `envshield login` opens `/cli/login?code=...`, approve, CLI saves token; `envshield login --token <esh_...>` works.

## References

* `lib/rateLimit.ts`, `lib/errors.ts`, `lib/authMiddleware.ts`, `lib/encryption.ts`, `lib/logger.ts`, `lib/securityEvents.ts`, `lib/constants.ts`.

* `cli/src/utils/api.ts`, `cli/src/utils/spinner.ts`, `cli/src/utils/config.ts`.

* `process.env.NEXT_PUBLIC_APP_URL` for verification URL construction.

