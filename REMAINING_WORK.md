# Remaining Work – Phase 3 & 6

## Priority Order

### Phase 3 – Email Integration (High Priority)

#### 1. Weekly Audit Digest Script
**Location:** `scripts/send-audit-digests.ts`

**What it does:**
- Runs weekly (e.g., Sunday 00:00 in team's timezone)
- For each project owner/admin:
  - Count variable changes in past 7 days
  - Count new members added
  - Count login attempts
  - Send digest email with stats

**Implementation:**
```typescript
// Pseudo-code
const projects = await prisma.project.findMany();
for (const project of projects) {
  const stats = await getProjectStats(project.id, 7);
  const members = await prisma.projectMember.findMany({
    where: { projectId: project.id, role: { in: ['OWNER', 'ADMIN'] } }
  });
  for (const member of members) {
    await sendAuditDigestEmail(member.user.email, project.name, stats);
  }
}
```

**Scheduling:**
- Use `node-cron` or similar
- Or integrate with external scheduler (AWS Lambda, Vercel Cron, etc.)

---

#### 2. CLI Auth + 2FA Alignment
**Location:** `cli/src/commands/auth.ts` + `app/api/v1/cli/auth`

**What it does:**
- CLI login flow that handles 2FA challenge
- Token hashing & storage in `~/.envshield/config.json`
- Secure token persistence

**Implementation:**
```typescript
// CLI login flow
1. User runs: envshield login --email user@example.com
2. Prompt for password
3. Call POST /api/v1/cli/auth with email + password
4. If 2FA required:
   - Return pendingSessionToken
   - Prompt user for TOTP/backup code
   - Call POST /api/v1/auth/2fa/challenge
5. On success:
   - Store token in ~/.envshield/config.json (encrypted)
   - Print "Logged in successfully"
```

---

### Phase 6 – Advanced Features (Medium Priority)

#### 1. Import/Export
**Endpoints:**
- `POST /api/v1/projects/:id/env/import` – Bulk import env vars
- `GET /api/v1/projects/:id/env/export` – Export as JSON/YAML/dotenv

**CLI:**
- `envshield env import --file=.env.prod`
- `envshield env export --env=prod --format=json`

**UI:**
- Import wizard modal
- Export button on env page

---

#### 2. Advanced Search
**Endpoint:**
- `GET /api/v1/search?q=DATABASE_URL&env=prod` – Search across projects/envs

**CLI:**
- `envshield search --query DATABASE_URL --env prod`

**UI:**
- Global search bar
- Results page with filters

---

#### 3. CLI Advanced Features
**Commands:**
- `envshield profile create/list/use` – Multiple CLI configs
- `envshield env diff --from staging --to prod` – Diff preview
- `envshield completion` – Shell completion (bash/zsh)

---

## 🔄 Suggested Implementation Order

1. **Weekly Audit Digest** (1-2 hours)
   - Straightforward aggregation + email
   - High value for compliance/auditing

2. **CLI Auth + 2FA** (2-3 hours)
   - Completes Phase 2
   - Needed for CLI usability

3. **Import/Export** (2-3 hours)
   - Common user need
   - Enables bulk operations

4. **Advanced Search** (1-2 hours)
   - Nice-to-have for larger projects

5. **CLI Advanced Features** (2-3 hours)
   - Polish & DX improvements

---

## 📊 Estimated Effort

- **Phase 3 completion:** 3-5 hours
- **Phase 6 completion:** 8-12 hours
- **Total remaining:** ~15 hours of focused work

---

## 🎯 Quality Gates Before Shipping

- [ ] `npm run lint` passes
- [ ] `npm run test` passes (if configured)
- [ ] All email templates render correctly
- [ ] 2FA challenge flow tested end-to-end
- [ ] CLI login/logout tested
- [ ] Invite acceptance tested
- [ ] Security alerts sent on key events
- [ ] Database migrations reversible
- [ ] No secrets in logs/diffs

---

## 📝 Notes

- All email functions already exist in `lib/email.ts`
- Rate limiting helpers in `lib/rateLimit.ts` and `lib/rateLimitHelper.ts`
- Security event logging in `lib/securityEvents.ts`
- Prisma models ready (ProjectInvite, SecurityAlert)
- Better Auth integration complete for web
- CLI integration started but needs 2FA support

