import { Membership } from './membership.entity';

describe('Membership Entity', () => {
  describe('create', () => {
    it('should create a new membership with required fields', () => {
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
      });

      expect(membership.id).toBeDefined();
      expect(membership.userId).toBe('user-123');
      expect(membership.tierId).toBe(1);
      expect(membership.isActive).toBe(true);
      expect(membership.autoRenew).toBe(true);
      expect(membership.startDate).toBeDefined();
    });

    it('should create membership with custom start date', () => {
      const startDate = new Date('2024-01-01');
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 2,
        startDate,
      });

      expect(membership.startDate).toEqual(startDate);
    });

    it('should create membership with end date', () => {
      const endDate = new Date('2024-12-31');
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
        endDate,
      });

      expect(membership.endDate).toEqual(endDate);
    });

    it('should create inactive membership', () => {
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
        isActive: false,
      });

      expect(membership.isActive).toBe(false);
    });

    it('should create membership without auto-renew', () => {
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
        autoRenew: false,
      });

      expect(membership.autoRenew).toBe(false);
    });

    it('should generate unique IDs for each membership', () => {
      const membership1 = Membership.create({ userId: 'user-1', tierId: 1 });
      const membership2 = Membership.create({ userId: 'user-2', tierId: 1 });

      expect(membership1.id).not.toBe(membership2.id);
    });
  });

  describe('rehydrate', () => {
    it('should rehydrate membership from database record', () => {
      const record = {
        id: 'membership-123',
        userId: 'user-456',
        tierId: 3,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        autoRenew: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
      };

      const membership = Membership.rehydrate(record);

      expect(membership.id).toBe('membership-123');
      expect(membership.userId).toBe('user-456');
      expect(membership.tierId).toBe(3);
      expect(membership.startDate).toEqual(record.startDate);
      expect(membership.endDate).toEqual(record.endDate);
      expect(membership.isActive).toBe(true);
      expect(membership.autoRenew).toBe(false);
    });

    it('should rehydrate membership without end date', () => {
      const record = {
        id: 'membership-123',
        userId: 'user-456',
        tierId: 1,
        startDate: new Date('2024-01-01'),
        isActive: true,
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const membership = Membership.rehydrate(record);

      expect(membership.endDate).toBeUndefined();
    });
  });

  describe('cancel', () => {
    it('should cancel an active membership', () => {
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
      });

      const cancelledMembership = membership.cancel();

      expect(cancelledMembership.isActive).toBe(false);
      expect(cancelledMembership.autoRenew).toBe(false);
      expect(cancelledMembership.endDate).toBeDefined();
    });

    it('should preserve membership ID after cancellation', () => {
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
      });

      const cancelledMembership = membership.cancel();

      expect(cancelledMembership.id).toBe(membership.id);
    });

    it('should preserve user and tier after cancellation', () => {
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 2,
      });

      const cancelledMembership = membership.cancel();

      expect(cancelledMembership.userId).toBe('user-123');
      expect(cancelledMembership.tierId).toBe(2);
    });
  });

  describe('renew', () => {
    it('should renew membership for 1 month', () => {
      const startDate = new Date('2024-01-01');
      // Use Jan 15 to avoid month overflow (Jan 31 + 1 month = March 2 due to no Feb 31)
      const endDate = new Date('2024-01-15');
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
        startDate,
        endDate,
      });

      const renewedMembership = membership.renew(1);

      expect(renewedMembership.isActive).toBe(true);
      expect(renewedMembership.endDate).toBeDefined();
      expect(renewedMembership.endDate!.getMonth()).toBe(1); // February 15
    });

    it('should renew membership for 12 months (annual)', () => {
      const endDate = new Date('2024-01-31');
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
        endDate,
      });

      const renewedMembership = membership.renew(12);

      expect(renewedMembership.endDate).toBeDefined();
      expect(renewedMembership.endDate!.getFullYear()).toBe(2025);
    });

    it('should preserve membership ID after renewal', () => {
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
      });

      const renewedMembership = membership.renew(1);

      expect(renewedMembership.id).toBe(membership.id);
    });

    it('should preserve auto-renew setting after renewal', () => {
      const membership = Membership.create({
        userId: 'user-123',
        tierId: 1,
        autoRenew: false,
      });

      const renewedMembership = membership.renew(1);

      expect(renewedMembership.autoRenew).toBe(false);
    });
  });
});
