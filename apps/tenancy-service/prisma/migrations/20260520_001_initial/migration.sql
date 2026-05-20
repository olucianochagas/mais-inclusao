Scope: all 10 workspace projects
Progress: resolved 1, reused 0, downloaded 0, added 0
Progress: resolved 31, reused 30, downloaded 0, added 0
Progress: resolved 36, reused 36, downloaded 0, added 0

   ╭──────────────────────────────────────────────╮
   │                                              │
   │      Update available! 11.1.2 → 11.1.3.      │
   │     Changelog: https://pnpm.io/v/11.1.3      │
   │   To update, run: corepack use pnpm@11.1.3   │
   │                                              │
   ╰──────────────────────────────────────────────╯

Progress: resolved 37, reused 36, downloaded 0, added 0
Progress: resolved 46, reused 46, downloaded 0, added 0
packages/messaging                       | [WARN] deprecated nats@2.29.3
Progress: resolved 50, reused 50, downloaded 0, added 0
[WARN] Request took 13152ms: https://registry.npmjs.org/@types%2Fnode
[WARN] Request took 16253ms: https://registry.npmjs.org/prisma
[WARN] Request took 16943ms: https://registry.npmjs.org/@prisma%2Fclient
Progress: resolved 51, reused 50, downloaded 0, added 0
Progress: resolved 51, reused 51, downloaded 0, added 0
Progress: resolved 52, reused 51, downloaded 0, added 0
Progress: resolved 53, reused 52, downloaded 0, added 0
Progress: resolved 115, reused 71, downloaded 0, added 0
Progress: resolved 309, reused 275, downloaded 0, added 0
Progress: resolved 441, reused 426, downloaded 0, added 0
Progress: resolved 529, reused 482, downloaded 0, added 0
Progress: resolved 715, reused 604, downloaded 0, added 0
Progress: resolved 742, reused 629, downloaded 0, added 0
Progress: resolved 780, reused 670, downloaded 0, added 0
Progress: resolved 784, reused 674, downloaded 0, added 0
Progress: resolved 807, reused 691, downloaded 0, added 0
Progress: resolved 896, reused 784, downloaded 0, added 0
Progress: resolved 959, reused 844, downloaded 0, added 0
Progress: resolved 1091, reused 981, downloaded 0, added 0
[WARN] 4 deprecated subdependencies found: git-raw-commits@4.0.0, glob@10.5.0, node-domexception@1.0.0, uuid@10.0.0
Packages: +270
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 1092, reused 982, downloaded 0, added 0, done
. prepare$ husky
. prepare: Done
[WARN] Issues with peer dependencies found. Run "pnpm peers check" to list them.

Done in 40.5s using pnpm v11.1.2
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenancy";

-- CreateEnum
CREATE TYPE "tenancy"."Plan" AS ENUM ('free', 'starter', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "tenancy"."TenantStatus" AS ENUM ('active', 'deactivated');

-- CreateEnum
CREATE TYPE "tenancy"."DeactivationReason" AS ENUM ('contract_ended', 'data_breach', 'unpaid', 'manual');

-- CreateEnum
CREATE TYPE "tenancy"."UserStatus" AS ENUM ('active', 'deactivated');

-- CreateEnum
CREATE TYPE "tenancy"."UserDeactivationReason" AS ENUM ('voluntary', 'role_revoked', 'security_incident', 'data_breach');

-- CreateTable
CREATE TABLE "tenancy"."Tenant" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "plan" "tenancy"."Plan" NOT NULL DEFAULT 'starter',
    "status" "tenancy"."TenantStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deactivated_at" TIMESTAMP(3),
    "deactivation_reason" "tenancy"."DeactivationReason",

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenancy"."User" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email_encrypted" BYTEA NOT NULL,
    "email_hash" CHAR(64) NOT NULL,
    "email_kms_kid" VARCHAR(128) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" "tenancy"."UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deactivated_at" TIMESTAMP(3),
    "deactivation_reason" "tenancy"."UserDeactivationReason",
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenancy"."OutboxEvent" (
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
CREATE UNIQUE INDEX "Tenant_slug_key" ON "tenancy"."Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "tenancy"."Tenant"("status");

-- CreateIndex
CREATE INDEX "User_tenant_id_status_idx" ON "tenancy"."User"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenant_id_email_hash_key" ON "tenancy"."User"("tenant_id", "email_hash");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_event_id_key" ON "tenancy"."OutboxEvent"("event_id");

-- CreateIndex
CREATE INDEX "OutboxEvent_dispatched_at_created_at_idx" ON "tenancy"."OutboxEvent"("dispatched_at", "created_at");

-- CreateIndex
CREATE INDEX "OutboxEvent_tenant_id_idx" ON "tenancy"."OutboxEvent"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenancy"."User" ADD CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenancy"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

