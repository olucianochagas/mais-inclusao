warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateEnum
CREATE TYPE "auth"."Plan" AS ENUM ('free', 'starter', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "auth"."TenantStatus" AS ENUM ('active', 'deactivated');

-- CreateEnum
CREATE TYPE "auth"."DeactivationReason" AS ENUM ('contract_ended', 'data_breach', 'unpaid', 'manual');

-- CreateEnum
CREATE TYPE "auth"."UserStatus" AS ENUM ('active', 'deactivated');

-- CreateEnum
CREATE TYPE "auth"."UserDeactivationReason" AS ENUM ('voluntary', 'role_revoked', 'security_incident', 'data_breach');

-- CreateEnum
CREATE TYPE "auth"."RevokeReason" AS ENUM ('logout', 'user_deactivated', 'reused', 'token_theft_replay');

-- CreateTable
CREATE TABLE "auth"."Tenant" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "plan" "auth"."Plan" NOT NULL DEFAULT 'starter',
    "status" "auth"."TenantStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deactivated_at" TIMESTAMP(3),
    "deactivation_reason" "auth"."DeactivationReason",

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."User" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email_encrypted" BYTEA NOT NULL,
    "email_hash" CHAR(64) NOT NULL,
    "email_kms_kid" VARCHAR(128) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" "auth"."UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deactivated_at" TIMESTAMP(3),
    "deactivation_reason" "auth"."UserDeactivationReason",
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Role" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(32) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "description" VARCHAR(256),
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Permission" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "description" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."RolePermission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "auth"."UserRole" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "auth"."RefreshToken" (
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
    "revoked_reason" "auth"."RevokeReason",

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."OutboxEvent" (
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
CREATE UNIQUE INDEX "Tenant_slug_key" ON "auth"."Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "auth"."Tenant"("status");

-- CreateIndex
CREATE INDEX "User_tenant_id_status_idx" ON "auth"."User"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenant_id_email_hash_key" ON "auth"."User"("tenant_id", "email_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "auth"."Role"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_slug_key" ON "auth"."Permission"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "auth"."RefreshToken"("token_hash");

-- CreateIndex
CREATE INDEX "RefreshToken_family_id_idx" ON "auth"."RefreshToken"("family_id");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_expires_at_idx" ON "auth"."RefreshToken"("user_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_event_id_key" ON "auth"."OutboxEvent"("event_id");

-- CreateIndex
CREATE INDEX "OutboxEvent_dispatched_at_created_at_idx" ON "auth"."OutboxEvent"("dispatched_at", "created_at");

-- CreateIndex
CREATE INDEX "OutboxEvent_tenant_id_idx" ON "auth"."OutboxEvent"("tenant_id");

-- AddForeignKey
ALTER TABLE "auth"."User" ADD CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."UserRole" ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."RefreshToken" ADD CONSTRAINT "RefreshToken_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

