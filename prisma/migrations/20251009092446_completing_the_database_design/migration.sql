/*
  Warnings:

  - You are about to drop the column `processedAt` on the `JobQueue` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `MembershipInvoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,channel,eventType]` on the table `NotificationPreference` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `level` to the `ErrorLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `JobQueue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Membership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountAmount` to the `MembershipCouponRedemption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceNumber` to the `MembershipInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MembershipInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MembershipPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MembershipTier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventType` to the `NotificationPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `NotificationPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SystemConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `TransactionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MembershipChangeLog" DROP CONSTRAINT "MembershipChangeLog_membershipId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MembershipCouponRedemption" DROP CONSTRAINT "MembershipCouponRedemption_membershipId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NotificationPreference" DROP CONSTRAINT "NotificationPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentMethod" DROP CONSTRAINT "PaymentMethod_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TransactionLog" DROP CONSTRAINT "TransactionLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserPhoneNumber" DROP CONSTRAINT "UserPhoneNumber_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropIndex
DROP INDEX "public"."NotificationPreference_userId_channel_key";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "ErrorLog" ADD COLUMN     "level" TEXT NOT NULL,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "JobQueue" DROP COLUMN "processedAt",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "error" TEXT,
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "MembershipChangeLog" ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "MembershipCoupon" ADD COLUMN     "currentRedemptions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "MembershipCouponRedemption" ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "MembershipInvoice" ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'SAR';

-- AlterTable
ALTER TABLE "MembershipPayment" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SAR',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "MembershipTier" ADD COLUMN     "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "callMinutesPerMonth" INTEGER,
ADD COLUMN     "casesPerMonth" INTEGER,
ADD COLUMN     "consultationsPerMonth" INTEGER,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SAR',
ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "opinionsPerMonth" INTEGER,
ADD COLUMN     "servicesPerMonth" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "messageAr" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "relatedEntityId" TEXT,
ADD COLUMN     "relatedEntityType" TEXT,
ADD COLUMN     "titleAr" TEXT;

-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "eventType" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TransactionLog" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "status" TEXT NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'SAR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserActivity" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "page" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "UserPhoneNumber" ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'home',
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipQuotaUsage" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "consultationsUsed" INTEGER NOT NULL DEFAULT 0,
    "opinionsUsed" INTEGER NOT NULL DEFAULT 0,
    "servicesUsed" INTEGER NOT NULL DEFAULT 0,
    "casesUsed" INTEGER NOT NULL DEFAULT 0,
    "callMinutesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipQuotaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "organizationNameAr" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "taxNumber" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "workingDays" JSONB,
    "workingHours" JSONB,
    "businessEmail" TEXT,
    "businessPhone" TEXT,
    "website" TEXT,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderUser" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "specializations" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canAcceptRequests" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderService" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pricing" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSchedule" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalOpinionRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "assignedProviderId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "caseDetails" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "quoteAmount" DOUBLE PRECISION,
    "quoteCurrency" TEXT DEFAULT 'SAR',
    "quoteValidUntil" TIMESTAMP(3),
    "quoteAcceptedAt" TIMESTAMP(3),
    "opinionDocument" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "disputedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "disputeResolution" TEXT,
    "paymentStatus" TEXT DEFAULT 'pending',
    "paymentReference" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LegalOpinionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "assignedProviderId" TEXT,
    "serviceType" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "requirements" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceQuote" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "breakdown" JSONB,
    "description" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LitigationCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "assignedProviderId" TEXT,
    "caseType" TEXT NOT NULL,
    "caseSubtype" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "courtName" TEXT,
    "caseDetails" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "quoteAmount" DOUBLE PRECISION,
    "quoteCurrency" TEXT DEFAULT 'SAR',
    "quoteDetails" JSONB,
    "quoteValidUntil" TIMESTAMP(3),
    "quoteAcceptedAt" TIMESTAMP(3),
    "paymentStatus" TEXT DEFAULT 'pending',
    "paymentReference" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LitigationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseHearing" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "hearingDate" TIMESTAMP(3) NOT NULL,
    "hearingType" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "outcome" TEXT,
    "nextHearingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseHearing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "assignedProviderId" TEXT,
    "consultationType" TEXT,
    "purpose" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3),
    "scheduledDuration" INTEGER,
    "actualDuration" INTEGER,
    "callStartedAt" TIMESTAMP(3),
    "callEndedAt" TIMESTAMP(3),
    "recordingUrl" TEXT,
    "callPlatform" TEXT,
    "callLink" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CallRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "consultationId" TEXT,
    "legalOpinionId" TEXT,
    "serviceRequestId" TEXT,
    "litigationCaseId" TEXT,
    "supportTicketId" TEXT,
    "description" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "consultationId" TEXT,
    "legalOpinionId" TEXT,
    "serviceRequestId" TEXT,
    "litigationCaseId" TEXT,
    "callRequestId" TEXT,
    "supportTicketId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RequestMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestComment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "consultationId" TEXT,
    "legalOpinionId" TEXT,
    "serviceRequestId" TEXT,
    "litigationCaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RequestComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestStatusHistory" (
    "id" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT,
    "consultationId" TEXT,
    "legalOpinionId" TEXT,
    "serviceRequestId" TEXT,
    "litigationCaseId" TEXT,
    "callRequestId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestCollaborator" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "consultationId" TEXT,
    "legalOpinionId" TEXT,
    "serviceRequestId" TEXT,
    "litigationCaseId" TEXT,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "RequestCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "assignedProviderId" TEXT,
    "consultationType" TEXT NOT NULL,
    "category" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "slaDeadline" TIMESTAMP(3),
    "slaStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestRating" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "consultationId" TEXT,
    "legalOpinionId" TEXT,
    "serviceRequestId" TEXT,
    "litigationCaseId" TEXT,
    "callRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SLAPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "responseTime" INTEGER NOT NULL,
    "resolutionTime" INTEGER NOT NULL,
    "escalationTime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SLAPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "conditions" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "routingStrategy" TEXT NOT NULL,
    "targetProviders" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetCriteria" JSONB,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "currentRedemptions" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "parameters" JSONB,
    "generatedBy" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsMetric" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dimensions" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "exportFileUrl" TEXT,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "consentType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "parentId" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionAr" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answerAr" TEXT NOT NULL,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMessage" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "message" TEXT NOT NULL,
    "messageAr" TEXT,
    "severity" TEXT NOT NULL,
    "targetUsers" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAddress_userId_isPrimary_idx" ON "UserAddress"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "MembershipQuotaUsage_membershipId_periodStart_idx" ON "MembershipQuotaUsage"("membershipId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipQuotaUsage_membershipId_periodStart_key" ON "MembershipQuotaUsage"("membershipId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_userId_key" ON "ProviderProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_licenseNumber_key" ON "ProviderProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "ProviderProfile_verificationStatus_idx" ON "ProviderProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "ProviderUser_providerId_isActive_idx" ON "ProviderUser"("providerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderUser_providerId_userId_key" ON "ProviderUser"("providerId", "userId");

-- CreateIndex
CREATE INDEX "ProviderService_providerId_serviceType_idx" ON "ProviderService"("providerId", "serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSchedule_providerId_dayOfWeek_key" ON "ProviderSchedule"("providerId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "LegalOpinionRequest_requestNumber_key" ON "LegalOpinionRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "LegalOpinionRequest_subscriberId_status_idx" ON "LegalOpinionRequest"("subscriberId", "status");

-- CreateIndex
CREATE INDEX "LegalOpinionRequest_assignedProviderId_status_idx" ON "LegalOpinionRequest"("assignedProviderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_requestNumber_key" ON "ServiceRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "ServiceRequest_subscriberId_status_idx" ON "ServiceRequest"("subscriberId", "status");

-- CreateIndex
CREATE INDEX "ServiceRequest_assignedProviderId_status_idx" ON "ServiceRequest"("assignedProviderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceQuote_serviceRequestId_key" ON "ServiceQuote"("serviceRequestId");

-- CreateIndex
CREATE INDEX "ServiceQuote_serviceRequestId_idx" ON "ServiceQuote"("serviceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "LitigationCase_caseNumber_key" ON "LitigationCase"("caseNumber");

-- CreateIndex
CREATE INDEX "LitigationCase_subscriberId_status_idx" ON "LitigationCase"("subscriberId", "status");

-- CreateIndex
CREATE INDEX "LitigationCase_assignedProviderId_status_idx" ON "LitigationCase"("assignedProviderId", "status");

-- CreateIndex
CREATE INDEX "CaseHearing_caseId_hearingDate_idx" ON "CaseHearing"("caseId", "hearingDate");

-- CreateIndex
CREATE UNIQUE INDEX "CallRequest_requestNumber_key" ON "CallRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "CallRequest_subscriberId_status_idx" ON "CallRequest"("subscriberId", "status");

-- CreateIndex
CREATE INDEX "CallRequest_assignedProviderId_scheduledAt_idx" ON "CallRequest"("assignedProviderId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Document_uploadedBy_idx" ON "Document"("uploadedBy");

-- CreateIndex
CREATE INDEX "Document_consultationId_idx" ON "Document"("consultationId");

-- CreateIndex
CREATE INDEX "Document_legalOpinionId_idx" ON "Document"("legalOpinionId");

-- CreateIndex
CREATE INDEX "Document_serviceRequestId_idx" ON "Document"("serviceRequestId");

-- CreateIndex
CREATE INDEX "Document_litigationCaseId_idx" ON "Document"("litigationCaseId");

-- CreateIndex
CREATE INDEX "RequestMessage_consultationId_sentAt_idx" ON "RequestMessage"("consultationId", "sentAt");

-- CreateIndex
CREATE INDEX "RequestMessage_legalOpinionId_sentAt_idx" ON "RequestMessage"("legalOpinionId", "sentAt");

-- CreateIndex
CREATE INDEX "RequestMessage_serviceRequestId_sentAt_idx" ON "RequestMessage"("serviceRequestId", "sentAt");

-- CreateIndex
CREATE INDEX "RequestMessage_litigationCaseId_sentAt_idx" ON "RequestMessage"("litigationCaseId", "sentAt");

-- CreateIndex
CREATE INDEX "RequestMessage_callRequestId_sentAt_idx" ON "RequestMessage"("callRequestId", "sentAt");

-- CreateIndex
CREATE INDEX "RequestComment_consultationId_idx" ON "RequestComment"("consultationId");

-- CreateIndex
CREATE INDEX "RequestComment_legalOpinionId_idx" ON "RequestComment"("legalOpinionId");

-- CreateIndex
CREATE INDEX "RequestComment_serviceRequestId_idx" ON "RequestComment"("serviceRequestId");

-- CreateIndex
CREATE INDEX "RequestComment_litigationCaseId_idx" ON "RequestComment"("litigationCaseId");

-- CreateIndex
CREATE INDEX "RequestStatusHistory_consultationId_changedAt_idx" ON "RequestStatusHistory"("consultationId", "changedAt");

-- CreateIndex
CREATE INDEX "RequestStatusHistory_legalOpinionId_changedAt_idx" ON "RequestStatusHistory"("legalOpinionId", "changedAt");

-- CreateIndex
CREATE INDEX "RequestStatusHistory_serviceRequestId_changedAt_idx" ON "RequestStatusHistory"("serviceRequestId", "changedAt");

-- CreateIndex
CREATE INDEX "RequestStatusHistory_litigationCaseId_changedAt_idx" ON "RequestStatusHistory"("litigationCaseId", "changedAt");

-- CreateIndex
CREATE INDEX "RequestCollaborator_providerUserId_idx" ON "RequestCollaborator"("providerUserId");

-- CreateIndex
CREATE INDEX "RequestCollaborator_consultationId_idx" ON "RequestCollaborator"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationRequest_requestNumber_key" ON "ConsultationRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "ConsultationRequest_subscriberId_status_idx" ON "ConsultationRequest"("subscriberId", "status");

-- CreateIndex
CREATE INDEX "ConsultationRequest_assignedProviderId_status_idx" ON "ConsultationRequest"("assignedProviderId", "status");

-- CreateIndex
CREATE INDEX "ConsultationRequest_status_slaDeadline_idx" ON "ConsultationRequest"("status", "slaDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "RequestRating_consultationId_key" ON "RequestRating"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestRating_legalOpinionId_key" ON "RequestRating"("legalOpinionId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestRating_serviceRequestId_key" ON "RequestRating"("serviceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestRating_litigationCaseId_key" ON "RequestRating"("litigationCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestRating_callRequestId_key" ON "RequestRating"("callRequestId");

-- CreateIndex
CREATE INDEX "RequestRating_subscriberId_idx" ON "RequestRating"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_subscriberId_status_idx" ON "SupportTicket"("subscriberId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "SLAPolicy_name_key" ON "SLAPolicy"("name");

-- CreateIndex
CREATE INDEX "SLAPolicy_requestType_priority_idx" ON "SLAPolicy"("requestType", "priority");

-- CreateIndex
CREATE INDEX "RoutingRule_requestType_isActive_idx" ON "RoutingRule"("requestType", "isActive");

-- CreateIndex
CREATE INDEX "DiscountCampaign_isActive_validFrom_validUntil_idx" ON "DiscountCampaign"("isActive", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "Report_reportType_generatedAt_idx" ON "Report"("reportType", "generatedAt");

-- CreateIndex
CREATE INDEX "AnalyticsMetric_metricName_timestamp_idx" ON "AnalyticsMetric"("metricName", "timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsMetric_timestamp_idx" ON "AnalyticsMetric"("timestamp");

-- CreateIndex
CREATE INDEX "DataExportRequest_userId_status_idx" ON "DataExportRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "ConsentLog_userId_consentType_idx" ON "ConsentLog"("userId", "consentType");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_provider_key" ON "IntegrationConfig"("provider");

-- CreateIndex
CREATE INDEX "WebhookLog_provider_event_createdAt_idx" ON "WebhookLog"("provider", "event", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegalCategory_name_key" ON "LegalCategory"("name");

-- CreateIndex
CREATE INDEX "LegalCategory_parentId_idx" ON "LegalCategory"("parentId");

-- CreateIndex
CREATE INDEX "LegalCategory_isActive_sortOrder_idx" ON "LegalCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "FAQ_category_isActive_idx" ON "FAQ"("category", "isActive");

-- CreateIndex
CREATE INDEX "SystemMessage_isActive_startDate_endDate_idx" ON "SystemMessage"("isActive", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ErrorLog_level_createdAt_idx" ON "ErrorLog"("level", "createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "JobQueue_status_scheduledAt_idx" ON "JobQueue"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "JobQueue_type_status_idx" ON "JobQueue"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipInvoice_invoiceNumber_key" ON "MembershipInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "MembershipInvoice_status_dueDate_idx" ON "MembershipInvoice"("status", "dueDate");

-- CreateIndex
CREATE INDEX "MembershipPayment_providerTxnId_idx" ON "MembershipPayment"("providerTxnId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_channel_eventType_key" ON "NotificationPreference"("userId", "channel", "eventType");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "SystemConfig_category_idx" ON "SystemConfig"("category");

-- CreateIndex
CREATE INDEX "TransactionLog_type_status_idx" ON "TransactionLog"("type", "status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_auth0Id_idx" ON "User"("auth0Id");

-- CreateIndex
CREATE INDEX "UserActivity_action_createdAt_idx" ON "UserActivity"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "UserPhoneNumber" ADD CONSTRAINT "UserPhoneNumber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipChangeLog" ADD CONSTRAINT "MembershipChangeLog_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipQuotaUsage" ADD CONSTRAINT "MembershipQuotaUsage_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipCouponRedemption" ADD CONSTRAINT "MembershipCouponRedemption_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLog" ADD CONSTRAINT "TransactionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUser" ADD CONSTRAINT "ProviderUser_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUser" ADD CONSTRAINT "ProviderUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSchedule" ADD CONSTRAINT "ProviderSchedule_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalOpinionRequest" ADD CONSTRAINT "LegalOpinionRequest_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalOpinionRequest" ADD CONSTRAINT "LegalOpinionRequest_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceQuote" ADD CONSTRAINT "ServiceQuote_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceQuote" ADD CONSTRAINT "ServiceQuote_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitigationCase" ADD CONSTRAINT "LitigationCase_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LitigationCase" ADD CONSTRAINT "LitigationCase_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseHearing" ADD CONSTRAINT "CaseHearing_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "LitigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRequest" ADD CONSTRAINT "CallRequest_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRequest" ADD CONSTRAINT "CallRequest_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "ConsultationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_legalOpinionId_fkey" FOREIGN KEY ("legalOpinionId") REFERENCES "LegalOpinionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_litigationCaseId_fkey" FOREIGN KEY ("litigationCaseId") REFERENCES "LitigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_supportTicketId_fkey" FOREIGN KEY ("supportTicketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMessage" ADD CONSTRAINT "RequestMessage_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "ConsultationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMessage" ADD CONSTRAINT "RequestMessage_legalOpinionId_fkey" FOREIGN KEY ("legalOpinionId") REFERENCES "LegalOpinionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMessage" ADD CONSTRAINT "RequestMessage_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMessage" ADD CONSTRAINT "RequestMessage_litigationCaseId_fkey" FOREIGN KEY ("litigationCaseId") REFERENCES "LitigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMessage" ADD CONSTRAINT "RequestMessage_callRequestId_fkey" FOREIGN KEY ("callRequestId") REFERENCES "CallRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMessage" ADD CONSTRAINT "RequestMessage_supportTicketId_fkey" FOREIGN KEY ("supportTicketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "ConsultationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_legalOpinionId_fkey" FOREIGN KEY ("legalOpinionId") REFERENCES "LegalOpinionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_litigationCaseId_fkey" FOREIGN KEY ("litigationCaseId") REFERENCES "LitigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_callRequestId_fkey" FOREIGN KEY ("callRequestId") REFERENCES "CallRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestCollaborator" ADD CONSTRAINT "RequestCollaborator_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "ProviderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestCollaborator" ADD CONSTRAINT "RequestCollaborator_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "ConsultationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRequest" ADD CONSTRAINT "ConsultationRequest_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRequest" ADD CONSTRAINT "ConsultationRequest_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRating" ADD CONSTRAINT "RequestRating_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRating" ADD CONSTRAINT "RequestRating_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "ConsultationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRating" ADD CONSTRAINT "RequestRating_legalOpinionId_fkey" FOREIGN KEY ("legalOpinionId") REFERENCES "LegalOpinionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRating" ADD CONSTRAINT "RequestRating_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRating" ADD CONSTRAINT "RequestRating_litigationCaseId_fkey" FOREIGN KEY ("litigationCaseId") REFERENCES "LitigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRating" ADD CONSTRAINT "RequestRating_callRequestId_fkey" FOREIGN KEY ("callRequestId") REFERENCES "CallRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalCategory" ADD CONSTRAINT "LegalCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LegalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
