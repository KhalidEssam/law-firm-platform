// ============================================
// HEARING TYPE VALUE OBJECT
// src/core/domain/shared/value-objects/hearing-type.vo.ts
// ============================================

/**
 * HearingType enum matching Prisma schema
 */
export enum HearingTypeEnum {
    INITIAL = 'initial',
    FOLLOW_UP = 'follow_up',
    VERDICT = 'verdict',
    APPEAL = 'appeal',
}

/**
 * HearingType Value Object
 * Represents the type of court hearing in a litigation case
 */
export class HearingType {
    private static readonly validTypes = Object.values(HearingTypeEnum);

    private constructor(private readonly value: HearingTypeEnum) {}

    static create(value: string): HearingType {
        const normalizedValue = value.toLowerCase() as HearingTypeEnum;
        if (!HearingType.validTypes.includes(normalizedValue)) {
            throw new Error(
                `Invalid hearing type: ${value}. Must be one of: ${HearingType.validTypes.join(', ')}`
            );
        }
        return new HearingType(normalizedValue);
    }

    static initial(): HearingType {
        return new HearingType(HearingTypeEnum.INITIAL);
    }

    static followUp(): HearingType {
        return new HearingType(HearingTypeEnum.FOLLOW_UP);
    }

    static verdict(): HearingType {
        return new HearingType(HearingTypeEnum.VERDICT);
    }

    static appeal(): HearingType {
        return new HearingType(HearingTypeEnum.APPEAL);
    }

    getValue(): HearingTypeEnum {
        return this.value;
    }

    // State query methods
    isInitial(): boolean {
        return this.value === HearingTypeEnum.INITIAL;
    }

    isFollowUp(): boolean {
        return this.value === HearingTypeEnum.FOLLOW_UP;
    }

    isVerdict(): boolean {
        return this.value === HearingTypeEnum.VERDICT;
    }

    isAppeal(): boolean {
        return this.value === HearingTypeEnum.APPEAL;
    }

    // Business rule methods
    isFinalHearing(): boolean {
        return [HearingTypeEnum.VERDICT, HearingTypeEnum.APPEAL].includes(this.value);
    }

    isPreparatoryHearing(): boolean {
        return [HearingTypeEnum.INITIAL, HearingTypeEnum.FOLLOW_UP].includes(this.value);
    }

    /**
     * Get typical order of hearing types in a case lifecycle
     */
    getOrder(): number {
        const orderMap: Record<HearingTypeEnum, number> = {
            [HearingTypeEnum.INITIAL]: 1,
            [HearingTypeEnum.FOLLOW_UP]: 2,
            [HearingTypeEnum.VERDICT]: 3,
            [HearingTypeEnum.APPEAL]: 4,
        };
        return orderMap[this.value];
    }

    equals(other: HearingType): boolean {
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
 * Check if a string is a valid hearing type
 */
export function isValidHearingType(value: string): value is HearingTypeEnum {
    return Object.values(HearingTypeEnum).includes(value as HearingTypeEnum);
}

/**
 * Map Prisma enum to domain HearingType
 */
export function mapHearingTypeFromPrisma(prismaType: string | null): HearingType | null {
    if (!prismaType) return null;
    if (isValidHearingType(prismaType)) {
        return HearingType.create(prismaType);
    }
    return null;
}

/**
 * Map domain HearingType to Prisma enum value
 */
export function mapHearingTypeToPrisma(type: HearingType | null): string | null {
    return type?.getValue() ?? null;
}
