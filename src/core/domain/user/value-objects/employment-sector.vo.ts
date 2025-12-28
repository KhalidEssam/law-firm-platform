export enum EmploymentSector {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SELF_EMPLOYED = 'self_employed',
  RETIRED = 'retired',
  STUDENT = 'student',
  UNEMPLOYED = 'unemployed',
  OTHER = 'other',
}

export class UserEmploymentSector {
  private constructor(private readonly value: EmploymentSector) {}

  static create(value: string): UserEmploymentSector {
    if (!Object.values(EmploymentSector).includes(value as EmploymentSector)) {
      throw new Error('Invalid employment sector');
    }
    return new UserEmploymentSector(value as EmploymentSector);
  }

  getValue(): string {
    return this.value;
  }
}
