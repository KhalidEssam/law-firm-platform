// ============================================
// GENDER VALUE OBJECT
// src/core/domain/shared/value-objects/gender.vo.ts
// ============================================

/**
 * Gender enum matching Prisma schema
 */
export enum GenderEnum {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
    PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

/**
 * Gender Value Object
 * Represents user's gender selection with privacy option
 */
export class Gender {
    private static readonly validGenders = Object.values(GenderEnum);

    private constructor(private readonly value: GenderEnum) {}

    static create(value: string): Gender {
        const normalizedValue = value.toLowerCase() as GenderEnum;
        if (!Gender.validGenders.includes(normalizedValue)) {
            throw new Error(
                `Invalid gender: ${value}. Must be one of: ${Gender.validGenders.join(', ')}`
            );
        }
        return new Gender(normalizedValue);
    }

    static male(): Gender {
        return new Gender(GenderEnum.MALE);
    }

    static female(): Gender {
        return new Gender(GenderEnum.FEMALE);
    }

    static other(): Gender {
        return new Gender(GenderEnum.OTHER);
    }

    static preferNotToSay(): Gender {
        return new Gender(GenderEnum.PREFER_NOT_TO_SAY);
    }

    getValue(): GenderEnum {
        return this.value;
    }

    isMale(): boolean {
        return this.value === GenderEnum.MALE;
    }

    isFemale(): boolean {
        return this.value === GenderEnum.FEMALE;
    }

    isOther(): boolean {
        return this.value === GenderEnum.OTHER;
    }

    isPreferNotToSay(): boolean {
        return this.value === GenderEnum.PREFER_NOT_TO_SAY;
    }

    equals(other: Gender): boolean {
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
 * Check if a string is a valid gender
 */
export function isValidGender(value: string): value is GenderEnum {
    return Object.values(GenderEnum).includes(value as GenderEnum);
}

/**
 * Map Prisma enum to domain Gender
 */
export function mapGenderFromPrisma(prismaGender: string | null): Gender | null {
    if (!prismaGender) return null;
    if (isValidGender(prismaGender)) {
        return Gender.create(prismaGender);
    }
    return null;
}

/**
 * Map domain Gender to Prisma enum value
 */
export function mapGenderToPrisma(gender: Gender | null): string | null {
    return gender?.getValue() ?? null;
}
