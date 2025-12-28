// Mock PrismaService before importing the controller
jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    $queryRawUnsafe: jest.fn(),
  })),
}));

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      $queryRawUnsafe: jest.fn(),
    };

    controller = new HealthController(mockPrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('liveness', () => {
    it('should return ok status', () => {
      const result = controller.liveness();

      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('readiness', () => {
    it('should return ok when database is connected', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);

      const result = await controller.readiness();

      expect(result.status).toBe('ok');
      expect(result.database).toBe(true);
    });

    it('should return error when database is disconnected', async () => {
      mockPrismaService.$queryRawUnsafe.mockRejectedValue(
        new Error('Connection failed'),
      );

      const result = await controller.readiness();

      expect(result.status).toBe('error');
      expect(result.database).toBe(false);
    });
  });

  describe('check', () => {
    it('should return full health check with connected database', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.services.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.environment).toBeDefined();
      expect(result.version).toBeDefined();
    });

    it('should return error status when database is disconnected', async () => {
      mockPrismaService.$queryRawUnsafe.mockRejectedValue(
        new Error('Connection failed'),
      );

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.services.database).toBe('disconnected');
    });

    it('should include timestamp in ISO format', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);

      const result = await controller.check();

      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should include uptime as a number', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);

      const result = await controller.check();

      expect(typeof result.uptime).toBe('number');
    });
  });
});
