# Token Revoke Debugging Guide

## Issue
Unable to revoke API tokens from the dashboard.

## Files Updated
1. `app/api/v1/tokens/[tokenId]/route.ts` - Fixed Next.js 15 async params issue
2. `app/(dashboard)/settings/page.tsx` - Added console logging

## How to Test & Debug

### Step 1: Restart Dev Server
**IMPORTANT:** After the file changes, you MUST restart the dev server:

```bash
# Kill the current dev server (Ctrl+C)
# Then start it again
npm run dev
```

### Step 2: Clear Browser Cache
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Do a hard refresh (Ctrl+Shift+R)

### Step 3: Test Token Revocation

1. **Open Browser Console** (F12 → Console tab)
2. **Go to Settings → API Tokens**
3. **Create a test token** (if you don't have one):
   - Name: "Test Token"
   - Click "Create"
   - Copy the token for testing later

4. **Try to revoke the token:**
   - Click the "Revoke" button
   - Confirm the dialog
   - Watch the console for logs

### Step 4: Check Console Logs

You should see logs like this:

**Frontend (Browser Console):**
```
[Frontend] Revoking token: clxxx...
[Frontend] Response status: 200
```

**Backend (Terminal/Dev Server):**
```
[Token Delete] Attempting to delete token: clxxx... for user: clyyyy...
[Token Delete] Token deleted successfully: clxxx...
```

### Common Issues & Solutions

#### Issue 1: 404 Not Found
**Symptom:** Console shows "404" response status

**Solution:**
- Restart the dev server: `npm run dev`
- Check file exists at: `app/api/v1/tokens/[tokenId]/route.ts`
- Clear Next.js cache: `rm -rf .next` then `npm run dev`

#### Issue 2: 401 Unauthorized
**Symptom:** Console shows "401" response status

**Solution:**
- You're not logged in
- Login again
- Check browser has `auth-token` cookie (DevTools → Application → Cookies)

#### Issue 3: 403 Forbidden
**Symptom:** Console shows "403" response status
**Backend logs:** "Permission denied. Token owner: X Request user: Y"

**Solution:**
- The token belongs to a different user
- Make sure you're logged in with the correct account
- Create a new token with your current account

#### Issue 4: 500 Internal Server Error
**Symptom:** Console shows "500" response status

**Solution:**
- Check backend console for error details
- Look for "[Token Delete] Error:" in the logs
- Possible database connection issue
- Make sure Prisma is properly connected

#### Issue 5: Network Error
**Symptom:** Browser console shows "Failed to fetch" or CORS error

**Solution:**
- Dev server isn't running
- Start it: `npm run dev`
- Check it's accessible at http://localhost:3000 or 3001

### Step 5: Manual API Test

Test the API directly using curl or browser:

```bash
# Get your auth token from browser cookies first
# DevTools → Application → Cookies → auth-token

# Test the endpoint directly
curl -X DELETE "http://localhost:3000/api/v1/tokens/YOUR_TOKEN_ID_HERE" \
  -H "Cookie: auth-token=YOUR_AUTH_COOKIE_HERE" \
  -v
```

### Step 6: Check Database

Verify tokens exist in database:

```bash
# Open Prisma Studio
npx prisma studio

# Or query directly
npx prisma db seed  # if you have a seed script
```

Look at the `api_tokens` table:
- Check tokens exist
- Note the `id` field (this is what you need to delete)
- Note the `userId` field (must match your logged-in user)

## Expected Behavior

When working correctly:

1. Click "Revoke" button
2. Confirmation dialog appears
3. Click "OK"
4. Console logs appear (both frontend and backend)
5. Token disappears from the list
6. Success message: "Token revoked successfully"
7. Token is removed from database

## Quick Fix Steps

If it's still not working after following all steps:

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Clear Next.js cache
rm -rf .next

# 3. Reinstall dependencies (if needed)
npm install

# 4. Regenerate Prisma client
npx prisma generate

# 5. Start dev server
npm run dev

# 6. In browser:
#    - Clear cache (Ctrl+Shift+Delete)
#    - Hard reload (Ctrl+Shift+R)
#    - Try again
```

## Verify Fix is Working

After restarting, check:

1. Dev server console shows no errors
2. File `app/api/v1/tokens/[tokenId]/route.ts` exists
3. Browser console shows no errors on page load
4. Can see tokens list in Settings → API Tokens
5. Revoke button is clickable

## Still Not Working?

Provide these details:
1. Browser console output (screenshot or copy/paste)
2. Dev server terminal output (last 30 lines)
3. Any error messages
4. Response status code from network tab

The token deletion should work after:
1. Restarting the dev server
2. Clearing browser cache
3. Testing with console logs visible
