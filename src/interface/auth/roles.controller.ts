// src/auth/roles/roles.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthRoleService } from '../../core/application/auth/role.service';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';

// DTO for role assignment with validation
class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}

@Controller('roles')
export class RolesController {
  constructor(private readonly authRoleService: AuthRoleService) {}

  @Get()
  @Roles('system admin', 'admin')
  @Permissions('roles:read')
  listRoles() {
    return this.authRoleService.listRoles();
  }

  @Post('assign')
  @Roles('system admin')
  @Permissions('roles:assign')
  assignRole(@Body() body: AssignRoleDto) {
    return this.authRoleService.assignRole(body.userId, body.role);
  }
}
