## 1. Overview

### 1.1 Current State vs. Target State
- **Auth**: Better Auth SDK configured (`lib/auth.ts`), but legacy JWT endpoints (`app/api/v1/auth/*`) still power login/logout/session + CLI auth flow; no 2FA wiring despite helper utilities in `lib/twoFactor.ts`.
- **Email**: `lib/email.ts` defines all transactional templates, yet routes such as `/app/api/v1/auth/register` and password reset flows still contain `// TODO` markers for sending emails; audit digest + security alerts not triggered.
- **CLI**: Core commands exist (`cli/src/commands/*`), focused on basic CRUD (init/list/login/logout/whoami/pull/push/view). Advanced workflows (import/export formats, conflict resolution, search/filter, diff previews, shell completion, profiles) not implemented.
- **Data Model**: `prisma/schema.prisma` lacks 2FA fields (`twoFactorSecret`, `twoFactorEnabled`, `backupCodes`, `twoFactorRecoveryCode`). No dedicated migration for Better Auth token storage cleanup.

### 1.2 Key Assumptions & Constraints
1. Better Auth remains the canonical identity provider; all auth endpoints must source sessions/tokens via `auth.api.*` methods.
2. AES-256-GCM encryption pipeline, RBAC (OWNER/ADMIN/DEVELOPER/VIEWER), and Prisma schema from `docs/MAIN_DOC.md` remain authoritative.
3. CLI communicates over HTTPS only and authenticates via API tokens (prefixed `esh_`); token issuance must leverage Better Auth credentials.
4. Resend is the email provider (`RESEND_API_KEY`), but plan must include graceful fallback logging if key missing.
5. No documentation files besides the requested plan should be modified.

### 1.3 High-Level Roadmap
| Phase | Focus | Duration | Outcomes |
| --- | --- | --- | --- |
| Phase 2 | Better Auth migration, full 2FA (backend + UI + CLI alignment) | 2–3 weeks | All auth endpoints + CLI rely on Better Auth, optional OAuth linking, enforced 2FA for privileged roles |
| Phase 3 | Email integration | 1–2 weeks | Registration, reset, invite, security alert, audit digest emails wired with validation + rate limits |
| Phase 6 | Advanced features & CLI | 2–3 weeks | Import/export, search/filter, CLI UX enhancements (shell completion, diff previews, profiles) |

Dependencies are mostly sequential: Phase 2 (Better Auth + 2FA) must land before Phase 3 emails (since emails depend on new verification tokens) and Phase 6 CLI enhancements (which lean on stable auth tokens and audit data).

## 2. Phase 2 — Better Auth Migration & 2FA (2–3 weeks)

### 2.1 Better Auth Route Migration *(Mandatory)*
- **Goal**: Replace legacy JWT cookie flows with Better Auth sessions consistently across web + CLI endpoints.
- **Primary Files**:
  - API routes: `app/api/v1/auth/{login,logout,session,register}/route.ts`
  - Shared libs: `lib/auth.ts`, `lib/auth-client.ts`, `lib/authMiddleware.ts`, `lib/validation.ts`, `lib/errors.ts`, `lib/rateLimit.ts`
  - Tests: `lib/__tests__/authRoutes.test.ts` (new), existing Playwright specs

#### Detailed Task Breakdown
1. **Dependency audit**
   - Confirm `better-auth` + adapter versions in `package.json`; bump if required and run `npm install`.
   - Ensure `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, OAuth envs exist in `.env.example` and document migration steps.
2. **Route refactors**
   - **Login**: replace manual Prisma + `SignJWT` logic with `await auth.api.signInEmailPassword({ email, password })`; extract session cookie via Better Auth response helper. Maintain rate limit + logging, but emit sanitized errors (`AuthError('Invalid credentials')`).
   - **Logout**: read Better Auth session token from cookies/headers and call `auth.api.signOut({ sessionToken })`, then delete cookie. Keep response body consistent with existing client expectations.
   - **Session**: create helper `getSessionUser(req)` that first checks CLI bearer token, then `auth.api.getSession`. Return 200 with `user` + `session` metadata, otherwise 401.
   - **Register**: swap direct Prisma create for `auth.api.signUpEmailPassword`. Capture returned `userId` so we can create onboarding artifacts (welcome project, etc.). Defer verification email to Phase 3 but return `{ emailVerificationSentPending: true }`.
3. **Middleware alignment**
   - Deduplicate logic between `lib/authMiddleware.ts` and new helper by exporting `getAuthenticatedUserFromRequest`. Ensure legacy JWT fallback is gated behind feature flag (`ENABLE_LEGACY_JWT=false`) for rollback.
4. **CLI compatibility**
   - Keep bearer-token branch functional while migrating CLI auth route (see 2.5). Document timeline for removing `auth-token` cookie entirely.

#### Validation & Testing
- Unit tests using a mocked Better Auth client verifying:
  - Successful login sets Secure/Lax cookie.
  - Invalid password returns 401 without revealing account existence.
  - Session endpoint returns CLI token user when `Authorization: Bearer` header provided.
- Playwright smoke test: login → session → logout, ensuring cookies rotate.
- Manual QA: confirm OAuth login still redirects correctly (Better Auth handles callback).

#### Risks / Mitigations
- **Risk**: Breaking existing sessions during deploy → add migration banner + run in maintenance window.
- **Mitigation**: Support dual cookies for one deployment (Better Auth session primary, legacy cookie read-only) and purge legacy cookie after rollout.

### 2.2 2FA Backend Implementation *(Mandatory)*
- **Goal**: Persist 2FA secrets + backup codes in DB, expose APIs for enrollment, verification, disable, and login challenges.

#### Data Model / Migration
```prisma
model User {
  // existing fields…
  twoFactorSecret        String?   @map("two_factor_secret")
  twoFactorEnabled       Boolean   @default(false) @map("two_factor_enabled")
  twoFactorBackupCodes   String[]  @db.Text @default([]) @map("two_factor_backup_codes")
  twoFactorRecoveryCode  String?   @map("two_factor_recovery_code")
  twoFactorUpdatedAt     DateTime? @map("two_factor_updated_at")
}
```
- Create migration `prisma/migrations/20251114_add_two_factor_columns/` with `ALTER TABLE` statements + backfill script that sets `two_factor_enabled=false` for all users.
- Update `prisma/seed.ts` (if present) to generate demo users with 2FA disabled.

#### API Surface (new directory `app/api/v1/auth/2fa/*`)
| Endpoint | Body | Behavior |
| --- | --- | --- |
| `POST setup` | `{ passwordConfirmation }` | Re-authenticates user, calls `generateTwoFactorSecret`, hashes backup/recovery codes, stores secret, returns QR (base64), plaintext backup codes (display once). |
| `POST verify` | `{ token }` | Validates format via `isValidTotpFormat`, checks `verifyTwoFactorToken`, sets `twoFactorEnabled=true`, `twoFactorUpdatedAt=now()`. |
| `POST disable` | `{ password, tokenOrRecovery }` | Requires password + either valid TOTP or recovery code; nulls out secret + backup codes; regenerates recovery code for future use. |
| `POST challenge` | `{ pendingSessionToken, token?, backupCode? }` | Called during login when server responds `twoFactorRequired`. Validates code, then finalizes session by exchanging pending token for real Better Auth session cookie. |

Implementation details:
1. **Pending session storage**: create short-lived cache (Redis via Upstash or Prisma `Verification` row with type `pending_session`) keyed by `pendingSessionToken` (UUID). Expires in 5 minutes.
2. **Hashing strategy**: use bcrypt(10) for backup/recovery codes. Store codes in uppercase hyphen format; mark used codes by setting to `'USED:<timestamp>'` for audit trail.
3. **Audit logging**: use `logSecurityEvent` w/ actions `two_factor_setup`, `two_factor_verify`, `two_factor_disable`, `two_factor_challenge_failed`.

#### Login Flow Integration
- Modify login route (2.1) to:
  1. After `auth.api.signInEmailPassword`, fetch user record.
  2. If `twoFactorEnabled` is true:
     - Create `pendingSessionToken` + store session payload (Better Auth session token, userId) in cache.
     - Respond `202` with `{ twoFactorRequired: true, pendingSessionToken, methods: ['totp','backup'] }`.
  3. Frontend/CLI will call `/auth/2fa/challenge` to finalize session; success returns standard login payload.

#### Validation & Testing
- **Unit**: extend `lib/__tests__/twoFactor.test.ts` to cover hashing + recovery code logic.
- **Integration**: use Prisma test DB + mocked Better Auth to test `/setup → /verify → login challenge` flows, including invalid tokens, expired pending sessions, used backup codes.
- **Manual**: QA script verifying: enable 2FA, log out, log in using TOTP, use backup code once, disable 2FA.

#### Dependencies / Risks
- Requires stable Better Auth session API.
- Ensure Upstash credentials available if using Redis; otherwise, use Prisma `Verification` table for pending sessions (cleanup job required).

### 2.3 2FA Frontend/UI *(Mandatory)*
- **Goal**: Provide user settings UI for enabling/disabling 2FA and prompt step during login.

#### Components & Pages
1. **Settings Screen** (`app/(dashboard)/settings/security/page.tsx`)
   - Server component fetches user settings via `auth()`; passes props to client component `TwoFactorSettingsPanel` in `components/settings/TwoFactorSettingsPanel.tsx`.
   - Panel renders three states: `Disabled`, `Pending Verification`, `Enabled`.
2. **Setup Wizard**
   - Client component `TwoFactorSetupWizard.tsx` with steps: (a) Password confirmation, (b) QR scan, (c) Code verification, (d) Backup code download.
   - Use `react-hook-form` + Zod for validation.
3. **Challenge Modal**
   - `components/auth/TwoFactorChallengeForm.tsx` shown in login page when API returns `twoFactorRequired`.
   - Supports toggling between “Authenticator code” and “Backup code”.

#### Detailed Flow
1. **Enable**
   - User clicks “Enable 2FA”, enters password → calls `POST /api/v1/auth/2fa/setup`.
   - Display QR + backup codes (copy + download `.txt`).
   - User enters 6-digit code → `POST /api/v1/auth/2fa/verify`.
   - On success, show success state + last-updated timestamp.
2. **Disable**
   - Click “Disable”; modal asks for password + TOTP/backup/recovery code.
   - Call `POST /api/v1/auth/2fa/disable`; update UI state.
3. **Login Challenge**
   - Login form awaits response; if `twoFactorRequired`, store `pendingSessionToken` in state and render `TwoFactorChallengeForm` inline.
   - Submit TOTP or backup code to `/auth/2fa/challenge`; on success, redirect to dashboard.

#### UX / Accessibility
- Provide countdown for next TOTP refresh (`getTimeUntilNextToken`).
- Use `<Dialog>` component with focus trapping for modals.
- Ensure backup codes can be copied via accessible buttons and warn user they won’t be shown again.

#### Validation & Testing
- RTL tests covering wizard state transitions, validation errors, copy buttons.
- Playwright test enabling 2FA, logging out, logging back in with TOTP, and disabling.
- Snapshot tests for `TwoFactorSettingsPanel` states.

#### Security Notes
- Do not cache QR or secret in React state longer than necessary; store only in memory during wizard.
- Wipe backup codes from component state once user confirms they saved them.

### 2.4 OAuth Account Linking *(Optional/Stretch)*
- **Goal**: Allow logged-in users to connect/disconnect Google/GitHub accounts post-registration.

#### Steps
1. **Expose account status**: extend `app/(dashboard)/settings/security/page.tsx` loader to fetch linked providers via `auth.api.listSocialAccounts(userId)`.
2. **Linking endpoint**: `app/api/v1/auth/oauth/link/route.ts`
   - Accepts query `provider=google|github`.
   - Generates Better Auth link URL (`auth.api.createSocialLinkSession`) and redirects user to provider.
3. **Callback**: ensure Better Auth callback handler stores account; on success, redirect back to `/settings/security?linked=google`.
4. **Unlink**: `POST /api/v1/auth/oauth/unlink` requiring password confirmation + TOTP; call `auth.api.unlinkSocialAccount`.
5. **UI**: Render provider cards with states “Linked” (show email + unlink button) or “Not linked” (show link button).

#### Considerations
- Prevent unlinking last remaining authentication method.
- Log audit entries for link/unlink events.
- Testing: integration tests mocking Better Auth responses; UI tests verifying state toggles.

### 2.5 CLI + Better Auth Integration *(Mandatory)*
- **Goal**: Ensure CLI token issuance and validation align with Better Auth sessions + 2FA.

#### Server-Side Changes
1. **Route redesign** (`app/api/v1/cli/auth/route.ts`)
   - Accept body `{ email, password, tokenName?, twoFactorToken?, backupCode? }`.
   - Authenticate via `auth.api.signInEmailPassword({ device: 'cli' })`; if 2FA required, validate token before creating API token.
   - Generate token with prefix `esh_` + 32 random bytes. Store only bcrypt hash + SHA-256 digest; return plaintext once.
   - Enforce per-user token limit using `MAX_API_TOKENS_PER_USER`.
2. **Token schema cleanup**
   - Update `prisma/schema.prisma` `ApiToken` model: drop `token` column, keep `tokenDigest` + `tokenHash` (hashed). Migration must copy hashed values, then drop plaintext field. Provide script `scripts/migrate-cli-tokens.ts` to re-hash if needed.
3. **Audit logging**
   - Log events `cli_token_created`, `cli_token_used`, `cli_token_revoked` with metadata (tokenId, ip, userAgent).

#### CLI Client Changes
1. **Interactive login** (`cli/src/commands/login.ts`)
   - Add prompt sequence: email → password → optional TOTP. Support `--non-interactive` flag for CI (requires env vars or existing token).
   - After success, save config as `{ profiles: { default: { apiUrl, token, createdAt } }, activeProfile: 'default' }`.
2. **Config utilities**
   - Refactor `cli/src/utils/config.ts` to read/write multi-profile JSON with file locking + permission checks (`chmod 600`).
3. **Whoami**
   - Ensure `cli/src/commands/whoami.ts` shows token metadata (name, expiresAt, lastUsedAt) returned by server.

#### Testing & Validation
- API integration test verifying 2FA challenge path + token hashing.
- CLI unit tests (Jest) for config manager, login prompt flows (mock `inquirer`).
- Manual: run `envshield login` with 2FA user, verify token works for `envshield pull`.

#### Dependencies
- Relies on 2.1 (Better Auth login) and 2.2 (2FA endpoints). CLI release notes should instruct users to re-run `envshield login`.

## 3. Phase 3 — Email Integration (1–2 weeks)

For each flow, ensure Resend errors are logged but do not block primary action (unless verification required). Use Zod schemas placed in `lib/validation.ts`.

### 3.1 Registration → Verification Email *(Mandatory)*
- **Endpoints**: `POST /api/v1/auth/register`, `POST /api/v1/auth/verify-email`, `POST /api/v1/auth/verification/resend`.

#### Detailed Flow
1. User submits register form → Better Auth `signUpEmailPassword` creates account + returns `userId`.
2. Server generates 6-digit numeric code, hashes via `bcrypt`, stores in `Verification` table with type `email_verification` + expiry 15 min.
3. Call `sendVerificationEmail(email, code, name)`.
4. `POST /verify-email` validates code:
   - Look up record by email identifier, compare hash.
   - On success: set `user.emailVerified=true`, delete verification row, emit audit log.
5. Optional `resend` endpoint with per-email rate limit (5/hour) using `lib/rateLimit.ts`.

#### Validation & Testing
- Unit tests for verification service (code generation, hashing, expiry checks).
- Integration tests verifying register → verify toggles DB field, expired code yields 400.
- Ensure responses are generic (“If the email exists, we sent a code”).

### 3.2 Forgot Password → Reset Email *(Mandatory)*
- **Endpoints**: `POST /auth/password/reset-request`, `POST /auth/password/reset-confirm`.
- **Implementation details**:
  1. Request: always respond 200; if user exists, create verification token (UUID) with type `password_reset`, expiry 60 min, hashed value.
  2. Email: send `sendPasswordResetEmail(email, token)` with link `APP_URL/reset-password?token=...`.
  3. Confirm: accept `{ token, password }`, validate password strength via shared Zod schema, hash new password with bcrypt(12), invalidate token.
  4. Optional: log user out of all sessions (Better Auth `signOut({ userId, all: true })`).
- **Testing**: covers token reuse, invalid token, ensures password updated and login works with new password.

### 3.3 Team Invite → Invitation Email *(Mandatory)*
- **Flow**:
  1. Owners/Admins invite via dashboard → server validates `inviteMemberSchema` (email, role).
  2. Create `ProjectInvite` Prisma model with fields `{ id, projectId, email, role, invitedBy, tokenHash, expiresAt, status }`.
  3. Send `sendTeamInvitationEmail` containing accept link.
  4. Accept endpoint verifies token, either attaches to existing user or creates placeholder pending registration, then inserts `ProjectMember` entry.
  5. Emit audit logs for invite + acceptance.
- **Edge cases**: re-inviting same email before expiration should resend existing token; revoking invite sets `status='revoked'`.
- **Testing**: Prisma integration covering accept path for existing vs new user; UI tests to ensure invite form error handling.

### 3.4 Security Alerts → Suspicious Activity Email *(Mandatory for parity)*
- **Triggers & Payloads**:
  - Repeated failed logins (>=3 within 10 min) – include IP + user agent.
  - New device/session detected – include city/country from geo-IP.
  - Password changed, 2FA disabled, API token created.
- **Implementation**:
  - Create `lib/securityEvents.ts` exporting `queueSecurityAlert({ userId, type, metadata })`.
  - Backed by in-memory queue now, with future option to offload to worker.
  - Use `sendSecurityAlertEmail` templates with dynamic bullet list of recommendations.
- **Rate limiting**: store last alert timestamp per user/type in Redis or Prisma table; enforce min 6h between alerts of same type.
- **Testing**: unit tests verifying event bundling + throttle, integration simulating repeated failed logins generating a single email.

### 3.5 Weekly Audit Digest → Scheduled Email *(Optional but recommended)*
- **Script**: `scripts/send-weekly-digest.ts`
  - Accept CLI args `--project <slug>` (for manual dry run) and `--all` (for cron).
  - Query `AuditLog` grouped by project over last 7 days to compute stats.
  - Track last sent timestamp in `Project` table column `digestSentAt`.
- **Scheduling**: configure Vercel Cron (weekly Monday 09:00 UTC) or GitHub Action with PAT hitting script via `node scripts/send-weekly-digest.ts --all`.
- **Testing**: unit tests for stats generator; manual dry-run prints email preview to console if `RESEND_API_KEY` missing.
## 4. Phase 6 — Advanced Features & CLI Enhancements (2–3 weeks)

### 6.1 Advanced Import/Export *(Mandatory)*
- **Goal**: Support multiple file formats (dotenv, JSON, YAML) with conflict resolution + dry-run preview.

#### Backend
- New routes under `app/api/v1/projects/[slug]/environments/[env]/variables/{import,export}/route.ts` (Route Handlers).
- Parser utility `lib/importExport.ts` with functions:
  - `parseEnvFile`: parse dotenv file into key-value pairs.
  - `parseJsonFile`: parse JSON file into key-value pairs.
  - `parseYamlFile`: parse YAML file into key-value pairs.
  - `generateDiff`: generate diff between existing variables and imported variables.
  - `applyImport`: apply imported variables to database.

#### Frontend
- Add Import/Export drawer in `app/(dashboard)/projects/[projectId]/environments/[envId]/page.tsx` with dropzone, format selector, diff preview (highlight conflicts, allow per-key resolution).
- Use `components/variables/BulkEditor.tsx` to show diff table.

#### CLI
- Extend `envshield import --format yaml --file secrets.yaml --env staging --dry-run`.
- Extend `envshield export --format json --env prod --output secrets.json`.
- Implementation in `cli/src/commands/import.ts` (new) and `cli/src/commands/export.ts` calling new API endpoints, showing summary, optional interactive conflict resolver using Inquirer.

#### Validation & Testing
- Unit tests for parsers (dotenv, JSON, YAML), integration test verifying dry-run does not mutate DB, CLI tests mocking file I/O.
- Test import/export with different file formats and conflict scenarios.

#### Dependencies
- Relies on 2.1 (Better Auth login) and 2.2 (2FA endpoints). CLI release notes should instruct users to re-run `envshield login`.

### 6.2 Advanced Search & Filtering *(Mandatory)*
- **Goal**: Rich search across variables/projects with filters, fuzzy matching, facets (env, project, key prefix, updatedBy).

#### Backend
- Introduce `app/api/v1/search/variables/route.ts` with query params: `q`, `projectId`, `environmentId`, `role`, `updatedBy`, `dateRange`. Implement using PostgreSQL full-text search or trigram indexes on `variables.key` and `variable_history.key`.
- Add indexes via migration for search performance (`CREATE INDEX idx_variables_key_gin ON variables USING gin (to_tsvector('simple', key));`).
- Response includes paginated results with highlight snippets and metadata for facets.

#### Frontend
- Add global search bar component `components/search/VariableSearchBar.tsx` accessible from dashboard header; results page `app/(dashboard)/search/page.tsx` with filters sidebar.
- Include saved search chips, ability to filter by role requirements.

#### CLI
- New command `envshield search <query> [--project slug] [--env name] [--json]`.
- Display table with key, env, project, last updated, partial value (masked unless `--decrypt` + role allows).

#### Validation & Testing
- Integration tests ensuring filters work, CLI snapshot tests for search output, performance test ensuring query stays under 500ms with indexes.
- Test search with different query parameters and filter scenarios.

#### Dependencies
- Relies on 2.1 (Better Auth login) and 2.2 (2FA endpoints). CLI release notes should instruct users to re-run `envshield login`.
  - Add global search bar component `components/search/VariableSearchBar.tsx` accessible from dashboard header; results page `app/(dashboard)/search/page.tsx` with filters sidebar.
  - Include saved search chips, ability to filter by role requirements.
- **CLI**:
  - New command `envshield search <query> [--project slug] [--env name] [--json]`.
  - Display table with key, env, project, last updated, partial value (masked unless `--decrypt` + role allows).
- **Security**: respect RBAC in search results (VIEWER sees masked values only). Rate limit search endpoint, audit queries containing decrypt flag.
- **Testing**: integration tests ensuring filters work, CLI snapshot tests for search output, performance test ensuring query stays under 500ms with indexes.

### 6.3 CLI Advanced Features *(Mandatory)*
- **Scope**: shell completion, diff previews, bulk ops, profiles, TUI (stretch sub-features categorized below).

1. **Shell Completion**
   - Use Commander’s `command.completion` or `tabtab` to generate scripts for bash/zsh/fish.
   - Command: `envshield completion [shell]` outputs script user can eval.
   - Files: `cli/src/commands/completion.ts`.

2. **Diff Previews & Bulk Ops**
   - Extend `envshield push` to show colored diff (added/removed/changed) using `chalk` + `diff` lib before confirmation.
   - Add `--force`, `--skip-confirm`, `--decrypt` options with caution prompts.
   - Provide `envshield bulk delete <keys...>` command hitting new endpoint `DELETE /api/v1/.../variables` with list of keys (RBAC enforce).

3. **Profiles & Context Switching**
   - Update `cli/src/utils/config.ts` to store `{ activeProfile: string, profiles: Record<string, { apiUrl, token }> }`.
   - Commands: `envshield profile list|use|add|remove`.
   - CLI login should support `--profile <name>`.

4. **TUI (Stretch)**
   - Optional interactive `envshield tui` using `ink` to browse projects/environments/variables with keyboard navigation.

- **Security**: ensure config file permissions (chmod 600) enforced; warn when storing tokens for multiple profiles. All bulk ops and diff previews should log summary to audit endpoint (maybe `POST /api/v1/audit/logs` helper).
- **Testing**: CLI unit tests for config manager, snapshot tests for diff output, manual QA for shell completion scripts.

## 5. Security & Testing Considerations
- **2FA**: enforce secret/backup code hashing, per-attempt rate limiting, audit log entries (`action: '2FA_SETUP'`, `'2FA_CHALLENGE'`). Provide recovery flow with strong verification.
- **Email Tokens**: store hashed codes/tokens with expirations, single-use. Ensure endpoints return generic responses to avoid enumeration.
- **RBAC**: centralize checks in `lib/permissions.ts`; ensure new endpoints (import/export/search/2FA/email flows) call `requireProjectRole` helper.
- **Rate Limiting**: extend `lib/rateLimit.ts` to cover `/api/v1/auth/2fa/*`, `/api/v1/auth/password/*`, `/api/v1/cli/auth`, `/api/v1/search/*`.
- **Audit Logging**: For each sensitive action (login, 2FA events, import/export, email events, CLI token creation), create entries in `AuditLog` with metadata (IP, userAgent). Consider separate `SecurityLog` table if volume high.
- **Testing Strategy**:
  - **Unit**: `lib/twoFactor.ts`, email helpers, CLI config/diff utilities.
  - **Integration**: Auth routes with Prisma test DB, ensuring session cookies + tokens behave.
  - **E2E**: Playwright covering login w/2FA, import/export UI.
  - **CLI**: Use `vitest` or `jest` with `tsx` runner to simulate CLI commands (via `execa`).

## 6. Implementation Order & Milestones

### 6.1 Dependency Graph
1. **Better Auth route migration** → prerequisite for 2FA challenge flow + CLI integration.
2. **2FA backend** → required before frontend UI + CLI prompts.
3. **2FA frontend** → depends on backend endpoints.
4. **CLI + Better Auth integration** → depends on new auth endpoints + 2FA responses.
5. **Email wiring** → depends on stabilized auth routes (for verification tokens).
6. **Advanced features** → depend on reliable auth/email + search indexes.

### 6.2 Suggested Weekly Breakdown
- **Week 1**: Refactor auth routes, implement CLI token migration script, add Prisma fields + migrations for 2FA.
- **Week 2**: Build 2FA APIs + frontend UI; integrate CLI login prompts; begin email wiring for registration/reset.
- **Week 3**: Complete remaining emails (invites/security/digest), finalize CLI enhancements (import/export endpoints, search API), start advanced search backend.
- **Week 4**: Finish frontend UX for import/export + search, add CLI profiles/completion, polish + tests.

### 6.3 Risks & Mitigation
- **Better Auth API differences**: Mitigate by creating thin wrapper (`lib/betterAuthClient.ts`) with mocked tests.
- **2FA Usability**: Provide recovery options + clear UI instructions; add feature flag to rollout gradually.
- **Email Deliverability**: Implement fallback logging + health checks, add retry queue if Resend unreachable.
- **CLI Token Migration**: Provide script + backward-compatible flow; communicate via dashboard to regenerate tokens.
- **Search Performance**: Use appropriate indexes and limit results; add caching for heavy queries.

### 6.4 Go/No-Go Gates
1. **Gate A (End of Week 1)**: All auth routes rely on Better Auth; regression tests pass.
2. **Gate B (Mid Week 2)**: 2FA backend APIs + migrations deployed, manual verification of setup/challenge flows done.
3. **Gate C (End Week 3)**: Email flows wired and tested in staging; CLI login uses Better Auth + 2FA.
4. **Gate D (End Week 4)**: Advanced import/export + search features available in dashboard + CLI with tests.

Deliverables per gate should include updated tests, migration scripts, and audit logs verifying security-critical operations.
