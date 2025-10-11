import { Injectable } from '@nestjs/common';
import { IRoleProvider } from '../../auth/role.provider';
import { Auth0Service } from './auth0.service';

@Injectable()
export class Auth0RoleProvider implements IRoleProvider {
    constructor(private readonly service: Auth0Service) { }

    async getRoles(): Promise<string[]> {
        console.log('[Auth0RoleProvider] Fetching roles...');
        const roles = await this.service.getRoles().catch(err => {
            console.error('[Auth0RoleProvider] Error fetching roles:', err);
            throw err; // propagate to service
        });
        console.log('[Auth0RoleProvider] Raw roles:', roles);
        return roles.map(r => r.name);
    }
    async assignRole(userId: string, roleId: string): Promise<void> {
        console.log('[Auth0RoleProvider] Assigning role', roleId, 'to user', userId);
        await this.service.assignRole(userId, roleId);
    }
}
