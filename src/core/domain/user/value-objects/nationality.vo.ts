export class Nationality {
  private constructor(private readonly value: string) {}

  static create(value: string): Nationality {
    if (!value || value.trim().length < 2) {
      throw new Error('Nationality must be at least 2 characters');
    }
    // You could add a list of valid nationalities for more strict validation
    return new Nationality(value.trim());
  }

  getValue(): string {
    return this.value;
  }
}
