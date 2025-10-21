/*
  Warnings:

  - You are about to drop the column `callMinutesPerMonth` on the `MembershipTier` table. All the data in the column will be lost.
  - You are about to drop the column `casesPerMonth` on the `MembershipTier` table. All the data in the column will be lost.
  - You are about to drop the column `consultationsPerMonth` on the `MembershipTier` table. All the data in the column will be lost.
  - You are about to drop the column `opinionsPerMonth` on the `MembershipTier` table. All the data in the column will be lost.
  - You are about to drop the column `servicesPerMonth` on the `MembershipTier` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `ProviderService` table. All the data in the column will be lost.
  - You are about to drop the column `pricing` on the `ProviderService` table. All the data in the column will be lost.
  - You are about to drop the column `serviceType` on the `ProviderService` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerId,serviceId]` on the table `ProviderService` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serviceId` to the `ProviderService` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."ProviderService_providerId_serviceType_idx";

-- AlterTable
ALTER TABLE "MembershipTier" DROP COLUMN "callMinutesPerMonth",
DROP COLUMN "casesPerMonth",
DROP COLUMN "consultationsPerMonth",
DROP COLUMN "opinionsPerMonth",
DROP COLUMN "servicesPerMonth",
ADD COLUMN     "features" JSONB,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProviderService" DROP COLUMN "category",
DROP COLUMN "pricing",
DROP COLUMN "serviceType",
ADD COLUMN     "customPricing" JSONB,
ADD COLUMN     "maxPrice" DOUBLE PRECISION,
ADD COLUMN     "minPrice" DOUBLE PRECISION,
ADD COLUMN     "serviceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionLogId" TEXT,
    "paymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "refundReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consultationId" TEXT,
    "legalOpinionId" TEXT,
    "serviceRequestId" TEXT,
    "litigationCaseId" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "escalatedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderReview" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "professionalism" INTEGER,
    "communication" INTEGER,
    "expertise" INTEGER,
    "timeliness" INTEGER,
    "review" TEXT,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSpecialization" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "specializationId" TEXT NOT NULL,
    "experienceYears" INTEGER,
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "certifications" JSONB,
    "caseCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderSpecialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "variables" JSONB,
    "description" TEXT,
    "descriptionAr" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "category" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "estimatedDuration" INTEGER,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierService" (
    "id" TEXT NOT NULL,
    "tierId" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quotaPerMonth" INTEGER,
    "quotaPerYear" INTEGER,
    "rolloverUnused" BOOLEAN NOT NULL DEFAULT false,
    "discountPercent" DOUBLE PRECISION DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceUsage" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "consultationId" TEXT,
    "legalOpinionId" TEXT,
    "serviceRequestId" TEXT,
    "litigationCaseId" TEXT,
    "callRequestId" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "chargedAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "isBilled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ServiceUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "subjectAr" TEXT,
    "body" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Refund_userId_status_idx" ON "Refund"("userId", "status");

-- CreateIndex
CREATE INDEX "Refund_status_createdAt_idx" ON "Refund"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Dispute_userId_status_idx" ON "Dispute"("userId", "status");

-- CreateIndex
CREATE INDEX "Dispute_status_priority_idx" ON "Dispute"("status", "priority");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_providerId_date_isBooked_idx" ON "AvailabilitySlot"("providerId", "date", "isBooked");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_providerId_date_startTime_key" ON "AvailabilitySlot"("providerId", "date", "startTime");

-- CreateIndex
CREATE INDEX "ProviderReview_providerId_isPublic_idx" ON "ProviderReview"("providerId", "isPublic");

-- CreateIndex
CREATE INDEX "ProviderReview_providerId_rating_idx" ON "ProviderReview"("providerId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "Specialization_name_key" ON "Specialization"("name");

-- CreateIndex
CREATE INDEX "Specialization_category_isActive_idx" ON "Specialization"("category", "isActive");

-- CreateIndex
CREATE INDEX "ProviderSpecialization_providerId_idx" ON "ProviderSpecialization"("providerId");

-- CreateIndex
CREATE INDEX "ProviderSpecialization_specializationId_idx" ON "ProviderSpecialization"("specializationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSpecialization_providerId_specializationId_key" ON "ProviderSpecialization"("providerId", "specializationId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_category_isActive_idx" ON "DocumentTemplate"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE INDEX "Service_category_isActive_idx" ON "Service"("category", "isActive");

-- CreateIndex
CREATE INDEX "TierService_tierId_isActive_idx" ON "TierService"("tierId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TierService_tierId_serviceId_key" ON "TierService"("tierId", "serviceId");

-- CreateIndex
CREATE INDEX "ServiceUsage_membershipId_serviceId_periodStart_idx" ON "ServiceUsage"("membershipId", "serviceId", "periodStart");

-- CreateIndex
CREATE INDEX "ServiceUsage_membershipId_usedAt_idx" ON "ServiceUsage"("membershipId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_code_key" ON "MessageTemplate"("code");

-- CreateIndex
CREATE INDEX "MessageTemplate_code_channel_idx" ON "MessageTemplate"("code", "channel");

-- CreateIndex
CREATE INDEX "ProviderService_providerId_serviceId_isActive_idx" ON "ProviderService"("providerId", "serviceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderService_providerId_serviceId_key" ON "ProviderService"("providerId", "serviceId");

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSpecialization" ADD CONSTRAINT "ProviderSpecialization_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSpecialization" ADD CONSTRAINT "ProviderSpecialization_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "Specialization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierService" ADD CONSTRAINT "TierService_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "MembershipTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierService" ADD CONSTRAINT "TierService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceUsage" ADD CONSTRAINT "ServiceUsage_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceUsage" ADD CONSTRAINT "ServiceUsage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
