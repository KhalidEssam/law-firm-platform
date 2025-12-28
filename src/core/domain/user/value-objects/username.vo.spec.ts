import { Username } from './username.vo';

describe('Username Value Object', () => {
  describe('create', () => {
    it('should create a valid username with 3 characters', () => {
      const username = Username.create('abc');
      expect(username.getValue()).toBe('abc');
    });

    it('should create a valid username with more than 3 characters', () => {
      const username = Username.create('john_doe');
      expect(username.getValue()).toBe('john_doe');
    });

    it('should create username with numbers', () => {
      const username = Username.create('user123');
      expect(username.getValue()).toBe('user123');
    });

    it('should create username with special characters', () => {
      const username = Username.create('user-name_123');
      expect(username.getValue()).toBe('user-name_123');
    });

    it('should throw error for empty username', () => {
      expect(() => Username.create('')).toThrow(
        'Username must be at least 3 characters',
      );
    });

    it('should throw error for null username', () => {
      expect(() => Username.create(null as any)).toThrow(
        'Username must be at least 3 characters',
      );
    });

    it('should throw error for undefined username', () => {
      expect(() => Username.create(undefined as any)).toThrow(
        'Username must be at least 3 characters',
      );
    });

    it('should throw error for username with 1 character', () => {
      expect(() => Username.create('a')).toThrow(
        'Username must be at least 3 characters',
      );
    });

    it('should throw error for username with 2 characters', () => {
      expect(() => Username.create('ab')).toThrow(
        'Username must be at least 3 characters',
      );
    });
  });

  describe('getValue', () => {
    it('should return the original username value', () => {
      const usernameValue = 'testuser';
      const username = Username.create(usernameValue);
      expect(username.getValue()).toBe(usernameValue);
    });
  });
});
