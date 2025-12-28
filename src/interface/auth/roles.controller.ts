// src/auth/roles/roles.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthRoleService } from '../../core/application/auth/role.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly authRoleService: AuthRoleService) {}

  @Get()
  listRoles() {
    return this.authRoleService.listRoles();
  }

  @Post('assign')
  assignRole(@Body() body: { userId: string; role: string }) {
    return this.authRoleService.assignRole(body.userId, body.role);
  }
}
