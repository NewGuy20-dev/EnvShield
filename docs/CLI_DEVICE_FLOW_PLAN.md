# EnvShield CLI Browser-Based OAuth / Device Flow Plan

This document defines a detailed, implementation-ready specification for adding a **browser-based OAuth/device flow** for `envshield login`.

The goal is to let the CLI open a browser for the user to log in via the EnvShield web UI (Better Auth + OAuth providers). Once the user approves the request in the browser, the CLI automatically receives an API token and stores it in `~/.envshield/config.json`.

---

## 0. High-Level Design

### Goal

Replace (for the default interactive case) the current CLI email/password login with a **device-style flow**:

1. CLI requests a new **device session** from the backend.
2. Backend creates a short-lived **`CliDeviceSession`** row and returns:
   - `deviceCode` (opaque identifier).
   - `verificationUrl` (a URL to open in a browser).
   - `expiresAt`, `pollInterval`.
3. CLI opens the browser at `verificationUrl` and starts **polling** for completion.
4. The user logs in via the web (Better Auth, including OAuth providers like Google/GitHub) and approves the CLI login.
5. Web UI calls a backend endpoint that:
   - Validates the user’s session.
   - Generates a new `esh_...` API token (using the existing `ApiToken` schema and security rules).
   - Attaches that token to the pending `CliDeviceSession` and marks it `APPROVED`.
6. CLI polling receives the approved status and token, saves it to `~/.envshield/config.json`, and exits authenticated.

### Constraints & Reuse

- Preferred flow: **browser-based**, no email/password from CLI.
- Keep existing capabilities:
  - `envshield login --token <esh_...>` for non-interactive login.
- Reuse existing infrastructure:
  - `auth`, `getAuthenticatedUserFromRequest` for web auth.
  - `ApiToken` model and `MAX_API_TOKENS_PER_USER` limit.
  - `cliLimiter`, `applyRateLimit`, `getClientIdentifier`.
  - `queueSecurityAlert` with `cli_token_created`.
- Do not store plaintext tokens long-term; use existing encryption helpers (`encryptForStorage` / `decryptFromStorage`) for any temporary persisted secrets.

---

## 1. Phase 1 – Data Model & Prisma

### 1.1 New Prisma Model

**File:** `prisma/schema.prisma`

Add a new model near other auth-related models (e.g. after `Session` / `Verification`):

```prisma
model CliDeviceSession {
  id             String   @id @default(cuid())
  deviceCode     String   @unique        // opaque identifier passed between CLI and backend
  userCode       String?                 // optional human-readable code if desired
  status         String                  // 'PENDING' | 'APPROVED' | 'EXPIRED' | 'CONSUMED' | 'CANCELLED'
  userId         String?                 // populated when session is approved
  tokenId        String?                 // points to ApiToken.id
  tokenName      String?                 // convenience for logs/UI
  encryptedToken String?  @db.Text       // encrypted plaintext token (AES-256-GCM JSON)
  createdAt      DateTime @default(now())
  expiresAt      DateTime
  approvedAt     DateTime?
  consumedAt     DateTime?
  clientIp       String?
  userAgent      String?

  user  User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  token ApiToken? @relation(fields: [tokenId], references: [id], onDelete: SetNull)

  @@map("cli_device_sessions")
  @@index([deviceCode])
  @@index([status])
  @@index([expiresAt])
}
``

### 1.2 Migration

- Create a migration named e.g. `20251115_add_cli_device_sessions`.
- Run:

```bash
npx prisma migrate dev --name add_cli_device_sessions
```

Acceptance criteria:

- New `cli_device_sessions` table exists in the DB with indexes on `deviceCode`, `status`, and `expiresAt`.

---

## 2. Phase 2 – Backend Device Flow Endpoints

Create 3 endpoints under `app/api/v1/cli/auth/device`:

- `POST /api/v1/cli/auth/device/start`
- `GET  /api/v1/cli/auth/device/poll?deviceCode=...`
- `POST /api/v1/cli/auth/device/complete`

These endpoints will coordinate the device-style login between CLI and browser.

### 2.1 Shared Imports & Utilities

All device endpoints will likely need imports along these lines:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { applyRateLimit, cliLimiter, getClientIdentifier } from '@/lib/rateLimit';
import { handleApiError, AuthError, ValidationError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { logger, logSecurityEvent } from '@/lib/logger';
import { MAX_API_TOKENS_PER_USER } from '@/lib/constants';
import { queueSecurityAlert } from '@/lib/securityEvents';
import { encryptForStorage, decryptFromStorage } from '@/lib/encryption';
```

Use `handleApiError` in all catch blocks for consistent error responses.

---

### 2.2 `POST /api/v1/cli/auth/device/start`

**File:** `app/api/v1/cli/auth/device/start/route.ts`

#### Request

- Method: `POST`
- JSON Body:

```ts
const startSchema = z.object({
  tokenName: z.string().max(128).optional(),
});
```

#### Behavior

1. **Rate limiting**

   - Use `cliLimiter` similar to existing `/api/v1/cli/auth` route.
   - Example: `30` requests per `60` seconds per identifier.

   ```ts
   const identifier = getClientIdentifier(req);
   const rate = await applyRateLimit(identifier, cliLimiter, 30, 60 * 1000);
   if (!rate.success) {
     logSecurityEvent('cli_rate_limit_exceeded', 'medium', {
       identifier,
       endpoint: '/api/v1/cli/auth/device/start',
     });
     return NextResponse.json(
       {
         error: 'Too many CLI authentication attempts',
         message: 'Please try again in a minute',
       },
       { status: 429 }
     );
   }
   ```

2. **Validate body**

   ```ts
   const body = await req.json();
   const parsed = startSchema.parse(body);
   ```

3. **Generate session identifiers**

   - `deviceCode`: opaque string used by both CLI and browser, e.g.:

     ```ts
     const deviceCode = crypto.randomBytes(24).toString('hex');
     ```

   - `userCode` (optional): short human-readable code for UI (if desired), e.g. 8 characters from base32.

   - `expiresAt`: `now + 10 minutes`.

4. **Determine base URL and verification URL**

   - Use `NEXT_PUBLIC_APP_URL` or fallback to localhost:

     ```ts
     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
     const verificationUrl = `${baseUrl}/cli/login?code=${encodeURIComponent(deviceCode)}`;
     ```

5. **Persist `CliDeviceSession`**

   ```ts
   const now = new Date();
   const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

   await prisma.cliDeviceSession.create({
     data: {
       deviceCode,
       userCode: null, // or generate one if desired
       status: 'PENDING',
       expiresAt,
       clientIp: identifier,
       userAgent: req.headers.get('user-agent') || null,
       tokenName: parsed.tokenName ?? 'CLI Token',
     },
   });
   ```

6. **Logging**

   ```ts
   logSecurityEvent('cli_device_start', 'low', {
     deviceCode,
     ip: identifier,
   });
   ```

7. **Response**

   ```ts
   return NextResponse.json({
     deviceCode,
     verificationUrl,
     expiresAt: expiresAt.toISOString(),
     pollInterval: 5,
     tokenName: parsed.tokenName ?? 'CLI Token',
   });
   ```

8. **Error handling**

   Wrap in `try/catch` and use `handleApiError(error)`.

#### Acceptance Criteria

- A `POST` to `/api/v1/cli/auth/device/start` returns a valid `deviceCode`, `verificationUrl`, `expiresAt`, and `pollInterval`.
- A row is created in `cli_device_sessions` with `status = 'PENDING'`.

---

### 2.3 `GET /api/v1/cli/auth/device/poll`

**File:** `app/api/v1/cli/auth/device/poll/route.ts`

#### Request

- Method: `GET`
- Query: `?deviceCode=<opaque-code>`

Schema:

```ts
const pollSchema = z.object({
  deviceCode: z.string().min(1),
});
```

#### Behavior

1. **Rate limit**

   - Same pattern as `start`, but you may allow slightly higher request count (polling uses more calls).

2. **Parse query**

   ```ts
   const url = new URL(req.url);
   const { deviceCode } = pollSchema.parse({
     deviceCode: url.searchParams.get('deviceCode'),
   });
   ```

3. **Load session**

   ```ts
   const session = await prisma.cliDeviceSession.findUnique({
     where: { deviceCode },
   });
   ```

4. **Handle missing session**

   - If `!session`, return HTTP `410`:

     ```ts
     return NextResponse.json(
       {
         status: 'expired',
         message: 'Session not found or expired',
       },
       { status: 410 }
     );
     ```

5. **Check expiry**

   ```ts
   const now = new Date();
   if (session.expiresAt <= now || ['EXPIRED', 'CONSUMED', 'CANCELLED'].includes(session.status)) {
     if (session.status !== 'EXPIRED' && session.status !== 'CONSUMED' && session.status !== 'CANCELLED') {
       await prisma.cliDeviceSession.update({
         where: { id: session.id },
         data: { status: 'EXPIRED' },
       });
     }

     return NextResponse.json(
       {
         status: 'expired',
         message: 'Session expired',
       },
       { status: 410 }
     );
   }
   ```

6. **Status == 'PENDING'**

   - Return HTTP 200 with `{ status: 'pending' }`.

7. **Status == 'APPROVED'**

   - Expect `encryptedToken` and `tokenId` to be populated.
   - Decrypt token:

     ```ts
     if (!session.encryptedToken || !session.tokenId) {
       return NextResponse.json(
         { status: 'pending' },
         { status: 200 }
       );
     }

     const tokenPlain = decryptFromStorage(session.encryptedToken);
     ```

   - Update session:

     ```ts
     await prisma.cliDeviceSession.update({
       where: { id: session.id },
       data: {
         status: 'CONSUMED',
         encryptedToken: null,
         consumedAt: new Date(),
       },
     });
     ```

   - Return:

     ```ts
     return NextResponse.json({
       status: 'approved',
       token: tokenPlain,
       tokenId: session.tokenId,
       tokenName: session.tokenName,
       // Optionally look up the ApiToken to return expiresAt
     });
     ```

8. **Error handling**

   Use `handleApiError(error)`.

#### Acceptance Criteria

- Polling a pending session returns `{ status: 'pending' }`.
- After session is marked `APPROVED` with an encrypted token, polling returns `{ status: 'approved', token: ..., ... }` and marks session `CONSUMED`.
- Expired or invalid sessions return HTTP 410 with `{ status: 'expired' }`.

---

### 2.4 `POST /api/v1/cli/auth/device/complete`

**File:** `app/api/v1/cli/auth/device/complete/route.ts`

#### Request

- Method: `POST`
- Body schema:

```ts
const completeSchema = z.object({
  deviceCode: z.string().min(1),
});
```

- Requires an authenticated web user (Better Auth session).

#### Behavior

1. **Authenticate user**

   ```ts
   const authResult = await getAuthenticatedUserFromRequest(req);
   if (!authResult) {
     throw new AuthError('Authentication required');
   }
   const userId = authResult.user.id;
   ```

2. **Parse body**

   ```ts
   const body = await req.json();
   const { deviceCode } = completeSchema.parse(body);
   ```

3. **Load session**

   ```ts
   const session = await prisma.cliDeviceSession.findUnique({
     where: { deviceCode },
   });

   if (!session) {
     throw new ValidationError('Device session not found');
   }
   ```

4. **Check expiry & status**

   ```ts
   const now = new Date();
   if (session.expiresAt <= now || ['EXPIRED', 'CONSUMED', 'CANCELLED'].includes(session.status)) {
     throw new ValidationError('Device session expired');
   }
   ```

5. **Idempotency**

   - If `session.status === 'APPROVED' && session.tokenId`:
     - Return HTTP 200 `{ status: 'ok', message: 'CLI login already approved.' }`.

6. **Generate API token** (reuse logic from `app/api/v1/cli/auth/route.ts`)

   ```ts
   const tokenPlain = 'esh_' + crypto.randomBytes(24).toString('hex');
   const tokenDigest = crypto.createHash('sha256').update(tokenPlain).digest('hex');
   const tokenHash = await hash(tokenPlain, 12);

   // Active token count check
   const activeTokens = await prisma.apiToken.count({
     where: {
       userId,
       OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
     },
   });

   if (activeTokens >= MAX_API_TOKENS_PER_USER) {
     throw new ValidationError(
       `You already have ${MAX_API_TOKENS_PER_USER} active tokens. Revoke an existing token first.`,
     );
   }

   const expiresAt = new Date();
   expiresAt.setFullYear(expiresAt.getFullYear() + 1);

   const token = await prisma.apiToken.create({
     data: {
       userId,
       tokenDigest,
       tokenHash,
       name: session.tokenName ?? 'CLI Token',
       expiresAt,
     },
   });
   ```

7. **Encrypt token for session**

   ```ts
   const encryptedToken = encryptForStorage(tokenPlain);
   ```

8. **Update session**

   ```ts
   await prisma.cliDeviceSession.update({
     where: { id: session.id },
     data: {
       status: 'APPROVED',
       userId,
       tokenId: token.id,
       tokenName: token.name,
       encryptedToken,
       approvedAt: new Date(),
     },
   });
   ```

9. **Log security events**

   ```ts
   logSecurityEvent('cli_device_approved', 'medium', {
     userId,
     deviceCode,
   });

   await queueSecurityAlert({
     userId,
     type: 'cli_token_created',
     metadata: {
       tokenName: token.name,
       ip: getClientIdentifier(req),
     },
   });
   ```

10. **Response**

    ```ts
    return NextResponse.json({
      status: 'ok',
      message: 'CLI login approved. You can return to your terminal.',
    });
    ```

11. **Error handling**

    Use `handleApiError(error)`.

#### Acceptance Criteria

- Given an authenticated user and valid `deviceCode`, `complete` creates an API token and updates `CliDeviceSession` to `APPROVED`.
- Subsequent `poll` calls return `approved` with token, and then consume the session.

---

## 3. Phase 3 – Frontend `/cli/login` Page

**File:** `app/(auth)/cli/login/page.tsx`

This page coordinates the browser-side half of the device flow.

### 3.1 Route & Query Params

- Path: `/cli/login`
- Query parameter: `code=<deviceCode>`

Behavioral steps:

1. Validate that `code` is present; if missing, render an error.
2. Check authentication state using Better Auth (`auth()` or similar).
3. If **not authenticated**:
   - Redirect the user to the main login page with a redirect back to `/cli/login`:
     - Example: `/login?redirect=/cli/login&code=<code>`.
4. If **authenticated**:
   - Fetch the device session (optional but recommended) to confirm it exists and is not expired.
   - Render a confirmation UI:
     - "CLI Login Request"
     - Show email of current user.
     - Show device info if desired (IP from session, etc.).
     - Buttons: **Approve**, **Cancel**.

### 3.2 Approve Flow

- On Approve button click (client component):

  ```ts
  const res = await fetch('/api/v1/cli/auth/device/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceCode: codeFromQuery }),
  });
  ```

- If response ok:
  - Show success message: "CLI login approved. You can return to your terminal now."
- If error:
  - Show error text from response JSON.

### 3.3 States

Implement these UI states:

1. **Missing code**: show "Invalid CLI login request".
2. **Expired/invalid device session** (optional extra server check): show "This CLI login request has expired. Please run `envshield login` again.".
3. **Logged-out**: immediate redirect to `/login?redirect=/cli/login&code=...`.
4. **Logged-in + valid session**: show confirmation UI with Approve/Cancel.

---

## 4. Phase 4 – CLI Changes: `envshield login`

**File:** `cli/src/commands/login.ts`

### 4.1 New default interactive flow (device flow)

Replace the current email/password prompts for the default `envshield login` with a device flow.

#### 4.1.1 Start device login

1. Prompt user for an optional token name (similar to current implementation):

   ```ts
   const { tokenName } = await inquirer.prompt([
     {
       type: 'input',
       name: 'tokenName',
       message: 'Token name (optional):',
       default: `CLI Token - ${new Date().toLocaleDateString()}`,
     },
   ]);
   ```

2. Call backend:

   ```ts
   const apiUrl = options.apiUrl || getDefaultApiUrl();
   const api = createApiClient();
   api.defaults.baseURL = apiUrl;

   const startSpinner = ... // existing spinner utility

   const spinner = startSpinner('Starting CLI login...');
   const { data: startData } = await api.post<DeviceStartResponse>(
     '/cli/auth/device/start',
     { tokenName },
   );
   spinner.succeed('Browser login started');
   ```

3. Output verification URL and attempt to open browser:

   ```ts
   console.log(`\nPlease complete login in your browser at:\n  ${startData.verificationUrl}\n`);

   try {
     await openInBrowser(startData.verificationUrl); // implement cross-platform helper
   } catch {
     console.log('Unable to open browser automatically. Please open the URL manually.');
   }
   ```

#### 4.1.2 Polling loop

Define types on the CLI side:

```ts
interface DeviceStartResponse {
  deviceCode: string;
  verificationUrl: string;
  expiresAt: string;
  pollInterval: number;
  tokenName?: string;
}

interface DevicePollPending {
  status: 'pending';
}

interface DevicePollApproved {
  status: 'approved';
  token: string;
  tokenId: string;
  tokenName: string;
  expiresAt?: string;
}

interface DevicePollExpired {
  status: 'expired';
  message?: string;
}

type DevicePollResponse = DevicePollPending | DevicePollApproved | DevicePollExpired;
```

Polling logic:

```ts
const pollSpinner = startSpinner('Waiting for browser approval...');

const maxDurationMs = 15 * 60 * 1000; // 15 minutes
const startTime = Date.now();
const pollIntervalMs = (startData.pollInterval ?? 5) * 1000;

while (true) {
  if (Date.now() - startTime > maxDurationMs) {
    pollSpinner.fail('CLI login timed out');
    process.exit(1);
  }

  let pollResponse;
  try {
    const res = await api.get<DevicePollResponse>('/cli/auth/device/poll', {
      params: { deviceCode: startData.deviceCode },
      validateStatus: () => true,
    });
    pollResponse = res.data;

    // Map HTTP 410 or other codes to expired state if needed
    if (res.status === 410) {
      pollResponse = { status: 'expired', message: pollResponse.message };
    }
  } catch (err) {
    pollSpinner.fail('Error polling for CLI login status');
    handleApiError(err);
  }

  if (pollResponse.status === 'pending') {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    continue;
  }

  if (pollResponse.status === 'approved') {
    pollSpinner.succeed('CLI login approved');

    // Save token to config
    saveConfig(
      {
        apiUrl,
        token: pollResponse.token,
        tokenId: pollResponse.tokenId,
        tokenName: pollResponse.tokenName,
        expiresAt: pollResponse.expiresAt,
      },
      options.profile,
    );

    success(
      `Logged in successfully${options.profile ? ` (profile: ${options.profile})` : ''}`,
    );
    console.log('Token saved to ~/.envshield/config.json');
    return;
  }

  if (pollResponse.status === 'expired') {
    pollSpinner.fail(pollResponse.message || 'CLI login expired');
    process.exit(1);
  }
}
```

### 4.2 Preserve existing token-based login

- Keep `tokenBasedLogin` as-is for `--token` usage.
- CLI should behave as:

  - `envshield login` → new device/browser flow.
  - `envshield login --token <esh_...>` → validate given token via `/cli/whoami` and save config.

### 4.3 Optional legacy email/password mode

(Only if desired)

- Add a flag:

  ```ts
  .option('--password', 'Use email/password flow instead of browser device flow')
  ```

- If `options.password` is true, use the existing email/password logic hitting `/cli/auth`.
- Otherwise, use the new device flow as default.

---

## 5. Phase 5 – Security & Edge Cases

### 5.1 Token Security

- `CliDeviceSession` should never store plaintext tokens long-term.
- Always:
  - Generate token plaintext and hash/digest for `ApiToken` as usual.
  - Encrypt token plaintext with `encryptForStorage` before saving to `encryptedToken`.
  - On successful `poll` where token is returned to CLI, update the session:
    - `status = 'CONSUMED'`
    - `encryptedToken = null`
    - `consumedAt = now`.

### 5.2 Expiry

- Device sessions expire after ~10 minutes.
- CLI polling should also have a hard timeout (15 minutes) in case of network issues.

### 5.3 Multiple Sessions

- Allow multiple concurrent `CliDeviceSession` entries per user; `deviceCode` uniqueness keeps them distinct.
- Each `deviceCode` is single-use:
  - After `CONSUMED`, further polls should treat it as expired.

### 5.4 Logging & Alerts

- Reuse `cli_token_created` alerts on token creation.
- Add new log events via `logSecurityEvent`:
  - `cli_device_start` (low severity)
  - `cli_device_approved` (medium)
  - Optional: `cli_device_expired`, `cli_device_cancelled`.

---

## 6. Phase 6 – Tests & Docs

### 6.1 Backend tests

- Add a test suite (if applicable) that covers:

  - `POST /cli/auth/device/start`:
    - Creates a `CliDeviceSession` row.
    - Returns `verificationUrl` and `deviceCode`.
  - `GET /cli/auth/device/poll`:
    - Pending session → `{ status: 'pending' }`.
    - After manually setting `status='APPROVED'`, `encryptedToken` set, and `tokenId` set → returns `{ status: 'approved', token, ... }` and changes session to `CONSUMED`.
    - Expired session → returns 410 `{ status: 'expired' }`.
  - `POST /cli/auth/device/complete`:
    - With authenticated user and valid `deviceCode` → generates `ApiToken`, encrypts token, and sets session to `APPROVED`.
    - Called again → idempotent; still returns 200 without creating additional tokens.

### 6.2 CLI tests (optional but recommended)

- Once a CLI testing harness exists:

  - Mock API responses for `/start`, `/poll` and test:
    - Success path (pending → approved).
    - Expired path (410/expired status).
    - Timeout path.

### 6.3 Documentation

- Update `docs/CLI_REFERENCE.md`:

  - Under `login`:
    - Describe new behavior:
      - `envshield login` opens the browser at a CLI-specific login page.
      - After approving in the browser, the CLI completes login automatically.
  - Document `--token` usage for non-interactive login.
  - If you keep a legacy password mode, document `--password` flag.

---

## 7. Implementation Order (for Agents)

1. **Agent 1 – Backend (DB + Routes)**
   - Add `CliDeviceSession` model and migration.
   - Implement `/start`, `/poll`, `/complete` with tests.
2. **Agent 2 – Frontend**
   - Implement `/cli/login` page and integrate with Better Auth login/redirects.
3. **Agent 3 – CLI**
   - Modify `login.ts` to use device flow by default.
   - Implement browser-open helper and polling loop.
4. **Agent 4 – QA**
   - Manual end-to-end test:
     - Run `envshield login`.
     - Confirm browser opens, login works, CLI receives token.
   - Run regression checks on `--token` login.
5. **Agent 5 – Docs**
   - Update `CLI_REFERENCE.md` and any onboarding docs to describe the new device flow.
