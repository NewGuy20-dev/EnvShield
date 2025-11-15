-- Migration: Remove plaintext token column and add tokenHash
-- This migration ensures all API tokens use secure storage with SHA-256 digest

-- Step 1: Add tokenHash column if it doesn't exist (for bcrypt hash)
ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS token_hash TEXT;

-- Step 2: Make tokenDigest required and ensure it's populated
-- For any existing tokens without tokenDigest, we'll need to regenerate them
-- This is intentional - we want to force regeneration of insecure tokens
UPDATE api_tokens 
SET token_digest = NULL 
WHERE token_digest IS NULL OR token_digest = '';

-- Step 3: Make tokenDigest NOT NULL (will fail if any rows have NULL - users must regenerate tokens)
ALTER TABLE api_tokens ALTER COLUMN token_digest SET NOT NULL;

-- Step 4: Drop the old token column (contains plaintext or bcrypt hash)
ALTER TABLE api_tokens DROP COLUMN IF EXISTS token;

-- Step 5: Update index from token to tokenDigest
DROP INDEX IF EXISTS "api_tokens_token_key";
DROP INDEX IF EXISTS "api_tokens_token_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "api_tokens_tokenDigest_key" ON api_tokens(token_digest);
CREATE INDEX IF NOT EXISTS "api_tokens_tokenDigest_idx" ON api_tokens(token_digest);
