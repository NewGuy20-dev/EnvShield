# EnvShield Backlog Completion Plan

**Status**: High Priority & Approved for AI execution  
**Created**: Nov 15, 2025  
**Target Completion**: 10 calendar days (AI factory team)  

This plan details how to finish the remaining items from `TECHNICAL_PLAN_PHASES2_3_6.md`, prioritized by dependencies and impact.

---

## Executive Summary

This plan assumes an AI "factory droid" team: a coordinator/orchestrator agent plus specialized coding agents (backend/API, frontend/UI, CLI/tooling, QA/Security). Agents work in parallel but must obey dependency and migration gates.

- **Coordinator responsibilities**:
  - Read this document as the primary specification.
  - Instantiate task-specific agents per subsection (e.g. `1.1`, `2.3`, `3.2`).
  - Enforce dependency ordering and Go/No-Go gates before advancing days.
  - Keep Prisma schema, Better Auth config, and MAIN_DOC.md as sources of truth.
- **Specialized agents**:
  - **Backend/API**: `app/api/*`, `lib/*`, Prisma schema, migrations, scripts.
  - **Frontend/UI**: `app/(auth|dashboard)/*`, `components/*`, UX, accessibility.
  - **CLI/Tooling**: `cli/src/*`, DX improvements, packaging.
  - **QA/Security**: tests, rate-limits, RBAC checks, audit logging consistency.

### High-Level 10-Day Schedule (AI Multi-Agent)

- **Days 1–2 – Workstream 1**: CLI Better Auth integration, 2FA alignment, API token hardening.
- **Days 3–4 – Workstream 2**: Email verification + password reset confirms, invite acceptance, security alert queue, basic UIs.
- **Days 5–6 – Workstream 3**: Import/export parsers, APIs, dashboard drawer, CLI commands.
- **Days 7–8 – Workstream 4**: Search backend (indexes + API), search UI, CLI search + diff/ completion/ bulk ops.
- **Days 9–10 – Workstream 5**: OAuth linking, optional CLI TUI, full testing pass, docs and release polish.

All detailed subsections below (1.x–5.x) are treated as **atomic tasks** for droids. The coordinator should parallelize any tasks that are marked as independent and respect the dependency graph section.

---

## Workstream 1 (Day 1–2): CLI Better Auth Integration
**Goal**: Align CLI authentication with Better Auth + 2FA, remove plaintext token storage

### 1.1 Backend: CLI Auth Route Refactor
**File**: `app/api/v1/cli/auth/route.ts`

**Tasks**:
1. Add `twoFactorToken` and `backupCode` optional fields to `bodySchema`
2. Replace manual password verification with Better Auth:
   ```typescript
   const authResult = await auth.api.signInEmail({
     body: { email: parsed.email, password: parsed.password },
     headers: req.headers,
     request: req,
   });
   ```
3. Check if user has 2FA enabled:
   - If yes and no 2FA code provided: return `{ twoFactorRequired: true, methods: ['totp', 'backup'] }` (status 428)
   - If yes and code provided: validate via `verifyTwoFactorToken` or `verifyBackupCode`
   - If invalid: throw `AuthError('Invalid 2FA code')`
4. Generate API token only after successful auth + 2FA
5. Add audit logging: `logSecurityEvent('cli_token_created', 'medium', { userId, tokenId, ip })`

**Validation**:
- Unit test: authenticate with/without 2FA, verify token generation
- Integration test: CLI login flow with 2FA user returns challenge

**Dependencies**: None  
**Effort**: 4-6 hours

---

### 1.2 Backend: Prisma Token Schema Cleanup
**File**: `prisma/schema.prisma`

**Tasks**:
1. Create migration `20251115_remove_plaintext_token`:
   ```sql
   -- Ensure tokenDigest exists and is populated
   UPDATE api_tokens SET token_digest = encode(sha256(token::bytea), 'hex') WHERE token_digest IS NULL;
   
   -- Drop the plaintext token column
   ALTER TABLE api_tokens DROP COLUMN token;
   ```
2. Update `ApiToken` model:
   ```prisma
   model ApiToken {
     id          String   @id @default(cuid())
     userId      String
     tokenDigest String   @unique  // SHA-256 digest for fast lookup
     tokenHash   String?  // Bcrypt hash for verification (legacy)
     name        String?
     lastUsedAt  DateTime?
     expiresAt   DateTime?
     createdAt   DateTime @default(now())
     
     user User @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@map("api_tokens")
     @@index([userId])
     @@index([tokenDigest])
   }
   ```
3. Update `lib/authMiddleware.ts` to remove fallback for `token` column lookup

**Validation**:
- Run migration on dev DB
- Verify existing tokens still validate via digest lookup
- Confirm `tokenHash` field never stored plaintext

**Dependencies**: 1.1  
**Effort**: 2-3 hours

---

### 1.3 CLI: Interactive Login with 2FA
**File**: `cli/src/commands/login.ts`

**Tasks**:
1. Replace token prompt with email/password/TOTP flow:
   ```typescript
   const { email, password } = await inquirer.prompt([
     { type: 'input', name: 'email', message: 'Email:' },
     { type: 'password', name: 'password', message: 'Password:', mask: '*' }
   ]);
   
   let response = await api.post('/cli/auth', { email, password, tokenName });
   
   if (response.status === 428 && response.data.twoFactorRequired) {
     const { code } = await inquirer.prompt([
       { type: 'input', name: 'code', message: '2FA Code (or backup code):' }
     ]);
     response = await api.post('/cli/auth', { email, password, twoFactorToken: code, tokenName });
   }
   ```
2. Add `--token` flag for non-interactive token-based login (dashboard-generated tokens)
3. Add `--profile <name>` flag for multi-profile support
4. Validate token response and save to config

**Validation**:
- Manual test: `envshield login` with 2FA user
- Manual test: `envshield login --token esh_...` for CI/CD
- Verify config saved to correct profile

**Dependencies**: 1.1, 1.2  
**Effort**: 4-5 hours

---

### 1.4 CLI: Multi-Profile Config Support
**File**: `cli/src/utils/config.ts`

**Tasks**:
1. Update config schema:
   ```typescript
   interface Config {
     activeProfile: string;
     profiles: Record<string, {
       apiUrl: string;
       token: string;
       createdAt: string;
     }>;
   }
   ```
2. Refactor `saveConfig` to accept profile name
3. Add `getActiveProfile()` helper
4. Ensure file permissions (`chmod 600`) on write
5. Create profile management commands:
   - `cli/src/commands/profile.ts`: list/use/add/remove subcommands

**Validation**:
- Unit test: save/load multiple profiles
- Manual test: switch between profiles and verify API calls use correct token

**Dependencies**: 1.3  
**Effort**: 3-4 hours

---

### 1.5 CLI: Update Whoami Command
**File**: `cli/src/commands/whoami.ts`

**Tasks**:
1. Display token metadata (name, expires, last used)
2. Show active profile name
3. Add `--json` flag for machine-readable output

**Validation**:
- Manual test: `envshield whoami` shows token details
- Verify API response includes token metadata

**Dependencies**: 1.4  
**Effort**: 1-2 hours

---

## Workstream 2 (Day 3–4): Email Flow Completion
**Goal**: Finish email verification, password reset confirmation, invite acceptance, security alerts

### 2.1 Backend: Email Verification Confirm Endpoint
**File**: `app/api/v1/auth/verify-email/route.ts` (new)

**Tasks**:
1. Accept POST with `{ email, code }`
2. Lookup verification record: `identifier: email_verification_${email.toLowerCase()}`
3. Validate code via bcrypt comparison
4. On success:
   - Set `user.emailVerified = true`
   - Delete verification record
   - Log audit event: `logSecurityEvent('email_verified', 'low', { userId })`
5. Return generic message to prevent enumeration

**Validation**:
- Integration test: register → verify flow updates DB field
- Test expired code returns 400
- Test invalid code returns 400

**Dependencies**: None  
**Effort**: 2-3 hours

---

### 2.2 Backend: Email Verification Resend Endpoint
**File**: `app/api/v1/auth/verification/resend/route.ts` (new)

**Tasks**:
1. Accept POST with `{ email }`
2. Rate limit: 5 requests per hour per email
3. Generate new 6-digit code, hash, update verification record
4. Send via `sendVerificationEmail`
5. Return generic success message

**Validation**:
- Test rate limiting works
- Verify new code invalidates old code

**Dependencies**: 2.1  
**Effort**: 2 hours

---

### 2.3 Backend: Password Reset Confirmation Endpoint
**File**: `app/api/v1/auth/password/reset-confirm/route.ts` (new)

**Tasks**:
1. Accept POST with `{ token, password }`
2. Lookup verification record: `identifier: password_reset_${email}`
3. Validate token via bcrypt, check expiry
4. Validate new password strength (Zod schema)
5. Hash password with bcrypt(12), update user
6. Delete verification record
7. Optional: sign out all user sessions via Better Auth
8. Log audit event + queue security alert

**Validation**:
- Integration test: request → confirm flow updates password
- Test token reuse fails
- Test login with new password succeeds

**Dependencies**: 2.1  
**Effort**: 3-4 hours

---

### 2.4 Backend: Invite Acceptance Endpoint
**File**: `app/api/v1/invites/[token]/accept/route.ts` (new)

**Tasks**:
1. Accept POST (authenticated user) or redirect (new user)
2. Lookup `ProjectInvite` by token, check expiry
3. If user exists:
   - Create `ProjectMember` with specified role
   - Delete invite
   - Redirect to project dashboard
4. If new user:
   - Store invite token in session
   - Redirect to `/register?invite=${token}`
   - After registration, auto-accept invite
5. Log audit event: `action: 'project_member_added'`

**Validation**:
- Test existing user can accept
- Test new user registration + auto-accept flow
- Test expired invite returns 410

**Dependencies**: None  
**Effort**: 4-5 hours

---

### 2.5 Backend: Security Alert Queue Implementation
**File**: `lib/securityEvents.ts` (new)

**Tasks**:
1. Implement in-memory queue with deduplication:
   ```typescript
   const alertQueue: Map<string, { userId: string, type: string, metadata: any, timestamp: number }> = new Map();
   
   export function queueSecurityAlert({ userId, type, metadata }) {
     const key = `${userId}:${type}`;
     const lastAlert = alertQueue.get(key);
     const now = Date.now();
     
     // Throttle: min 6 hours between same alert type
     if (lastAlert && now - lastAlert.timestamp < 6 * 60 * 60 * 1000) return;
     
     alertQueue.set(key, { userId, type, metadata, timestamp: now });
     
     // Process immediately or defer to worker
     processSecurityAlert({ userId, type, metadata });
   }
   
   async function processSecurityAlert(alert) {
     const user = await prisma.user.findUnique({ where: { id: alert.userId } });
     if (!user) return;
     
     await sendSecurityAlertEmail(user.email, alert.type, alert.metadata);
     
     await prisma.securityAlert.create({
       data: { userId: alert.userId, type: alert.type, metadata: alert.metadata }
     });
   }
   ```
2. Create triggers for:
   - Failed logins (>=3 in 10 min)
   - New device login
   - Password changed
   - 2FA disabled
   - API token created
3. Update relevant routes to call `queueSecurityAlert`

**Validation**:
- Test repeated failed logins generate single email
- Test throttling prevents spam

**Dependencies**: None  
**Effort**: 4-6 hours

---

### 2.6 Backend: Weekly Audit Digest Script
**File**: `scripts/send-weekly-digest.ts` (new)

**Tasks**:
1. Accept CLI args: `--project <slug>` or `--all`
2. Query `AuditLog` for last 7 days, group by project
3. Generate stats:
   - Total actions
   - Top users
   - Variable changes count
   - Member additions/removals
4. Render email template via `sendAuditDigestEmail`
5. Update `Project.digestSentAt` timestamp
6. Log execution results

**Validation**:
- Dry run prints email preview
- Verify stats match DB queries
- Test with RESEND_API_KEY missing (logs warning)

**Dependencies**: None  
**Effort**: 4-5 hours

---

### 2.7 Frontend: Email Verification UI
**File**: `app/(auth)/verify-email/page.tsx` (new)

**Tasks**:
1. Accept query param `?email=...`
2. Prompt for 6-digit code
3. Call `/api/v1/auth/verify-email` on submit
4. Show success message + redirect to dashboard
5. Add "Resend code" button (rate limited)

**Validation**:
- Manual test full flow
- Verify error states render correctly

**Dependencies**: 2.1, 2.2  
**Effort**: 3-4 hours

---

### 2.8 Frontend: Password Reset Confirmation UI
**File**: `app/(auth)/reset-password/page.tsx` (new)

**Tasks**:
1. Accept query param `?token=...`
2. Show password + confirm password fields
3. Validate strength client-side (Zod)
4. Call `/api/v1/auth/password/reset-confirm` on submit
5. Show success message + redirect to login

**Validation**:
- Manual test full flow
- Verify password strength validation

**Dependencies**: 2.3  
**Effort**: 3-4 hours

---

## Workstream 3 (Day 5–6): Phase 6 Advanced Features - Import/Export
**Goal**: Support dotenv, JSON, YAML import/export with conflict resolution

### 3.1 Backend: Import/Export Parsers
**File**: `lib/importExport.ts` (new)

**Tasks**:
1. Install dependencies: `js-yaml`
2. Implement parsers:
   ```typescript
   export function parseEnvFile(content: string): Record<string, string>
   export function parseJsonFile(content: string): Record<string, string>
   export function parseYamlFile(content: string): Record<string, string>
   ```
3. Implement diff generator:
   ```typescript
   export function generateDiff(existing: Variable[], imported: Record<string, string>): {
     added: string[];
     updated: Array<{ key: string; oldValue: string; newValue: string }>;
     unchanged: string[];
   }
   ```
4. Implement import applier with conflict strategy:
   ```typescript
   export async function applyImport(
     environmentId: string, 
     imported: Record<string, string>,
     strategy: 'overwrite' | 'skip' | 'merge',
     userId: string
   ): Promise<{ created: number; updated: number; skipped: number }>
   ```

**Validation**:
- Unit tests for each parser with sample files
- Test diff logic with various scenarios
- Test apply logic respects conflict strategy

**Dependencies**: None  
**Effort**: 6-8 hours

---

### 3.2 Backend: Import/Export API Endpoints
**Files**: 
- `app/api/v1/projects/[slug]/environments/[env]/variables/import/route.ts` (new)
- `app/api/v1/projects/[slug]/environments/[env]/variables/export/route.ts` (new)

**Tasks**:
1. **Import endpoint**:
   - Accept POST with `{ format, content, strategy, dryRun }`
   - Validate RBAC (DEVELOPER+)
   - Parse content via appropriate parser
   - Generate diff
   - If `dryRun: true`, return diff without applying
   - If `dryRun: false`, apply changes and return summary
   - Log audit event with metadata
2. **Export endpoint**:
   - Accept GET with query `?format=dotenv|json|yaml`
   - Validate RBAC (VIEWER+)
   - Fetch all variables, decrypt values
   - Format via appropriate serializer
   - Return file download response
   - Log audit event

**Validation**:
- Integration test: import → dry run → apply
- Test RBAC enforcement
- Test export formats match input formats

**Dependencies**: 3.1  
**Effort**: 6-8 hours

---

### 3.3 Frontend: Import/Export Drawer
**File**: `app/(dashboard)/projects/[projectId]/environments/[envId]/page.tsx` + `components/variables/ImportExportDrawer.tsx` (new)

**Tasks**:
1. Add "Import" and "Export" buttons to environment page
2. Create drawer component with:
   - File dropzone (react-dropzone)
   - Format selector (dotenv/JSON/YAML)
   - Conflict strategy radio buttons
   - Diff preview table (if dry run)
   - Confirm/cancel actions
3. Handle API responses and show toast notifications

**Validation**:
- Manual test: upload file → preview diff → apply
- Test error handling (invalid format, parse errors)

**Dependencies**: 3.2  
**Effort**: 6-8 hours

---

### 3.4 CLI: Import/Export Commands
**Files**: 
- `cli/src/commands/import.ts` (new)
- `cli/src/commands/export.ts` (new)

**Tasks**:
1. **Import command**:
   ```bash
   envshield import --file secrets.yaml --format yaml --env staging --dry-run
   envshield import --file .env --project my-app --env prod --strategy overwrite
   ```
   - Read file, call import API
   - Show diff table (colored output via chalk)
   - Prompt for confirmation unless `--yes` flag
2. **Export command**:
   ```bash
   envshield export --format json --env prod --output secrets.json
   envshield export --project my-app --env staging --format dotenv
   ```
   - Call export API
   - Write to file or stdout

**Validation**:
- Manual test all flag combinations
- Test interactive confirmation flow

**Dependencies**: 3.2  
**Effort**: 5-6 hours

---

## Workstream 4 (Day 7–8): Phase 6 Advanced Features - Search & CLI Enhancements
**Goal**: Variable search with facets, CLI diff previews, shell completion, profiles

### 4.1 Backend: Search API with Full-Text Index
**File**: `app/api/v1/search/variables/route.ts` (new)

**Tasks**:
1. Create migration for full-text search index:
   ```sql
   CREATE INDEX idx_variables_key_gin ON variables USING gin(to_tsvector('simple', key));
   CREATE INDEX idx_variables_value_gin ON variables USING gin(to_tsvector('simple', value));
   ```
2. Implement search endpoint:
   - Accept query params: `q`, `projectId`, `environmentId`, `role`, `updatedBy`, `dateRange`
   - Build Prisma query with filters
   - Use `@@search` for full-text matching on key
   - Paginate results (limit 50)
   - Respect RBAC (mask values for VIEWER)
   - Return facets (project counts, env counts)
3. Rate limit: 30 requests per minute
4. Log audit event if `decrypt` flag used

**Validation**:
- Integration test: search with various filters
- Performance test: ensure <500ms with 10k variables
- Test RBAC masking

**Dependencies**: None  
**Effort**: 8-10 hours

---

### 4.2 Frontend: Global Search Bar
**Files**:
- `components/search/VariableSearchBar.tsx` (new)
- `app/(dashboard)/search/page.tsx` (new)

**Tasks**:
1. Add search bar to dashboard header
2. Implement debounced search (300ms)
3. Show dropdown with quick results (5 items)
4. Full results page with filters sidebar:
   - Project filter
   - Environment filter
   - Date range picker
   - Role requirement filter
5. Display results table with highlight snippets
6. Add "Save search" feature (localStorage)

**Validation**:
- Manual test: search from header, navigate to results
- Test filters update results
- Test saved searches persist

**Dependencies**: 4.1  
**Effort**: 8-10 hours

---

### 4.3 CLI: Search Command
**File**: `cli/src/commands/search.ts` (new)

**Tasks**:
1. Implement command:
   ```bash
   envshield search "database" --project my-app --env prod
   envshield search "API_KEY" --json
   envshield search "secret" --decrypt  # requires DEVELOPER+ role
   ```
2. Display results table with:
   - Key (highlighted match)
   - Environment
   - Project
   - Last updated
   - Partial value (masked unless --decrypt)
3. Add `--json` flag for machine-readable output

**Validation**:
- Manual test: search across projects
- Test pagination if results > 50

**Dependencies**: 4.1  
**Effort**: 4-5 hours

---

### 4.4 CLI: Diff Preview on Push
**File**: `cli/src/commands/push.ts`

**Tasks**:
1. Before pushing, fetch current remote variables
2. Generate local diff using `diff` library
3. Display colored diff:
   - Green for added keys
   - Red for removed keys
   - Yellow for updated keys (show old → new value preview)
4. Prompt for confirmation: "Apply these changes? (y/n)"
5. Add `--force` flag to skip confirmation
6. Add `--skip-confirm` flag alias

**Validation**:
- Manual test: modify local .env, run push, verify diff
- Test --force skips prompt

**Dependencies**: None  
**Effort**: 4-5 hours

---

### 4.5 CLI: Shell Completion
**File**: `cli/src/commands/completion.ts` (new)

**Tasks**:
1. Use Commander's built-in completion or `tabtab` library
2. Implement command:
   ```bash
   envshield completion bash > /etc/bash_completion.d/envshield
   envshield completion zsh > ~/.zsh/completions/_envshield
   envshield completion fish > ~/.config/fish/completions/envshield.fish
   ```
3. Generate completion scripts for:
   - Commands (login, pull, push, etc.)
   - Flags (--project, --env, --format)
   - Dynamic values (project slugs, env names)

**Validation**:
- Manual test in each shell
- Verify tab completion suggests commands

**Dependencies**: None  
**Effort**: 4-6 hours

---

### 4.6 CLI: Bulk Operations Command
**File**: `cli/src/commands/bulk.ts` (new)

**Tasks**:
1. Implement subcommands:
   ```bash
   envshield bulk delete KEY1 KEY2 KEY3 --env staging --project my-app
   envshield bulk update --file updates.json --env prod
   ```
2. Create backend endpoint: `DELETE /api/v1/.../variables` (accepts `{ keys: string[] }`)
3. Enforce RBAC (ADMIN+ for bulk delete)
4. Show confirmation prompt with summary
5. Log bulk audit event

**Validation**:
- Manual test: bulk delete multiple keys
- Verify RBAC blocks unauthorized users

**Dependencies**: None  
**Effort**: 4-5 hours

---

## Workstream 5 (Day 9–10): Polish & Optional Features
**Goal**: OAuth linking, testing, documentation, TUI (stretch)

### 5.1 Backend: OAuth Account Linking
**Files**:
- `app/api/v1/auth/oauth/link/route.ts` (new)
- `app/api/v1/auth/oauth/unlink/route.ts` (new)

**Tasks**:
1. **Link endpoint**:
   - Accept GET with `?provider=google|github`
   - Generate Better Auth link URL: `auth.api.createSocialLinkSession({ provider, userId })`
   - Redirect to OAuth provider
   - Callback handled by Better Auth
2. **Unlink endpoint**:
   - Accept POST with `{ provider, password, twoFactorToken? }`
   - Verify password + 2FA
   - Ensure not unlinking last auth method
   - Call Better Auth unlink: `auth.api.unlinkSocialAccount({ userId, provider })`
   - Log audit event
3. Extend settings page loader to fetch linked accounts

**Validation**:
- Manual test: link Google account from settings
- Test unlink requires password + 2FA
- Test cannot unlink last method

**Dependencies**: None  
**Effort**: 6-8 hours

---

### 5.2 Frontend: OAuth Linking UI
**File**: `app/(dashboard)/settings/security/page.tsx`

**Tasks**:
1. Add "Connected Accounts" section below 2FA settings
2. Render provider cards (Google, GitHub):
   - Show linked status (email + unlink button)
   - Show not linked (link button)
3. Implement link/unlink modals
4. Handle OAuth callback errors

**Validation**:
- Manual test full link/unlink flow
- Test UI updates after linking

**Dependencies**: 5.1  
**Effort**: 4-5 hours

---

### 5.3 CLI: TUI (Stretch)
**File**: `cli/src/commands/tui.ts` (new)

**Tasks**:
1. Install `ink` + `ink-text-input`
2. Implement interactive TUI:
   - Project list (arrow keys to navigate)
   - Environment list within project
   - Variable list within environment
   - Actions: view/edit/delete (keyboard shortcuts)
3. Add `envshield tui` command

**Validation**:
- Manual test: navigate projects, edit variable

**Dependencies**: None (optional)  
**Effort**: 10-12 hours

---

### 5.4 Testing & Documentation
**Tasks**:
1. Write integration tests for:
   - 2FA flows (setup, challenge, disable)
   - Email flows (verification, reset)
   - Import/export (all formats)
   - Search API
2. Write CLI unit tests:
   - Config manager
   - Parsers
   - Command validation
3. Update `README.md` with:
   - New CLI commands
   - 2FA setup guide
   - Import/export examples
4. Create `docs/CLI_REFERENCE.md` with full command list
5. Add JSDoc comments to new utility functions

**Validation**:
- Run `npm run test` (all pass)
- Review test coverage report
- Peer review documentation

**Dependencies**: All previous tasks  
**Effort**: 12-16 hours

---

## Dependency Graph

```
Sprint 1 (CLI Auth):
  1.1 → 1.2 → 1.3 → 1.4 → 1.5

Sprint 2 (Email):
  2.1 → 2.2 (parallel)
  2.1 → 2.3 (parallel)
  2.4 (independent)
  2.5 (independent)
  2.6 (independent)
  2.7 depends on 2.1, 2.2
  2.8 depends on 2.3

Sprint 3 (Import/Export):
  3.1 → 3.2 → 3.3, 3.4 (parallel)

Sprint 4 (Search & CLI):
  4.1 → 4.2, 4.3 (parallel)
  4.4, 4.5, 4.6 (independent)

Sprint 5 (Polish):
  5.1 → 5.2
  5.3 (independent, stretch)
  5.4 (blocked by all)
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Better Auth API breaking changes | High | Pin version, test in staging first, maintain wrapper |
| CLI token migration breaks existing users | High | Provide migration script, communicate via email/dashboard banner, support legacy tokens for 1 month |
| Import/export data loss | Critical | Require dry-run by default, add backup prompt, log all operations |
| Search performance degradation | Medium | Add indexes upfront, cache heavy queries, limit result size |
| Email deliverability issues | Medium | Implement fallback logging, add retry queue, health check endpoint |

---

## Go/No-Go Gates

1. **End of Sprint 1**: CLI login works with 2FA, existing tokens still valid, migration script tested
2. **End of Sprint 2**: All email flows functional in staging, security alerts triggering correctly
3. **End of Sprint 3**: Import/export works for all 3 formats, dry-run prevents data loss
4. **End of Sprint 4**: Search returns results <500ms, CLI enhancements deployed to beta users
5. **End of Sprint 5**: >80% test coverage, all docs updated, OAuth linking operational

---

## Acceptance Criteria Summary

- [ ] CLI authenticates via email/password/2FA (no dashboard token required)
- [ ] Multi-profile config supports team workflows
- [ ] Email verification required for new signups
- [ ] Password reset flow completes successfully
- [ ] Project invites can be accepted by new/existing users
- [ ] Security alerts sent for suspicious activity (throttled)
- [ ] Weekly audit digest scheduled and tested
- [ ] Import dotenv/JSON/YAML with conflict resolution
- [ ] Export all formats from dashboard + CLI
- [ ] Global search finds variables across projects (<500ms)
- [ ] CLI shows diff before push, supports shell completion
- [ ] OAuth accounts can be linked/unlinked with 2FA verification
- [ ] All features have integration tests (>80% coverage)

---

## Execution Schedule (AI Multi-Agent, 10 Days)

The following schedule assumes an AI coordinator plus multiple specialized droids running in parallel. The "hours" column is **human-equivalent engineering effort**; the calendar duration is constrained by dependencies, migrations, and validation gates, not individual productivity.

| Day(s) | Workstream | Focus | Human-Equivalent Hours (approx.) | Notes |
|--------|------------|-------|-----------------------------------|-------|
| 12 | 1 | CLI Better Auth integration, 2FA alignment, token schema cleanup | 1822 | Backend & CLI agents work in parallel on 1.11.5; migrations are gated and must pass tests before any downstream work uses new token shape. |
| 34 | 2 | Email verification + reset confirm, invites, security alerts, basic UIs | 2632 | Backend, frontend, and security agents run 2.12.8 mostly in parallel; coordinator enforces DB + API contract stability before UI agents wire pages. |
| 56 | 3 | Import/export parsers, APIs, dashboard drawer, CLI import/export | 1722 | 3.13.4 are split across backend, frontend, and CLI agents; dry-run behavior and audit logging must be verified before allowing bulk writes in production. |
| 78 | 4 | Search backend, search UI, CLI search, diff preview, completion, bulk ops | 2836 | 4.14.6 are heavily parallelizable; coordinator must watch for search performance regressions and RBAC leaks. |
| 910 | 5 | OAuth linking, optional CLI TUI, integration tests, docs & release polish | 3241 | Focus on 5.15.4: security-sensitive OAuth flows, global testing, and documentation. TUI (5.3) is optional if time-constrained. |

**Total human-equivalent effort**: ~121153 hours, executed by an AI factory team within **10 calendar days**, assuming aggressive parallelization and continuous execution.

---

## Next Steps

1. **Coordinator agent**: ingest this document as the canonical backlog and parse each numbered subsection (`1.1`  `5.4`) into executable tasks.
2. Instantiate **specialized droids** for Backend/API, Frontend/UI, CLI/Tooling, and QA/Security; assign tasks according to the Workstream and day mapping.
3. Use the **Dependency Graph** and **Execution Schedule** sections to decide which tasks run in parallel and which must wait for migrations, feature flags, or contract stabilization.
4. Enforce **Go/No-Go Gates** at the end of Days 2, 4, 6, 8, and 10 (matching Workstreams 15) before advancing to the next block of work.
5. Continuously run `npm run lint`, relevant tests, and Prisma migrations in a staging environment; block any production-facing merges until acceptance criteria are satisfied.
6. Surface status, test results, and detected regressions to the human maintainer at least once per day, or immediately for security-sensitive failures.

