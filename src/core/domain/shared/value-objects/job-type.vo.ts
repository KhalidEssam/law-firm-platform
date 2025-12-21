// ============================================
// JOB TYPE VALUE OBJECT
// src/core/domain/shared/value-objects/job-type.vo.ts
// ============================================

/**
 * JobType enum matching Prisma schema
 * Represents types of background jobs in the system
 */
export enum JobTypeEnum {
    EMAIL = 'email',
    SMS = 'sms',
    NOTIFICATION = 'notification',
    REPORT_GENERATION = 'report_generation',
    DATA_EXPORT = 'data_export',
}

/**
 * JobType Value Object
 * Represents the type of a background job
 */
export class JobType {
    private static readonly validTypes = Object.values(JobTypeEnum);

    private constructor(private readonly value: JobTypeEnum) {}

    static create(value: string): JobType {
        const normalizedValue = value.toLowerCase() as JobTypeEnum;
        if (!JobType.validTypes.includes(normalizedValue)) {
            throw new Error(
                `Invalid job type: ${value}. Must be one of: ${JobType.validTypes.join(', ')}`
            );
        }
        return new JobType(normalizedValue);
    }

    static email(): JobType {
        return new JobType(JobTypeEnum.EMAIL);
    }

    static sms(): JobType {
        return new JobType(JobTypeEnum.SMS);
    }

    static notification(): JobType {
        return new JobType(JobTypeEnum.NOTIFICATION);
    }

    static reportGeneration(): JobType {
        return new JobType(JobTypeEnum.REPORT_GENERATION);
    }

    static dataExport(): JobType {
        return new JobType(JobTypeEnum.DATA_EXPORT);
    }

    getValue(): JobTypeEnum {
        return this.value;
    }

    // Type checks
    isEmail(): boolean {
        return this.value === JobTypeEnum.EMAIL;
    }

    isSms(): boolean {
        return this.value === JobTypeEnum.SMS;
    }

    isNotification(): boolean {
        return this.value === JobTypeEnum.NOTIFICATION;
    }

    isReportGeneration(): boolean {
        return this.value === JobTypeEnum.REPORT_GENERATION;
    }

    isDataExport(): boolean {
        return this.value === JobTypeEnum.DATA_EXPORT;
    }

    // Business rule methods
    isCommunication(): boolean {
        return [
            JobTypeEnum.EMAIL,
            JobTypeEnum.SMS,
            JobTypeEnum.NOTIFICATION,
        ].includes(this.value);
    }

    isDataProcessing(): boolean {
        return [
            JobTypeEnum.REPORT_GENERATION,
            JobTypeEnum.DATA_EXPORT,
        ].includes(this.value);
    }

    /**
     * Get default priority for this job type
     * Higher number = higher priority
     */
    getDefaultPriority(): number {
        const priorityMap: Record<JobTypeEnum, number> = {
            [JobTypeEnum.SMS]: 10,              // Highest - time sensitive
            [JobTypeEnum.NOTIFICATION]: 8,
            [JobTypeEnum.EMAIL]: 5,
            [JobTypeEnum.DATA_EXPORT]: 3,
            [JobTypeEnum.REPORT_GENERATION]: 1, // Lowest - can be deferred
        };
        return priorityMap[this.value];
    }

    /**
     * Get default max retry attempts for this job type
     */
    getDefaultMaxRetries(): number {
        const retryMap: Record<JobTypeEnum, number> = {
            [JobTypeEnum.EMAIL]: 5,
            [JobTypeEnum.SMS]: 3,
            [JobTypeEnum.NOTIFICATION]: 3,
            [JobTypeEnum.REPORT_GENERATION]: 2,
            [JobTypeEnum.DATA_EXPORT]: 2,
        };
        return retryMap[this.value];
    }

    equals(other: JobType): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}

/**
 * Check if a string is a valid job type
 */
export function isValidJobType(value: string): value is JobTypeEnum {
    return Object.values(JobTypeEnum).includes(value as JobTypeEnum);
}

/**
 * Map Prisma enum to domain JobType
 */
export function mapJobTypeFromPrisma(prismaType: string): JobType {
    if (isValidJobType(prismaType)) {
        return JobType.create(prismaType);
    }
    return JobType.notification();
}

/**
 * Map domain JobType to Prisma enum value
 */
export function mapJobTypeToPrisma(type: JobType): string {
    return type.getValue();
}
