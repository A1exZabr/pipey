-- CreateTable
CREATE TABLE "org_settings" (
    "id" TEXT NOT NULL,
    "scenario" TEXT,
    "company" JSONB NOT NULL DEFAULT '{}',
    "bank" JSONB NOT NULL DEFAULT '{}',
    "calendar" JSONB NOT NULL DEFAULT '{}',
    "ai" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "org_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_settings_orgId_key" ON "org_settings"("orgId");

-- AddForeignKey
ALTER TABLE "org_settings" ADD CONSTRAINT "org_settings_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
