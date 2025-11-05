# OAuth State Mismatch Fix

## Problem
Getting "State Mismatch. Verification not found" error during GitHub/Google OAuth callback.

## Root Cause
Better Auth stores OAuth state in:
1. **Cookie** - Short-lived state cookie during OAuth flow
2. **Database (Verification table)** - State record for validation

The state cookie wasn't persisting between OAuth initiation and callback due to:
- Missing middleware for cookie handling
- Incorrect cookie SameSite settings
- Missing trustProxy configuration

## Fixes Applied

### 1. Created Next.js Middleware (`middleware.ts`)
```typescript
// Ensures cookies are properly preserved during OAuth flow
// Sets correct cookie attributes (SameSite: lax, httpOnly, etc.)
```

### 2. Updated Better Auth Configuration (`lib/auth.ts`)
- Added `trustProxy: true` for proper header handling
- Configured session cookie settings with `sameSite: "lax"`
- Added explicit cookie configuration in session settings
- Added error callbacks for better debugging

### 3. Fixed Cookie Settings
```typescript
session: {
  cookie: {
    name: "envshield.session",
    sameSite: "lax", // Critical for OAuth redirects
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  },
}
```

## Testing Steps

### 1. Restart Development Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 2. Clear Browser State
Before testing, clear cookies for `localhost:3000`:
- Chrome: DevTools → Application → Cookies → Clear all
- Or use incognito/private browsing mode

### 3. Test OAuth Flow

**GitHub:**
1. Go to http://localhost:3000/login
2. Click "Sign in with GitHub"
3. Authorize on GitHub
4. Should redirect to `/` (dashboard)
5. Should see your GitHub name/email in dashboard
6. ✅ No "State Mismatch" error

**Google:**
1. Go to http://localhost:3000/login
2. Click "Sign in with Google"
3. Select Google account
4. Should redirect to `/` (dashboard)
5. Should see your Google name/email in dashboard
6. ✅ No "State Mismatch" error

### 4. Check Terminal Logs
Should see:
```
✅ POST /api/auth/sign-in/social 200
✅ GET /api/auth/callback/github 200
✅ GET / 200
```

Should NOT see:
```
❌ ERROR [Better Auth]: State Mismatch
```

## Troubleshooting

### If Still Getting State Mismatch:

1. **Verify .env.local:**
   ```bash
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
   Must be EXACTLY `http://localhost:3000` (no trailing slash)

2. **Check OAuth App Settings:**
   
   **GitHub:**
   - Go to GitHub OAuth App settings
   - Authorization callback URL must be EXACTLY:
     ```
     http://localhost:3000/api/auth/callback/github
     ```

   **Google:**
   - Go to Google Cloud Console → Credentials
   - Authorized redirect URIs must include:
     ```
     http://localhost:3000/api/auth/callback/google
     ```

3. **Check Database Connection:**
   ```bash
   # Verify Prisma can access database
   npx prisma db pull
   
   # Check Verification table exists
   npx prisma studio
   # Navigate to Verification table
   ```

4. **Clear ALL State:**
   ```bash
   # Stop server
   # Delete node_modules/.cache
   rm -rf node_modules/.cache
   # Delete .next
   rm -rf .next
   # Reinstall
   npm install
   # Restart
   npm run dev
   ```

5. **Enable Debug Logging:**
   Add to `.env.local`:
   ```bash
   LOG_LEVEL=debug
   ```
   Then check terminal for detailed Better Auth logs.

## How OAuth State Works

1. **User clicks "Sign in with GitHub"**
   - Better Auth generates random state string
   - Stores state in Verification table
   - Sets state cookie in browser
   - Redirects to GitHub OAuth

2. **User authorizes on GitHub**
   - GitHub redirects back to `/api/auth/callback/github?state=XXX&code=YYY`

3. **Better Auth validates:**
   - Reads state from URL param
   - Reads state from cookie
   - Checks Verification table for matching state
   - If all match → success
   - If mismatch → "State Mismatch" error

The middleware and configuration fixes ensure step 2-3 work correctly.

## Success Criteria

✅ OAuth login completes without errors  
✅ User redirected to dashboard  
✅ Real user data displayed (name, email, profile image)  
✅ Session persists after page refresh  
✅ No "State Mismatch" in terminal logs
