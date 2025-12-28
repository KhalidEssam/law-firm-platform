import { Money, CurrencyEnum } from './money.vo';

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create money with valid amount and currency', () => {
      const money = Money.create({ amount: 100, currency: 'SAR' });
      expect(money.amount).toBe(100);
      expect(money.currency).toBe(CurrencyEnum.SAR);
    });

    it('should normalize currency to uppercase', () => {
      const money = Money.create({ amount: 50, currency: 'usd' });
      expect(money.currency).toBe(CurrencyEnum.USD);
    });

    it('should accept EUR currency', () => {
      const money = Money.create({ amount: 75, currency: 'EUR' });
      expect(money.currency).toBe(CurrencyEnum.EUR);
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.create({ amount: -10, currency: 'SAR' })).toThrow(
        'Amount cannot be negative',
      );
    });

    it('should throw error for invalid currency', () => {
      expect(() => Money.create({ amount: 100, currency: 'GBP' })).toThrow(
        'Invalid currency: GBP',
      );
    });

    it('should allow zero amount', () => {
      const money = Money.create({ amount: 0, currency: 'SAR' });
      expect(money.amount).toBe(0);
    });

    it('should allow decimal amounts', () => {
      const money = Money.create({ amount: 99.99, currency: 'USD' });
      expect(money.amount).toBe(99.99);
    });
  });

  describe('fromAmount', () => {
    it('should create money with default currency (SAR)', () => {
      const money = Money.fromAmount(100);
      expect(money.amount).toBe(100);
      expect(money.currency).toBe(CurrencyEnum.SAR);
    });

    it('should create money with specified currency', () => {
      const money = Money.fromAmount(200, CurrencyEnum.USD);
      expect(money.currency).toBe(CurrencyEnum.USD);
    });
  });

  describe('zero', () => {
    it('should create zero money with default currency', () => {
      const money = Money.zero();
      expect(money.amount).toBe(0);
      expect(money.currency).toBe(CurrencyEnum.SAR);
    });

    it('should create zero money with specified currency', () => {
      const money = Money.zero(CurrencyEnum.EUR);
      expect(money.amount).toBe(0);
      expect(money.currency).toBe(CurrencyEnum.EUR);
    });
  });

  describe('Arithmetic Operations', () => {
    describe('add', () => {
      it('should add two money values', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(50, CurrencyEnum.SAR);
        const result = money1.add(money2);
        expect(result.amount).toBe(150);
      });

      it('should throw error when adding different currencies', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(50, CurrencyEnum.USD);
        expect(() => money1.add(money2)).toThrow(
          'Cannot operate on different currencies: SAR vs USD',
        );
      });
    });

    describe('subtract', () => {
      it('should subtract money values', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(30, CurrencyEnum.SAR);
        const result = money1.subtract(money2);
        expect(result.amount).toBe(70);
      });

      it('should throw error when result would be negative', () => {
        const money1 = Money.fromAmount(50, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(() => money1.subtract(money2)).toThrow(
          'Subtraction would result in negative amount',
        );
      });

      it('should throw error when subtracting different currencies', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(50, CurrencyEnum.EUR);
        expect(() => money1.subtract(money2)).toThrow(
          'Cannot operate on different currencies',
        );
      });
    });

    describe('multiply', () => {
      it('should multiply by a factor', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        const result = money.multiply(2.5);
        expect(result.amount).toBe(250);
      });

      it('should multiply by zero', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        const result = money.multiply(0);
        expect(result.amount).toBe(0);
      });

      it('should throw error for negative factor', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(() => money.multiply(-2)).toThrow('Factor cannot be negative');
      });
    });

    describe('percentage', () => {
      it('should calculate percentage', () => {
        const money = Money.fromAmount(200, CurrencyEnum.SAR);
        const result = money.percentage(15);
        expect(result.amount).toBe(30);
      });

      it('should return zero for 0%', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        const result = money.percentage(0);
        expect(result.amount).toBe(0);
      });

      it('should return full amount for 100%', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        const result = money.percentage(100);
        expect(result.amount).toBe(100);
      });

      it('should throw error for negative percentage', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(() => money.percentage(-10)).toThrow(
          'Percentage must be between 0 and 100',
        );
      });

      it('should throw error for percentage > 100', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(() => money.percentage(150)).toThrow(
          'Percentage must be between 0 and 100',
        );
      });
    });
  });

  describe('Comparison Methods', () => {
    describe('isGreaterThan', () => {
      it('should return true when greater', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(50, CurrencyEnum.SAR);
        expect(money1.isGreaterThan(money2)).toBe(true);
      });

      it('should return false when equal', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(money1.isGreaterThan(money2)).toBe(false);
      });

      it('should return false when less', () => {
        const money1 = Money.fromAmount(50, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(money1.isGreaterThan(money2)).toBe(false);
      });
    });

    describe('isLessThan', () => {
      it('should return true when less', () => {
        const money1 = Money.fromAmount(50, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(money1.isLessThan(money2)).toBe(true);
      });

      it('should return false when equal', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(money1.isLessThan(money2)).toBe(false);
      });
    });

    describe('isGreaterThanOrEqual', () => {
      it('should return true when greater', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(50, CurrencyEnum.SAR);
        expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
      });

      it('should return true when equal', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
      });
    });

    describe('isZero', () => {
      it('should return true for zero amount', () => {
        const money = Money.zero();
        expect(money.isZero()).toBe(true);
      });

      it('should return false for non-zero amount', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(money.isZero()).toBe(false);
      });
    });

    describe('isPositive', () => {
      it('should return true for positive amount', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(money.isPositive()).toBe(true);
      });

      it('should return false for zero', () => {
        const money = Money.zero();
        expect(money.isPositive()).toBe(false);
      });
    });

    describe('equals', () => {
      it('should return true for same amount and currency', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(money1.equals(money2)).toBe(true);
      });

      it('should return false for different amounts', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(50, CurrencyEnum.SAR);
        expect(money1.equals(money2)).toBe(false);
      });

      it('should return false for different currencies', () => {
        const money1 = Money.fromAmount(100, CurrencyEnum.SAR);
        const money2 = Money.fromAmount(100, CurrencyEnum.USD);
        expect(money1.equals(money2)).toBe(false);
      });
    });
  });

  describe('Formatting', () => {
    describe('format', () => {
      it('should format money correctly', () => {
        const money = Money.fromAmount(100.5, CurrencyEnum.SAR);
        expect(money.format()).toBe('100.50 SAR');
      });

      it('should format whole numbers with decimals', () => {
        const money = Money.fromAmount(100, CurrencyEnum.USD);
        expect(money.format()).toBe('100.00 USD');
      });
    });

    describe('toString', () => {
      it('should return formatted string', () => {
        const money = Money.fromAmount(99.99, CurrencyEnum.EUR);
        expect(money.toString()).toBe('99.99 EUR');
      });
    });

    describe('toJSON', () => {
      it('should return JSON representation', () => {
        const money = Money.fromAmount(100, CurrencyEnum.SAR);
        expect(money.toJSON()).toEqual({
          amount: 100,
          currency: 'SAR',
        });
      });
    });
  });
});
