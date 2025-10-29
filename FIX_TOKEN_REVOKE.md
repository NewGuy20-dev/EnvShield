# Fix for Token Revoke Issue

## What I Fixed

The issue was with Next.js 15's async params. I updated the DELETE endpoint to properly await the params.

## Steps to Fix

### 1. Restart Your Dev Server (REQUIRED!)

```bash
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### 2. Clear Browser Cache

- Press Ctrl+Shift+R (hard reload)
- Or clear cache in DevTools (F12 → Application → Clear storage)

### 3. Try Revoking Again

1. Go to Settings → API Tokens
2. Click "Revoke" on any token
3. Confirm the dialog
4. Open browser console (F12) to see logs

### 4. Check Console Logs

**You should see:**
- Browser: `[Frontend] Revoking token: clxx...`
- Browser: `[Frontend] Response status: 200`
- Terminal: `[Token Delete] Token deleted successfully`

## If Still Not Working

### Check 1: File Exists
Verify this file exists:
```
app/api/v1/tokens/[tokenId]/route.ts
```

### Check 2: Next.js Cache
```bash
# Delete .next folder and restart
rm -rf .next
npm run dev
```

### Check 3: Database Connection
```bash
# Make sure database is accessible
npx prisma studio
```

### Check 4: Authentication
- Make sure you're logged in
- Check browser has `auth-token` cookie (DevTools → Application → Cookies)

## Quick Test

Create and revoke a test token:

1. Settings → API Tokens
2. Create token named "Test"
3. Don't copy it (we're deleting it anyway)
4. Click "Revoke"
5. Should disappear immediately

## Common Errors

### Error: 404 Not Found
- **Fix:** Restart dev server

### Error: 401 Unauthorized
- **Fix:** Login again

### Error: Token not found
- **Fix:** Refresh the tokens list first

## The Fix Applied

Changed this:
```typescript
// OLD - doesn't work in Next.js 15
{ params }: { params: { tokenId: string } }

// NEW - works correctly
context: { params: Promise<{ tokenId: string }> }
const params = await context.params;
```

After restarting the server, token revocation should work!
