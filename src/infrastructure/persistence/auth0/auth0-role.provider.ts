import { Injectable, Logger } from '@nestjs/common';
import { IRoleProvider } from '../../../auth/role.provider';
import { Auth0Service } from './auth0.service';

@Injectable()
export class Auth0RoleProvider implements IRoleProvider {
  private readonly logger = new Logger(Auth0RoleProvider.name);

  constructor(private readonly service: Auth0Service) {}

  async getRoles(): Promise<string[]> {
    this.logger.debug('Fetching roles from Auth0');
    const roles = await this.service.getRoles().catch((err) => {
      this.logger.error('Error fetching roles from Auth0', err.stack);
      throw err;
    });
    this.logger.debug(`Fetched ${roles.length} roles from Auth0`);
    return roles.map((r) => r.name);
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    this.logger.debug(`Assigning role ${roleId} to user ${userId}`);
    await this.service.assignRole(userId, roleId);
  }
}
