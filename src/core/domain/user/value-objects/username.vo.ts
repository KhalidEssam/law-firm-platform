export class Username {
  private constructor(private readonly value: string) {}

  public static create(username: string): Username {
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    return new Username(username);
  }

  public getValue(): string {
    return this.value;
  }
}
