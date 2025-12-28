import { Email } from './email.vo';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should create email with subdomain', () => {
      const email = Email.create('user@mail.company.com');
      expect(email.getValue()).toBe('user@mail.company.com');
    });

    it('should create email with dots in local part', () => {
      const email = Email.create('first.last@example.com');
      expect(email.getValue()).toBe('first.last@example.com');
    });

    it('should create email with hyphen in domain', () => {
      const email = Email.create('user@my-company.com');
      expect(email.getValue()).toBe('user@my-company.com');
    });

    it('should create email with numbers', () => {
      const email = Email.create('user123@example123.com');
      expect(email.getValue()).toBe('user123@example123.com');
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow('Invalid email format');
    });

    it('should throw error for null email', () => {
      expect(() => Email.create(null as any)).toThrow('Invalid email format');
    });

    it('should throw error for undefined email', () => {
      expect(() => Email.create(undefined as any)).toThrow(
        'Invalid email format',
      );
    });

    it('should throw error for email without @', () => {
      expect(() => Email.create('testexample.com')).toThrow(
        'Invalid email format',
      );
    });

    it('should throw error for email without domain', () => {
      expect(() => Email.create('test@')).toThrow('Invalid email format');
    });

    it('should throw error for email without local part', () => {
      expect(() => Email.create('@example.com')).toThrow(
        'Invalid email format',
      );
    });

    it('should throw error for email with spaces', () => {
      expect(() => Email.create('test @example.com')).toThrow(
        'Invalid email format',
      );
    });

    it('should throw error for email with invalid TLD', () => {
      expect(() => Email.create('test@example.c')).toThrow(
        'Invalid email format',
      );
    });
  });

  describe('getValue', () => {
    it('should return the original email value', () => {
      const emailValue = 'original@email.com';
      const email = Email.create(emailValue);
      expect(email.getValue()).toBe(emailValue);
    });
  });
});
