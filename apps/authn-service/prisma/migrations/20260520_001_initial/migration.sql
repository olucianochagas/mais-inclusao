-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "authn";

-- CreateEnum
CREATE TYPE "authn"."RevokeReason" AS ENUM ('logout', 'user_deactivated', 'tenant_deactivated', 'reused', 'token_theft_replay');

-- CreateTable
CREATE TABLE "authn"."RefreshToken" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),
    "rotated_to" UUID,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" "authn"."RevokeReason",

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authn"."OutboxEvent" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "event_type" VARCHAR(80) NOT NULL,
    "event_version" VARCHAR(10) NOT NULL,
    "tenant_id" UUID NOT NULL,
    "correlation_id" UUID NOT NULL,
    "causation_id" UUID,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatched_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "authn"."RefreshToken"("token_hash");

-- CreateIndex
CREATE INDEX "RefreshToken_family_id_idx" ON "authn"."RefreshToken"("family_id");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_expires_at_idx" ON "authn"."RefreshToken"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "RefreshToken_tenant_id_idx" ON "authn"."RefreshToken"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_event_id_key" ON "authn"."OutboxEvent"("event_id");

-- CreateIndex
CREATE INDEX "OutboxEvent_dispatched_at_created_at_idx" ON "authn"."OutboxEvent"("dispatched_at", "created_at");

-- CreateIndex
CREATE INDEX "OutboxEvent_tenant_id_idx" ON "authn"."OutboxEvent"("tenant_id");

