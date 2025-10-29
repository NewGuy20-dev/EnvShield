EnvShield — Developer Build Doc (Cursor-Ready)

Version: 1.0
Tagline: “Shield your secrets, empower your team”
Target: Cursor AI Agent Implementation (build-ready, TypeScript-first)
Stack: Next.js 14 (App Router), Neon PostgreSQL, Prisma, Tailwind CSS v4, Vercel, Better Auth (email/password + RBAC)

This document is a developer build doc (Option 2). It’s intentionally detailed with code snippets, file scaffolds, API contracts, CLI UX, and security details so a Cursor background agent can scaffold, wire up, and run EnvShield end-to-end. After this is implemented you can convert this into a formal README/PRD.

Table of contents

Project overview

Architecture & workflow

Repo layout (monorepo)

Prisma schema (full)

Encryption spec & code (AES-256-GCM)

Auth: Better Auth integration & RBAC (pattern + code)

API spec — full routes & request/response samples

API route examples (Next.js server routes)

Permissions middleware & utilities

CLI: design, commands, UX, code snippets

Web dashboard: pages, flows, components, UI behaviors

Audit logging, versioning, and history

Dev / deployment guide (env vars, migrations, Vercel)

Testing strategy (Jest-based)

Implementation checklist / roadmap (Cursor-friendly)

1. Project overview

Product: EnvShield — Secure Environment Variable Manager
Purpose: Securely store, share, and manage environment variables across teams and environments. Provide a Git-like CLI workflow plus a friendly web dashboard. Secrets are encrypted at rest using AES-256-GCM. Auth is handled by Better Auth (email/password) and Project-level roles (OWNER / ADMIN / DEVELOPER / VIEWER).

Core value props

Encrypted storage with versioning

Git-like CLI for push/pull syncs

Team RBAC and audit logs

Deployable on Vercel (free tier)

Open-source alternative to Doppler/Infisical

2. Architecture & workflow (high-level)
 Developer Machines (CLI)
 ──────────────────────────────
 CLI (envshield) <-----> EnvShield API (/api/*) (Next.js serverless on Vercel)
                          └─ Better Auth (Auth provider, sessions/tokens)
                          └─ Prisma -> Neon Postgres
                          └─ Encryption layer (lib/encryption.ts)

 Browser (Dashboard) <-----> EnvShield API (session cookie via Better Auth)


Key flows:

Web: User registers / logs in via Better Auth. UI uses session cookies. Dashboard uses server actions and server components for data fetching.

CLI: CLI authenticates via /api/cli/auth using email/password. Endpoint returns a long-lived API token (prefix esh_). CLI stores token in ~/.envshield/config.json. CLI uses token via Authorization: Bearer esh_<...> header.

Secrets storage: Secrets saved encrypted in DB as JSON ({ encrypted, iv, tag }) produced by AES-256-GCM. Decryption performed server-side for authorized roles (OWNER/ADMIN/DEVELOPER) on decrypt=true requests or when serving CLI pull requests.

RBAC: ProjectMember table links users to projects with roles. Middleware checks role for each API route.

3. Repo layout (monorepo)
envshield/
├── app/                          # Next.js app (App Router)
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── (dashboard)/projects/page.tsx
│   ├── api/                      # API routes (route.ts files)
│   │   ├── auth/                 # Better Auth webhook/adapter endpoints
│   │   ├── cli/
│   │   ├── projects/
│   │   └── ...
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── auth/
│   ├── dashboard/
│   └── variables/
├── lib/
│   ├── betterAuth.ts             # Better Auth client/wrappers
│   ├── db.ts                     # Prisma client
│   ├── encryption.ts             # AES-256-GCM utils
│   ├── permissions.ts            # RBAC utilities
│   └── validation.ts             # Zod schemas
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── cli/                          # CLI package (standalone in monorepo)
│   ├── src/
│   │   ├── commands/
│   │   │   ├── login.ts
│   │   │   ├── logout.ts
│   │   │   ├── init.ts
│   │   │   ├── pull.ts
│   │   │   ├── push.ts
│   │   │   └── whoami.ts
│   │   ├── utils/
│   │   │   ├── api.ts
│   │   │   ├── config.ts
│   │   │   └── encryption.ts    # mirrors server encryption APIs
│   │   └── index.ts
│   ├── package.json
│   └── README.md
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json


Notes:

CLI is a feature of EnvShield but kept as a stand-alone NPM package inside the repo (publishable).

Server code should keep encryption keys in environment variables; CLI uses token auth and does not store master encryption key.

4. Prisma schema (production-ready)

Put this in prisma/schema.prisma. This is the canonical schema used throughout the doc (copied & extended from your supplied schema):

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime @updatedAt

  projects      ProjectMember[]
  apiTokens     ApiToken[]
  auditLogs     AuditLog[]

  @@map("users")
}

model ApiToken {
  id          String   @id @default(cuid())
  userId      String
  token       String   @unique
  name        String?
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("api_tokens")
  @@index([userId])
  @@index([token])
}

model Project {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members      ProjectMember[]
  environments Environment[]
  auditLogs    AuditLog[]

  @@map("projects")
}

model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  role      Role     @default(VIEWER)
  createdAt DateTime @default(now())

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_members")
  @@index([projectId])
  @@index([userId])
}

enum Role {
  OWNER
  ADMIN
  DEVELOPER
  VIEWER
}

model Environment {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  slug        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  variables   Variable[]

  @@unique([projectId, slug])
  @@map("environments")
  @@index([projectId])
}

model Variable {
  id            String      @id @default(cuid())
  environmentId String
  key           String
  value         String      // encrypted JSON string
  description   String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  environment   Environment @relation(fields: [environmentId], references: [id], onDelete: Cascade)
  history       VariableHistory[]

  @@unique([environmentId, key])
  @@map("variables")
  @@index([environmentId])
}

model VariableHistory {
  id          String   @id @default(cuid())
  variableId  String
  key         String
  value       String   // encrypted JSON string
  changedBy   String   // user id
  createdAt   DateTime @default(now())

  variable    Variable @relation(fields: [variableId], references: [id], onDelete: Cascade)

  @@map("variable_history")
  @@index([variableId])
  @@index([createdAt])
}

model AuditLog {
  id          String   @id @default(cuid())
  projectId   String
  userId      String
  action      String
  entityType  String
  entityId    String?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("audit_logs")
  @@index([projectId])
  @@index([userId])
  @@index([createdAt])
}

5. Encryption specification & implementation
5.1 Crypto details (MUST)

Algorithm: aes-256-gcm

Encryption Key storage: ENCRYPTION_KEY environment variable — 32 bytes (64 hex chars). Example generation:

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"


IV (nonce): Random 12 bytes per encryption operation.

Auth Tag: 16-byte tag from GCM mode.

Serialized storage: store an encrypted payload as a JSON string:

{
  "encrypted": "<base64>",
  "iv": "<base64>",
  "tag": "<base64>"
}

5.2 Server encryption utilities (lib/encryption.ts)

lib/encryption.ts (Node.js / server):

// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.ENCRYPTION_KEY!;
if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be a 64-hex-character string (32 bytes).');
}
const ENCRYPTION_KEY = Buffer.from(KEY_HEX, 'hex');

export interface EncryptedData {
  encrypted: string; // base64
  iv: string;        // base64
  tag: string;       // base64
}

export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decrypt(data: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(data.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(data.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.encrypted, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function encryptForStorage(text: string): string {
  return JSON.stringify(encrypt(text));
}

export function decryptFromStorage(stored: string): string {
  const data: EncryptedData = JSON.parse(stored);
  return decrypt(data);
}


Notes:

Keep ENCRYPTION_KEY only in server env (Vercel Environment Variables).

The CLI should ONLY receive decrypted values when user has permission via token; the CLI never receives server master key.

6. Auth: Better Auth + RBAC integration

Important: Better Auth is the chosen auth provider. This doc shows an integration pattern. The exact SDK calls depend on Better Auth’s node SDK. The code below demonstrates the intended hooks, session validation, and token flows. Replace BetterAuthSDK calls with actual SDK methods in implementation.

6.1 Concepts

Email/password sign up + sign in

Session cookie used by web dashboard (server-side session)

API tokens (hashed) created by /api/cli/auth flow for CLI; prefix esh_ and saved in api_tokens.

RBAC: ProjectMember.role controls access. Role mapping: OWNER > ADMIN > DEVELOPER > VIEWER.

6.2 Environment variables required (auth)
BETTER_AUTH_API_KEY="..."
BETTER_AUTH_BASE_URL="https://api.better-auth.com" # example
ENCRYPTION_KEY="64 hex chars"
DATABASE_URL="postgresql://..."
JWT_SECRET="..." # if Better Auth requires it

6.3 Server-side wrapper (lib/betterAuth.ts)

Example wrapper to initialize Better Auth and helpers:

// lib/betterAuth.ts
import BetterAuth from 'better-auth'; // placeholder import; adapt to real SDK
import { NextRequest } from 'next/server';

const betterAuth = new BetterAuth({ apiKey: process.env.BETTER_AUTH_API_KEY });

export function initBetterAuth() {
  return betterAuth;
}

export async function requireSession(req: NextRequest) {
  // Example: verify session cookie
  const session = await betterAuth.getSessionFromRequest(req);
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function getUserFromSession(req: NextRequest) {
  const session = await requireSession(req);
  // session.userId, email, name etc.
  return session;
}


Replace above with actual SDK calls. The goal: have functions to createUser, verifyPassword, createSessionCookie, invalidateSession, and getSessionFromRequest.

6.4 CLI API Token flow (secure)

CLI logs in with email/password to /api/cli/auth. Server verifies credentials with Better Auth’s user store or local user table (if storing credentials locally). Then server issues an API token (long random string prefixed with esh_) and stores a hashed token in DB with userId, name, expiresAt. Return plain token once on creation.

CLI stores token in ~/.envshield/config.json. On requests, send Authorization: Bearer esh_<token> header.

Server middleware for token auth:

If bearer token present and valid -> set req.user as user from token.

Else try cookie session for web flows.

Server token validation:

Hash incoming token and compare to DB hashed token (or use constant-time compare). Update lastUsedAt.

7. API specification (full)

Base: /api/v1/* (you can keep /api/* for Next.js but document as v1 in URLs)

All endpoints require authentication except public landing pages. CLI endpoints accept token auth via Authorization header. Web routes use session cookie.

Below are the API endpoints you gave (merged & expanded for v1). Keep JSON samples as-is.

7.1 Authentication APIs

POST /api/v1/auth/register
Request:

{ "email":"user@example.com", "password":"securePassword123", "name":"John Doe" }


Response: 201 Created with user object (no passwordHash).

POST /api/v1/auth/login

Performs credentials login, sets session cookie for web. Returns user info.

POST /api/v1/auth/logout

Invalidates session.

POST /api/v1/auth/password-reset

Initiates password reset (email flow).

GET /api/v1/auth/session

Returns session info.

7.2 CLI Auth (Token) APIs

POST /api/v1/cli/auth
Request:

{ "email":"user@example.com", "password":"securePassword123", "tokenName":"MacBook Pro" }


Response (200):

{ "token":"esh_123...", "expiresAt":"2026-01-01T00:00:00Z" }


GET /api/v1/cli/whoami

Authenticated by token. Returns current user and token info.

7.3 Projects

GET /api/v1/projects

List projects for the authenticated user. Response includes their role and environments.

POST /api/v1/projects

Create project. Authenticated user becomes OWNER.

GET /api/v1/projects/[projectId]

Details including environments and members.

PATCH /api/v1/projects/[projectId] — OWNER or ADMIN
DELETE /api/v1/projects/[projectId] — OWNER only

7.4 Environments

GET /api/v1/projects/[projectId]/environments
POST /api/v1/projects/[projectId]/environments — OWNER/ADMIN
GET /api/v1/projects/[projectId]/environments/[envId]
PATCH /api/v1/projects/[projectId]/environments/[envId] — OWNER/ADMIN
DELETE /api/v1/projects/[projectId]/environments/[envId] — OWNER only

7.5 Variables

GET /api/v1/projects/[projectId]/environments/[envId]/variables
Query decrypt=true allowed only for OWNER/ADMIN/DEVELOPER. By default value is masked.

POST /api/v1/projects/[projectId]/environments/[envId]/variables — OWNER/ADMIN/DEVELOPER
PATCH /api/v1/projects/[projectId]/environments/[envId]/variables/[varId] — OWNER/ADMIN/DEVELOPER
(creates entry in VariableHistory)
DELETE /api/v1/projects/[projectId]/environments/[envId]/variables/[varId] — OWNER/ADMIN/DEVELOPER

7.6 Team Management

POST /api/v1/projects/[projectId]/members — Invite member (OWNER/ADMIN)
PATCH /api/v1/projects/[projectId]/members/[memberId] — Update role (OWNER only)
DELETE /api/v1/projects/[projectId]/members/[memberId] — Remove (OWNER only)

7.7 Audit Logs

GET /api/v1/projects/[projectId]/audit-logs — OWNER/ADMIN; filters: limit, offset, userId, action.

7.8 CLI Pull/Push

POST /api/v1/cli/pull
Request:

{ "projectSlug":"my-app", "environment":"dev" }


Response: variables (decrypted), lastUpdated.

POST /api/v1/cli/push
Request:

{ "projectSlug":"my-app", "environment":"dev", "variables":[{ "key":"NEW_VAR","value":"new_value","description":"..." }] }


Permissions: OWNER/ADMIN/DEVELOPER.

8. API route examples (Next.js server route templates)

Below are simplified Next.js API route examples using serverless route.ts pattern. Replace Better Auth SDK calls with real SDK methods.

8.1 Example: POST /api/v1/cli/auth (create API token)

app/api/v1/cli/auth/route.ts:

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { verifyUserCredentialsWithBetterAuth } from '@/lib/betterAuth'; // wrapper

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tokenName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const data = await req.json();
  const parsed = bodySchema.parse(data);

  // Verify user via Better Auth or local user table
  const user = await verifyUserCredentialsWithBetterAuth(parsed.email, parsed.password);
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  // Generate token (store hashed)
  const tokenPlain = 'esh_' + crypto.randomBytes(24).toString('hex');
  const tokenHash = await bcrypt.hash(tokenPlain, 12);
  const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const created = await prisma.apiToken.create({
    data: {
      token: tokenHash,
      userId: user.id,
      name: parsed.tokenName ?? 'CLI Token',
      expiresAt,
    },
  });

  return NextResponse.json({ token: tokenPlain, expiresAt });
}

8.2 Example: GET /api/v1/projects

Use session or token middleware. Pseudocode:

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: auth.user.id } } },
    include: { environments: true, members: { include: { user: true } } },
  });

  // map to response shape
  const resp = projects.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    createdAt: p.createdAt,
    environments: p.environments.map(e => ({ id: e.id, name: e.name, slug: e.slug })),
    role: p.members.find(m => m.userId === auth.user.id)?.role,
  }));

  return NextResponse.json({ projects: resp });
}

8.3 Example: POST /api/v1/projects/[projectId]/environments/[envId]/variables (create variable)

Key steps:

Validate role.

Encrypt value server-side with encryptForStorage.

Create Variable row.

Emit AuditLog.

9. Permissions middleware & utilities
9.1 lib/permissions.ts
import { Role } from '@prisma/client';

export function canViewVariables(role?: Role) {
  return Boolean(role); // all members can view masked values
}

export function canViewDecryptedVariables(role?: Role) {
  return [Role.OWNER, Role.ADMIN, Role.DEVELOPER].includes(role!);
}

export function canModifyVariables(role?: Role) {
  return [Role.OWNER, Role.ADMIN, Role.DEVELOPER].includes(role!);
}

export function canManageEnvironments(role?: Role) {
  return [Role.OWNER, Role.ADMIN].includes(role!);
}

export function canManageTeam(role?: Role) {
  return [Role.OWNER, Role.ADMIN].includes(role!);
}

export function canDeleteProject(role?: Role) {
  return role === Role.OWNER;
}

9.2 Middleware example: getAuthenticatedUserFromRequest

This wrapper tries token auth first, then cookie/session.

// lib/authMiddleware.ts
import { NextRequest } from 'next/server';
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { verifySessionCookie } from './betterAuth';

export async function getAuthenticatedUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const tokenPlain = authHeader.replace('Bearer ', '');
    // hashed tokens in DB; compare with bcrypt
    const tokens = await prisma.apiToken.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    for (const t of tokens) {
      if (await bcrypt.compare(tokenPlain, t.token)) {
        // update lastUsedAt
        await prisma.apiToken.update({ where: { id: t.id }, data: { lastUsedAt: new Date() }});
        return { user: t.user, token: t };
      }
    }
  }

  // Try session cookie via Better Auth
  const session = await verifySessionCookie(req);
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.userId }});
    if (user) return { user, session };
  }

  return null;
}

10. CLI: design, commands, UX, code snippets
10.1 CLI packaging & dependencies

cli/package.json (excerpt):

{
  "name": "envshield-cli",
  "version": "1.0.0",
  "bin": { "envshield": "./dist/index.js" },
  "dependencies": {
    "axios": "^1.x",
    "chalk": "^5.x",
    "commander": "^11.x",
    "inquirer": "^9.x",
    "ora": "^8.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsx": "^5.x"
  }
}

10.2 CLI UX principles

Use chalk for colors:

success: green

warning: yellow

error: red

info: blue/gray

Use ora for spinners/progress indicators.

Use inquirer for interactive prompts.

Store config in ~/.envshield/config.json.

Token prefix: esh_.

Commands should be discoverable: envshield --help lists commands and examples.

10.3 CLI config (cli/src/utils/config.ts)
import os from 'os';
import path from 'path';
import fs from 'fs';

const HOME = os.homedir();
const DIR = path.join(HOME, '.envshield');
const FILE = path.join(DIR, 'config.json');

export function getConfig() {
  if (!fs.existsSync(FILE)) return null;
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

export function saveConfig(cfg: any) {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

export function clearConfig() {
  if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
}

10.4 CLI API helper (cli/src/utils/api.ts)
import axios from 'axios';
import { getConfig } from './config';

export const api = axios.create({
  baseURL: process.env.ENVSHIELD_API_URL || 'https://envshield.vercel.app/api/v1',
  timeout: 30000,
});

api.interceptors.request.use(config => {
  const cfg = getConfig();
  if (cfg?.token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${cfg.token}`,
    };
  }
  return config;
});

10.5 Commands (brief)
envshield login

Flow:

Prompt email & password (inquirer).

POST /api/v1/cli/auth.

On success: save token in ~/.envshield/config.json and print success.

Example:

$ envshield login
? Email: user@example.com
? Password: ********
🔑 Authenticating...
✅ Logged in successfully as user@example.com
Token saved to ~/.envshield/config.json

envshield logout

Clears config.

envshield whoami

GET /api/v1/cli/whoami, prints user info and token name/last used.

envshield init

Lists projects from /api/v1/projects.

Prompt user to select project & environment.

Writes .envshield file to current directory:

{ "projectSlug": "my-app", "environment": "dev" }

envshield pull [--env <env>] [--output <file>]

Read .envshield or prompt.

POST /api/v1/cli/pull and receives decrypted variables.

Write to .env or specified file.

Print spinner and success message. Show progress bar if many vars (simulate progress via ora).

Example:

$ envshield pull
🔑 Authenticating... ✓
🔄 Pulling variables from my-app (development)...
⏳  Pull progress: 23/23
✅ Pulled 23 variables to .env

envshield push [--env <env>] [--file <file>]

Read env file, parse KEY=VALUE.

Compute diff against server variables (call /api/v1/projects/:slug/environments/:env/variables).

Display counts: will update 3, create 2. Confirm via inquirer.

POST /api/v1/cli/push with variables; server encrypts and stores them.

On success, print audit log summary.

Example:

$ envshield push
Reading .env...
Comparing with remote...
? This will update 3 variables and create 2 new variables. Continue? Yes
🔄 Pushing 5 variables...
✅ Successfully pushed 5 variables

envshield list

GET /api/v1/projects.

Print projects and environment counts.

10.6 CLI UI extras

Use ora.start('message') and ora.succeed('done').

Use chalk for label emphasis.

Provide --json flag for machine-friendly output.

11. Web dashboard: pages, flows, components
11.1 Key pages

/ — Landing page with CTA.

/login — Email/password login.

/register — Signup.

/projects — List of projects (cards).

/projects/[projectId] — Project overview (environments, stats).

/projects/[projectId]/environments/[envId] — Variables list, search, add, bulk import/export.

/projects/[projectId]/settings — Project settings, team invites, audit logs, danger zone.

/team — list projects user is member of with quick actions.

/settings — user profile, API tokens, security settings.

11.2 UX details

Variable table: key, masked value (click to reveal), description, last updated, actions (edit/delete/history).

Masking: Default masked values (********) for VIEWER. Reveal only for permitted roles and with audit trail (log who viewed).

Add/Edit Variable modal: validates key with [A-Z0-9_]+.

Bulk import: .env parsing with conflict preview.

Audit logs: filterable, paginated.

Team invite: invite by email; sends an email invite if user not present.

11.3 Client/server rendering

Use Server Components for data fetching on pages that require auth and heavy data.

Use Client Components for interactive modals, forms, and stateful UI.

12. Audit logging, version control, and variable history

AuditLog model tracks CREATE/UPDATE/DELETE with metadata, IP, userAgent.

VariableHistory records previous values (encrypted), who changed them, and timestamp.

The UI shows history per variable with ability to rollback (OWNER/ADMIN only).

Every sensitive operation (viewing decrypted value included) should be logged. For sensitive view logs, store only metadata (which key was viewed) — do not store plaintext in logs.

13. Dev & deployment guide
13.1 Required environment variables

Add to .env.local (development) and to Vercel env vars (production):

DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
ENCRYPTION_KEY="<64_hex_chars>"
BETTER_AUTH_API_KEY="<...>"
BETTER_AUTH_BASE_URL="<...>"
JWT_SECRET="<...>" # if needed by Better Auth
NEXTAUTH_URL="http://localhost:3000" # if NextAuth used in fallback
ENVSHIELD_API_URL="https://envshield.vercel.app"


Keep ENCRYPTION_KEY secure and rotate carefully.

13.2 Local setup (Cursor-friendly script)

git clone <repo>

cd envshield

cp .env.example .env.local and fill in values

pnpm install (or npm install)

npx prisma migrate dev --name init

pnpm dev (next dev)

cd cli && pnpm build && pnpm link (for local CLI usage)

13.3 Vercel deployment

Connect repo to Vercel, set environment variables in Project Settings for Production/Preview/Development, deploy.

14. Testing strategy (Jest-based)

Unit tests for:

encryption utils (encrypt/decrypt).

permissions functions.

CLI config parsing and .env parsing.

Integration tests:

API route behavior with a test database (use sqlite or ephemeral Neon).

Auth flows mocking Better Auth.

E2E can be added later; for now focus on unit/integration via Jest.

15. Implementation checklist & Cursor agent instructions

This section is a step-by-step script Cursor can follow to scaffold & implement EnvShield. Use these steps as tasks for the agent (or GitHub issues).

Phase 1 — Core Backend

Scaffold Next.js 14 monorepo with TypeScript and Tailwind.

Add prisma & @prisma/client, configure prisma/schema.prisma (use provided schema).

Implement lib/db.ts with Prisma client singleton.

Implement lib/encryption.ts (AES-256-GCM) using the snippet above.

Implement Better Auth wrapper (lib/betterAuth.ts) and middleware to get current user (session cookie or token).

Implement auth routes:

/api/v1/auth/register (create user & hash password).

/api/v1/auth/login (create session cookie).

password reset endpoints.

Implement CLI token creation /api/v1/cli/auth.

Implement project CRUD routes, environment routes, variable CRUD. Use Zod for validation. Ensure encryption applied before storage.

Implement permission checks for each route (using lib/permissions.ts).

Implement audit logging for all changes.

Phase 2 — Web Dashboard

Build static landing page & auth pages.

Implement server components for projects and environments pages.

Add client components for variable modals and team invites.

Add styles with Tailwind v4.

Implement project settings (invite flow that calls POST /projects/:id/members).

Phase 3 — CLI

Create cli package with commander, axios, chalk, ora, inquirer.

Implement login/logout/whoami/init/pull/push/list.

Implement ~/.envshield/config.json file storage and secure file permissions.

Add progress & friendly outputs.

Test CLI flows locally against running dev server.

Phase 4 — Polish & Release

Add tests (Jest).

Security audit (validate no secrets are logged).

Publish CLI to npm as envshield-cli.

Prepare README.md and documentation.

Deploy to Vercel.

16. Appendices
16.1 Sample .env.example
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Encryption
ENCRYPTION_KEY=64_hex_characters_here

# Better Auth
BETTER_AUTH_API_KEY=...
BETTER_AUTH_BASE_URL=https://api.better-auth.example

# Misc
ENVSHIELD_API_URL=https://envshield.vercel.app
JWT_SECRET=...

16.2 CLI sample outputs & UX examples

Login success

$ envshield login
? Email: user@example.com
? Password: ********
🔑 Authenticating...
✅ Logged in successfully as user@example.com
Token saved to ~/.envshield/config.json


Pull

$ envshield pull
🔑 Authenticating... ✓
🔄 Fetching variables from my-app (development)
⏳  Pulling 23 variables
✅ Pulled 23 variables to .env (1.2s)


Push

$ envshield push
Reading .env...
Comparing with remote...
? This will update 3 variables and create 2 new variables. Continue? Yes
🔄 Pushing 5 variables...
✅ Successfully pushed 5 variables

16.3 Security notes (explicit)

Never store plaintext secret values in logs.

Use HTTPS everywhere.

Rate-limit api/cli/auth.

Hash tokens in DB with bcrypt (cost factor 12).

Rotate ENCRYPTION_KEY carefully (out-of-scope for v1, but plan key-rotation UX later).

17. Final notes for Cursor Agent

Use TypeScript strict mode everywhere.

Default to server components on Next.js pages unless interactivity is required.

Use Zod to validate incoming requests on server routes.

Implement clear, testable module boundaries: lib/db, lib/encryption, lib/betterAuth, lib/permissions.

Ensure the CLI is testable locally and able to point to a DEV_API_URL to test against local server.

Provide seed script for creating a demo user + demo project for quick manual testing (e.g., prisma/seed.ts).

18. Example code stubs to drop into the repo (quick list)

lib/encryption.ts (provided above)

prisma/schema.prisma (provided above)

lib/permissions.ts (provided above)

lib/authMiddleware.ts (pattern provided)

app/api/v1/cli/auth/route.ts (example provided)

cli/src/index.ts (Commmander entrypoint wiring up commands above)

19. End of documentation