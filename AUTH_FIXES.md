# Authentication Fixes Applied

## Summary
Fixed all authentication issues including OAuth redirects, session management, password validation, and logger errors. The app now properly authenticates users via email/password and OAuth (Google/GitHub), maintains sessions, and protects routes.

## Issues Fixed

### 1. ✅ Bcrypt "Illegal arguments" Error
**Problem**: The login route was failing with "Illegal arguments: string, object" when comparing passwords.

**Cause**: OAuth-only users (Google/GitHub sign-in) don't have a `passwordHash` in the database (it's nullable). When these users tried to login with email/password, the code was passing `null` to bcrypt's `compare()` function.

**Fix**: Added a check to verify `passwordHash` exists before attempting password comparison. If the user is OAuth-only, returns a helpful error message directing them to use social login.

```typescript
// Check if user has a password (OAuth-only users don't have passwords)
if (!user.passwordHash) {
  throw new AuthError("This account uses social login. Please sign in with Google or GitHub.");
}
```

### 2. ✅ Pino Logger Thread-Stream Module Error
**Problem**: Application was crashing with `Cannot find module 'C:\ROOT\node_modules\thread-stream\lib\worker.js'`

**Cause**: `pino-pretty` uses worker threads which can cause issues in certain Next.js environments and Windows paths.

**Fix**: Made pretty printing conditional and safer:
- Only enables `pino-pretty` when `USE_PRETTY_LOGS=true` environment variable is set
- Falls back to regular JSON logging otherwise
- Prevents worker thread crashes in production/problematic environments

**To enable pretty logs** (optional):
```bash
# Add to .env.local
USE_PRETTY_LOGS=true
```

### 3. ✅ OAuth Redirect to Non-Existent /dashboard
**Problem**: After successful GitHub/Google authentication, users were redirected to `/dashboard` which doesn't exist, causing 404 errors.

**Cause**: The actual dashboard is in the `app/(dashboard)` route group, which maps to `/` not `/dashboard`.

**Fix**: 
- Updated `OAuthButtons.tsx` to redirect to `/` instead of `/dashboard`
- Added `onSuccess` callback in Better Auth configuration to ensure proper redirect
- The route group `(dashboard)` means the pages inside it are served at the root path

### 4. ✅ Google OAuth State Mismatch
**Problem**: OAuth state parameter validation failing, causing authentication to fail.

**Cause**: Cookie SameSite policy was too strict for OAuth callback flows.

**Fix**: 
- Added `baseURL` configuration to Better Auth
- Changed cookie `sameSite` from default "strict" to "lax" for OAuth compatibility
- Ensured `NEXT_PUBLIC_APP_URL` matches exactly with OAuth app callback URLs

## OAuth Setup Checklist

Ensure your OAuth apps are configured correctly:

### Google OAuth Console
Authorized redirect URIs must include:
```
http://localhost:3000/api/auth/callback/google
```

### GitHub OAuth Apps
Both test and production apps need:
```
Authorization callback URL: http://localhost:3000/api/auth/callback/github
```

### Environment Variables
Verify in `.env.local`:
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Must match OAuth redirect URIs exactly
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_TEST_CLIENT_ID="..."
GITHUB_TEST_CLIENT_SECRET="..."
```

## Complete Authentication Flow

### OAuth Flow (Google/GitHub)
1. User clicks "Sign in with Google/GitHub" on `/login`
2. Redirected to OAuth provider
3. After authorization, redirected to `/api/auth/callback/google` or `/api/auth/callback/github`
4. Better Auth creates session and sets cookie
5. Redirected to `/` (dashboard home)
6. SessionProvider validates session
7. Dashboard loads with real user data

### Email/Password Flow
1. User enters credentials on `/login`
2. POST to `/api/v1/auth/login`
3. Server validates credentials and creates JWT cookie
4. Client redirected to `/`
5. SessionProvider validates session (JWT or Better Auth)
6. Dashboard loads with real user data

### Route Protection
- **Protected routes** (dashboard): Wrapped in `<SessionProvider requireAuth>`
  - Redirects to `/login` if not authenticated
  - Shows loading spinner while checking
  
- **Auth routes** (login/register): Wrapped in `<SessionProvider requireAuth={false}>`
  - Redirects to `/` if already authenticated
  - Prevents logged-in users from accessing login pages

## Testing Instructions

1. **Restart the development server** to apply all changes:
   ```bash
   npm run dev
   ```

2. **Test OAuth Login**:
   - Navigate to `/login` (or click from homepage)
   - Click "Sign in with Google" or "Sign in with GitHub"
   - Complete OAuth flow
   - Should redirect to `/` (dashboard home)
   - Should see your real name and email in the dashboard header
   - No state mismatch errors

3. **Test Email/Password Login**:
   - Navigate to `/login`
   - Try logging in with email/password
   - Should redirect to `/` on success
   - Should work for users created via registration
   - Should show helpful error for OAuth-only users (e.g., "This account uses social login")

4. **Test Route Protection**:
   - While logged in, try to access `/login` → should redirect to `/`
   - Log out, try to access `/` → should redirect to `/login`
   - Dashboard should show real user data (not hardcoded)

5. **Test Session Persistence**:
   - Log in with any method
   - Refresh the page
   - Should remain logged in
   - Dashboard should still show your data

6. **Verify No Logger Errors**:
   - Check terminal for any thread-stream errors
   - Should see clean logs without crashes
   - (Optional) Set `USE_PRETTY_LOGS=true` in `.env.local` for colored logs

### 5. ✅ Session Management & Route Protection
**Problem**: Dashboard was not checking authentication, allowing access without login. No session validation or route protection existed.

**Cause**: 
- Dashboard layout had hardcoded user data
- No SessionProvider wrapping the app
- No authentication checks on protected routes
- Authenticated users could still access `/login` and `/register`

**Fix**: 
- Created `SessionProvider` component using Better Auth's `useSession()` hook
- Wrapped dashboard routes with `<SessionProvider requireAuth>` to enforce authentication
- Wrapped auth routes with `<SessionProvider requireAuth={false}>` to redirect logged-in users
- Updated dashboard layout to:
  - Fetch real user data from session
  - Display user's name, email, and profile image
  - Show loading state while checking authentication
  - Redirect to login if not authenticated

**Files Changed**:
```typescript
// components/providers/SessionProvider.tsx - New file
// Handles auth checking and redirects

// app/(dashboard)/layout.tsx - Updated
// Now uses real session data and enforces auth

// app/(auth)/layout.tsx - Updated
// Redirects authenticated users away from login/register
```

## Additional Recommendations

1. **Clear Browser Cookies**: If issues persist, clear cookies for `localhost:3000`

2. **Check OAuth App Settings**: Double-check that callback URLs match exactly (including http vs https, ports, paths)

3. **Database State**: If you have users created before these fixes, they should still work. OAuth users will have `passwordHash: null`

4. **Production Deployment**: When deploying:
   - Update `NEXT_PUBLIC_APP_URL` to your production domain
   - Update OAuth callback URLs in Google/GitHub to production URLs
   - Set `NODE_ENV=production`
   - Use secure cookies (automatically enabled in production)
