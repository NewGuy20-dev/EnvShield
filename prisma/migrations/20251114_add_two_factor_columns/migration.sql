-- Add 2FA fields to users table
ALTER TABLE "users"
  ADD COLUMN "two_factor_secret" TEXT,
  ADD COLUMN "two_factor_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "two_factor_backup_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "two_factor_recovery_code" TEXT,
  ADD COLUMN "two_factor_updated_at" TIMESTAMP;

-- Ensure existing users have two_factor_enabled set to false (default covers new records)
UPDATE "users" SET "two_factor_enabled" = FALSE WHERE "two_factor_enabled" IS NULL;
