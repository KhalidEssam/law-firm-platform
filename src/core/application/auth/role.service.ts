// src/application/auth/services/auth.role.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IRoleProvider, ROLE_PROVIDER } from '../../../auth/role.provider';

@Injectable()
export class AuthRoleService {
  constructor(
    @Inject(ROLE_PROVIDER) private readonly roleProvider: IRoleProvider,
  ) {}

  async listRoles(): Promise<string[]> {
    try {
      return await this.roleProvider.getRoles();
    } catch (e) {
      throw new NotFoundException(`Failed to list roles: ${e.message}`);
    }
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    try {
      await this.roleProvider.assignRole(userId, roleId);
    } catch (e) {
      throw new NotFoundException(`Failed to assign role: ${e.message}`);
    }
  }
}
