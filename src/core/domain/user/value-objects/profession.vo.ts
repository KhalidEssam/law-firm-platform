export class Profession {
  private constructor(private readonly value: string) {}

  static create(value: string): Profession {
    if (!value || value.trim().length < 2) {
      throw new Error('Profession must be at least 2 characters');
    }
    return new Profession(value.trim());
  }

  getValue(): string {
    return this.value;
  }
}
