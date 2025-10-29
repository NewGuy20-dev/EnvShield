# EnvShield Agent Playbook

This playbook defines the multi-agent collaboration model for EnvShield. Each agent is expected to follow the responsibilities, context requirements, and handoff protocols below to keep the repository consistent, secure, and production-ready.

## 1. Prime Directives

1. **Security first:** never log or persist plaintext secrets; respect AES-256-GCM encryption boundaries and RBAC rules at all times.
2. **Single source of truth:** defer to `docs/MAIN_DOC.md`, Prisma schema, and Tailwind configuration for canonical decisions.
3. **Consistency:** adhere to existing TypeScript, Next.js App Router, and Tailwind v4 conventions; match established folder structures and naming.
4. **Testability:** prefer deterministic logic, provide seeds or fixtures when needed, and keep code test-friendly (pure helpers, dependency injection where applicable).
5. **Traceable changes:** update relevant audit logging and maintain tight git hygiene (small commits, descriptive messages, no secrets).

## 2. Agent Roster & Mandates

### 2.1 Architect & Planning Agent
- **Scope:** high-level system design, feature decomposition, task orchestration.
- **Inputs:** product goals, `docs/MAIN_DOC.md`, `docs/DETAILED_IMPLEMENTATION_PLAN.md`, existing git history.
- **Deliverables:** implementation strategies, phased roadmaps, acceptance criteria, and cross-agent checklists.
- **Key checks:** ensure alignment with Prisma schema, identify required env vars, call out security implications.
- **Handoff:** provide annotated task breakdowns (phases, dependencies, blockers) to downstream agents, including CLI/test impacts.

### 2.2 Backend/API Agent
- **Scope:** server routes under `app/api`, Prisma models, lib utilities (`lib/db.ts`, `lib/encryption.ts`, `lib/permissions.ts`, auth wrappers).
- **Inputs:** Architect plan, Prisma schema, auth/encryption specs, Better Auth integration details.
- **Deliverables:** type-safe API routes (Next.js route handlers), data validation (Zod), RBAC-guarded server logic, migration updates.
- **Key checks:** run `npx prisma validate`, `npx prisma migrate dev`, and relevant unit tests; ensure audit logs are created per state-changing route.
- **Handoff:** document response contracts, environment variable changes, and integration notes for Frontend/CLI agents.

### 2.3 Frontend/UI Agent
- **Scope:** App Router pages under `app/(auth|dashboard)`, shared components (`components/ui`, `components/dashboard`), theming (`lib/theme-provider.tsx`, `app/globals.css`).
- **Inputs:** Backend API contracts, design system specs (Tailwind tokens, `docs/DESIGN_SYSTEM.md`, `docs/COMPONENT_LIBRARY.md`).
- **Deliverables:** accessible, responsive React components, server/client component composition, hooks, and minimal client-side state.
- **Key checks:** ensure dark/light mode parity, no layout shift, hydration-safe logic, and data fetching aligns with server components.
- **Handoff:** supply prop-types/types, loading states, error boundaries, and testing considerations to QA agent.

### 2.4 CLI & Tooling Agent
- **Scope:** CLI package (`cli/`), scripts (`scripts/`), developer tooling, DX enhancements.
- **Inputs:** API endpoints, authentication flows (token issuance), encryption utilities mirrored from server.
- **Deliverables:** Commander-based commands (login/logout/init/pull/push/whoami), config persistence, progress outputs, npm packaging readiness.
- **Key checks:** run CLI against local server (`npm run dev`), confirm token storage security (`~/.envshield/config.json` permissions), write unit tests for parsing/encryption helpers.
- **Handoff:** expose CLI usage docs to QA/Docs agents, note breaking changes that affect onboarding.

### 2.5 Data Integrity & Security Agent
- **Scope:** encryption pipeline, RBAC enforcement, audit logging, token lifecycle, secrets management.
- **Inputs:** `lib/encryption.ts`, `lib/permissions.ts`, Prisma models, Better Auth configuration, system reminders on security.
- **Deliverables:** threat models, regression checks, lintable guard utilities, and sign-off on security-sensitive merges.
- **Key checks:** confirm `ENCRYPTION_KEY` length, forbid plaintext secret handling, add rate limiting where needed, verify bcrypt cost factors and JWT expirations.
- **Handoff:** produce security review notes and update checklists for QA/Release agents.

### 2.6 QA & Release Agent
- **Scope:** automated/unit testing, linting, CI readiness, release packaging (Vercel deploy, npm publish path).
- **Inputs:** change diffs, backend/frontend deliverables, CLI outputs, docs checklists, testing strategy section of `docs/MAIN_DOC.md`.
- **Deliverables:** Jest test coverage, Playwright/E2E plans (optional), release validation scripts, deployment sign-off.
- **Key checks:** run `npm run lint`, `npm run test`, ensure migrations applied, produce release notes if applicable.
- **Handoff:** confirm artifacts are production-ready, flag blockers to Architect agent.

## 3. Shared Operating Workflow

1. **Spin-Up**
   - Copy `.env.example` to `.env.local` and populate values.
   - Run `npm install` (root) and `npm run prisma:generate` if defined.
   - Execute `npx prisma migrate dev --name init` for the local database.
   - Start dev server with `npm run dev` (Next.js) and optional CLI build (`cd cli && npm run build`).

2. **Context Refresh**
   - Read `docs/MAIN_DOC.md` for canonical requirements.
   - Inspect open diffs (`git status`, `git diff`) before beginning new work.
   - Review `IMPLEMENTATION_SUMMARY.md` for completed features and pending enhancements.

3. **Implementation Loop**
   - Define scope (what, why, acceptance criteria).
   - Break into sub-tasks; assign each to responsible agent.
   - Implement with tests alongside code.
   - Run relevant commands (lint, type-check, tests, CLI exercises).
   - Capture audit/release notes.

4. **Handoff & Review**
   - Summarize changes (1–4 sentences) and link PRs or test artifacts.
   - Ensure no secrets leak in diffs, logs, or docs.
   - Confirm migrations, env vars, and CLI versions are communicated.

## 4. Coding & Review Standards

- **TypeScript:** strict mode; favor explicit generics and discriminated unions for API payloads.
- **Validation:** all external inputs must pass through Zod schemas in `lib/validation.ts` or route-local validators.
- **Styling:** leverage Tailwind v4 tokens; avoid inline styles unless unavoidable.
- **State Management:** default to server components; use React context or hooks only when necessary.
- **Testing:** create Jest suites per module; mock Prisma and Better Auth for unit tests; include CLI integration smoke tests.
- **Git Hygiene:** atomic commits, no large mixed diffs; run `npm run lint` and applicable tests pre-commit.
- **Security Logging:** whenever new mutating API endpoints exist, add audit log entries capturing `userId`, `action`, `entity`, `metadata`.

## 5. Communication Protocols

- **Status Updates:** agents report progress via concise summaries referencing todos/tasks.
- **Escalation:** blockers involving schema changes, breaking API contracts, or security regressions must be raised to Architect + Security agents immediately.
- **Documentation:** only update existing docs when explicitly scoped; otherwise, record findings within task/PR descriptions.
- **Tooling Notes:** prefer built-in project commands; do not introduce new dependencies without Architect approval.

## 6. Rapid Reference (Commands & Paths)

| Purpose | Command / Path |
| --- | --- |
| Install deps | `npm install` |
| Generate Prisma client | `npx prisma generate` |
| Apply migrations | `npx prisma migrate dev --name <label>` |
| Start dev server | `npm run dev` |
| Lint | `npm run lint` |
| Run tests | `npm run test` *(add when suite exists)* |
| Build CLI | `cd cli && npm run build` |
| CLI local link | `cd cli && npm run build && npm link` |
| Seed script | `npx prisma db seed` *(when implemented)* |

**Key directories:**
- `app/` — Next.js App Router (pages, API routes).
- `components/` — shared UI primitives and feature modules.
- `lib/` — utilities (auth, db, encryption, permissions, validation, theme).
- `cli/` — standalone CLI package.
- `prisma/` — schema and migrations.
- `scripts/` — Node scripts for maintenance or seeding.

## 7. Quality Gates Checklist

1. Lint, type-check, and test suites pass locally.
2. Prisma migrations are applied and reversible.
3. Sensitive configs remain in `.env` files; no secrets committed.
4. UI tested in both light and dark themes at 375px, 768px, desktop.
5. CLI commands exercised against dev server when impacted.
6. Audit logging updated for new mutating actions.
7. Release notes or PR summary prepared for QA/Release agent.

---

Following this playbook ensures each agent collaborates effectively, upholds EnvShield's security posture, and delivers maintainable features with confidence.
