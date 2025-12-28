import { User, ProfileStatus } from './user.entity';
import { Email } from '../value-objects/email.vo';
import { Username } from '../value-objects/username.vo';

describe('User Entity', () => {
  const createValidEmail = () => Email.create('test@example.com');
  const createValidUsername = () => Username.create('testuser');

  describe('create', () => {
    it('should create a new user with required fields', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });

      expect(user.id).toBeDefined();
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.username.getValue()).toBe('testuser');
      expect(user.profileStatus).toBe(ProfileStatus.PENDING);
      expect(user.emailVerified).toBe(false);
      expect(user.mobileVerified).toBe(false);
      expect(user.pointsBalance).toBe(0);
      expect(user.walletBalance).toBe(0);
    });

    it('should create a user with optional fields', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        fullName: 'John Doe',
        auth0Id: 'auth0|123',
        emailVerified: true,
        profileStatus: ProfileStatus.ACTIVE,
      });

      expect(user.fullName).toBe('John Doe');
      expect(user.auth0Id).toBe('auth0|123');
      expect(user.emailVerified).toBe(true);
      expect(user.profileStatus).toBe(ProfileStatus.ACTIVE);
    });

    it('should set createdAt and updatedAt on creation', () => {
      const beforeCreate = new Date();
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });
      const afterCreate = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a user from props', () => {
      const props = {
        id: 'user-123',
        email: createValidEmail(),
        username: createValidUsername(),
        emailVerified: true,
        mobileVerified: false,
        profileStatus: ProfileStatus.ACTIVE,
        pointsBalance: 100,
        walletBalance: 50.5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const user = User.reconstitute(props);

      expect(user.id).toBe('user-123');
      expect(user.pointsBalance).toBe(100);
      expect(user.walletBalance).toBe(50.5);
    });
  });

  describe('Status Management', () => {
    it('should activate a pending user', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });

      const activatedUser = user.activate();

      expect(activatedUser.profileStatus).toBe(ProfileStatus.ACTIVE);
      expect(activatedUser.isActive()).toBe(true);
    });

    it('should throw when activating already active user', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        profileStatus: ProfileStatus.ACTIVE,
      });

      expect(() => user.activate()).toThrow('User is already active');
    });

    it('should suspend a user', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        profileStatus: ProfileStatus.ACTIVE,
      });

      const suspendedUser = user.suspend();

      expect(suspendedUser.profileStatus).toBe(ProfileStatus.SUSPENDED);
      expect(suspendedUser.isSuspended()).toBe(true);
    });

    it('should throw when suspending already suspended user', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        profileStatus: ProfileStatus.SUSPENDED,
      });

      expect(() => user.suspend()).toThrow('User is already suspended');
    });

    it('should deactivate a user', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        profileStatus: ProfileStatus.ACTIVE,
      });

      const deactivatedUser = user.deactivate();

      expect(deactivatedUser.profileStatus).toBe(ProfileStatus.DEACTIVATED);
      expect(deactivatedUser.isDeactivated()).toBe(true);
    });
  });

  describe('Verification', () => {
    it('should verify email', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });

      const verifiedUser = user.verifyEmail();

      expect(verifiedUser.emailVerified).toBe(true);
    });

    it('should throw when verifying already verified email', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        emailVerified: true,
      });

      expect(() => user.verifyEmail()).toThrow('Email is already verified');
    });

    it('should verify mobile', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });

      const verifiedUser = user.verifyMobile();

      expect(verifiedUser.mobileVerified).toBe(true);
    });

    it('should throw when verifying already verified mobile', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        mobileVerified: true,
      });

      expect(() => user.verifyMobile()).toThrow('Mobile is already verified');
    });

    it('should return true for isVerified when both email and mobile are verified', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        emailVerified: true,
        mobileVerified: true,
      });

      expect(user.isVerified()).toBe(true);
    });
  });

  describe('Balance Management', () => {
    describe('Points', () => {
      it('should add points', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
        });

        const updatedUser = user.addPoints(100);

        expect(updatedUser.pointsBalance).toBe(100);
      });

      it('should throw when adding negative points', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
        });

        expect(() => user.addPoints(-10)).toThrow('Points cannot be negative');
      });

      it('should deduct points', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
          pointsBalance: 100,
        });

        const updatedUser = user.deductPoints(30);

        expect(updatedUser.pointsBalance).toBe(70);
      });

      it('should throw when deducting more points than available', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
          pointsBalance: 50,
        });

        expect(() => user.deductPoints(100)).toThrow(
          'Insufficient points balance',
        );
      });

      it('should check if user has enough points', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
          pointsBalance: 100,
        });

        expect(user.hasPoints(50)).toBe(true);
        expect(user.hasPoints(100)).toBe(true);
        expect(user.hasPoints(150)).toBe(false);
      });
    });

    describe('Wallet', () => {
      it('should add wallet funds', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
        });

        const updatedUser = user.addWalletFunds(100.5);

        expect(updatedUser.walletBalance).toBe(100.5);
      });

      it('should throw when adding negative wallet funds', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
        });

        expect(() => user.addWalletFunds(-10)).toThrow(
          'Amount cannot be negative',
        );
      });

      it('should deduct wallet funds', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
          walletBalance: 100,
        });

        const updatedUser = user.deductWalletFunds(30.25);

        expect(updatedUser.walletBalance).toBe(69.75);
      });

      it('should throw when deducting more funds than available', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
          walletBalance: 50,
        });

        expect(() => user.deductWalletFunds(100)).toThrow(
          'Insufficient wallet balance',
        );
      });

      it('should check if user has enough wallet funds', () => {
        const user = User.create({
          email: createValidEmail(),
          username: createValidUsername(),
          walletBalance: 100,
        });

        expect(user.hasWalletFunds(50)).toBe(true);
        expect(user.hasWalletFunds(100)).toBe(true);
        expect(user.hasWalletFunds(150)).toBe(false);
      });
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete a user', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });

      const deletedUser = user.softDelete();

      expect(deletedUser.deletedAt).toBeDefined();
      expect(deletedUser.isDeleted()).toBe(true);
    });

    it('should throw when deleting already deleted user', () => {
      const user = User.reconstitute({
        id: 'user-123',
        email: createValidEmail(),
        username: createValidUsername(),
        emailVerified: false,
        mobileVerified: false,
        profileStatus: ProfileStatus.ACTIVE,
        pointsBalance: 0,
        walletBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      });

      expect(() => user.softDelete()).toThrow('User is already deleted');
    });

    it('should restore a deleted user', () => {
      const user = User.reconstitute({
        id: 'user-123',
        email: createValidEmail(),
        username: createValidUsername(),
        emailVerified: false,
        mobileVerified: false,
        profileStatus: ProfileStatus.ACTIVE,
        pointsBalance: 0,
        walletBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      });

      const restoredUser = user.restore();

      expect(restoredUser.deletedAt).toBeUndefined();
      expect(restoredUser.isDeleted()).toBe(false);
    });

    it('should throw when restoring non-deleted user', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });

      expect(() => user.restore()).toThrow('User is not deleted');
    });
  });

  describe('Profile Update', () => {
    it('should update profile fields', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });

      const updatedUser = user.updateProfile({
        fullName: 'John Doe',
        nickname: 'johnny',
        gender: 'male',
      });

      expect(updatedUser.fullName).toBe('John Doe');
      expect(updatedUser.nickname).toBe('johnny');
      expect(updatedUser.gender).toBe('male');
    });

    it('should preserve existing fields when updating', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        fullName: 'Original Name',
        gender: 'male',
      });

      const updatedUser = user.updateProfile({
        nickname: 'newNick',
      });

      expect(updatedUser.fullName).toBe('Original Name');
      expect(updatedUser.gender).toBe('male');
      expect(updatedUser.nickname).toBe('newNick');
    });
  });

  describe('Tier Management', () => {
    it('should update loyalty tier', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });

      const updatedUser = user.updateLoyaltyTier('gold');

      expect(updatedUser.loyaltyTier).toBe('gold');
    });

    it('should update subscription tier', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
      });

      const updatedUser = user.updateSubscriptionTier('premium');

      expect(updatedUser.subscriptionTier).toBe('premium');
    });
  });

  describe('toObject', () => {
    it('should return a copy of user props', () => {
      const user = User.create({
        email: createValidEmail(),
        username: createValidUsername(),
        fullName: 'Test User',
      });

      const obj = user.toObject();

      expect(obj.email).toBe(user.email);
      expect(obj.fullName).toBe('Test User');
    });
  });
});
