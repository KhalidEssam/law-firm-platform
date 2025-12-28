export class City {
  private constructor(private readonly value: string) {}

  public static create(city: string): City {
    if (!city || city.length < 2) {
      throw new Error('City name too short');
    }
    return new City(city);
  }

  public getValue(): string {
    return this.value;
  }
}
