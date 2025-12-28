export class UserPhoto {
  private constructor(private readonly url: string) {}

  static create(url: string): UserPhoto {
    if (!url || !this.isValidUrl(url)) {
      throw new Error('Invalid photo URL');
    }
    return new UserPhoto(url);
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(): string {
    return this.url;
  }
}
