ALTER TABLE "api_tokens" ADD COLUMN "tokenDigest" TEXT;

CREATE UNIQUE INDEX "api_tokens_tokenDigest_key"
  ON "api_tokens"("tokenDigest")
  WHERE "tokenDigest" IS NOT NULL;
