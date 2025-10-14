export enum AgeGroup {
    UNDER_18 = 'under_18',
    AGE_18_24 = '18-24',
    AGE_25_34 = '25-34',
    AGE_35_44 = '35-44',
    AGE_45_54 = '45-54',
    AGE_55_64 = '55-64',
    AGE_65_PLUS = '65+'
}

export class UserAgeGroup {
    private constructor(private readonly value: AgeGroup) { }

    static create(value: string): UserAgeGroup {
        if (!Object.values(AgeGroup).includes(value as AgeGroup)) {
            throw new Error('Invalid age group');
        }
        return new UserAgeGroup(value as AgeGroup);
    }

    getValue(): string {
        return this.value;
    }
}