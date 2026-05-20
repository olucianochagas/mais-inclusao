-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "authz";

-- CreateTable
CREATE TABLE "authz"."Role" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(32) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "description" VARCHAR(256),
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authz"."Permission" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "description" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authz"."RolePermission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "authz"."UserRole" (
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" VARCHAR(64),

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "authz"."OutboxEvent" (
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
CREATE UNIQUE INDEX "Role_slug_key" ON "authz"."Role"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_slug_key" ON "authz"."Permission"("slug");

-- CreateIndex
CREATE INDEX "UserRole_user_id_revoked_at_idx" ON "authz"."UserRole"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "UserRole_tenant_id_idx" ON "authz"."UserRole"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_event_id_key" ON "authz"."OutboxEvent"("event_id");

-- CreateIndex
CREATE INDEX "OutboxEvent_dispatched_at_created_at_idx" ON "authz"."OutboxEvent"("dispatched_at", "created_at");

-- CreateIndex
CREATE INDEX "OutboxEvent_tenant_id_idx" ON "authz"."OutboxEvent"("tenant_id");

-- AddForeignKey
ALTER TABLE "authz"."RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "authz"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authz"."RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "authz"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authz"."UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "authz"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

