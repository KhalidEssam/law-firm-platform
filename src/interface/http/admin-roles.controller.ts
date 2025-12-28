import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';
import {
  AssignUserRoleUseCase,
  RemoveUserRoleUseCase,
  GetUserRolesUseCase,
  ListRolesUseCase,
  ListPermissionsUseCase,
  GetRolePermissionsUseCase,
  SyncUserRolesFromAuth0UseCase,
  GetUsersByRoleUseCase,
  UserWithRolesDto,
  RoleDto,
  PermissionDto,
} from '../../core/application/use-cases/user-role-management.use-case';
import { NotificationIntegrationService } from '../../core/application/notification/notification-integration.service';

// ============================================
// DTOs
// ============================================

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  roleName: string;
}

export class ListPermissionsQueryDto {
  @IsOptional()
  @IsString()
  category?: string;
}

export class ListUsersByRoleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class UserRolesResponseDto {
  user: UserWithRolesDto;
  message: string;
}

export class RolesListResponseDto {
  roles: RoleDto[];
  total: number;
}

export class PermissionsListResponseDto {
  permissions: PermissionDto[];
  total: number;
}

export class RolePermissionsResponseDto {
  role: RoleDto;
  permissions: PermissionDto[];
}

export class UsersByRoleResponseDto {
  users: UserWithRolesDto[];
  total: number;
  roleName: string;
}

// ============================================
// CONTROLLER
// ============================================

@ApiTags('Admin - Role Management')
@ApiBearerAuth()
@Controller('admin/roles')
export class AdminRolesController {
  constructor(
    private readonly assignUserRole: AssignUserRoleUseCase,
    private readonly removeUserRole: RemoveUserRoleUseCase,
    private readonly getUserRoles: GetUserRolesUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly listPermissions: ListPermissionsUseCase,
    private readonly getRolePermissions: GetRolePermissionsUseCase,
    private readonly syncUserRolesFromAuth0: SyncUserRolesFromAuth0UseCase,
    private readonly getUsersByRole: GetUsersByRoleUseCase,
    private readonly notificationService: NotificationIntegrationService,
  ) {}

  // ============================================
  // ROLES LISTING
  // ============================================

  @Get()
  @Roles('admin', 'system_admin', 'platform_admin')
  @Permissions('read:users')
  @ApiOperation({ summary: 'List all available roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async listAllRoles(): Promise<RolesListResponseDto> {
    const roles = await this.listRoles.execute();
    return {
      roles,
      total: roles.length,
    };
  }

  @Get('permissions')
  @Roles('admin', 'system_admin', 'platform_admin')
  @Permissions('read:users')
  @ApiOperation({ summary: 'List all available permissions' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async listAllPermissions(
    @Query() query: ListPermissionsQueryDto,
  ): Promise<PermissionsListResponseDto> {
    const permissions = await this.listPermissions.execute(query.category);
    return {
      permissions,
      total: permissions.length,
    };
  }

  @Get(':roleName/permissions')
  @Roles('admin', 'system_admin', 'platform_admin')
  @Permissions('read:users')
  @ApiOperation({ summary: 'Get permissions for a specific role' })
  @ApiParam({ name: 'roleName', description: 'Role name' })
  @ApiResponse({ status: 200, description: 'Role with its permissions' })
  async getRoleWithPermissions(
    @Param('roleName') roleName: string,
  ): Promise<RolePermissionsResponseDto> {
    return await this.getRolePermissions.execute(roleName);
  }

  @Get(':roleName/users')
  @Roles('admin', 'system_admin', 'platform_admin')
  @Permissions('read:users')
  @ApiOperation({ summary: 'Get users who have a specific role' })
  @ApiParam({ name: 'roleName', description: 'Role name' })
  @ApiResponse({ status: 200, description: 'List of users with the role' })
  async getUsersWithRole(
    @Param('roleName') roleName: string,
    @Query() query: ListUsersByRoleQueryDto,
  ): Promise<UsersByRoleResponseDto> {
    const result = await this.getUsersByRole.execute(roleName, {
      limit: query.limit,
      offset: query.offset,
    });
    return {
      ...result,
      roleName,
    };
  }

  // ============================================
  // USER ROLE MANAGEMENT
  // ============================================

  @Get('users/:userId')
  @Roles('admin', 'system_admin', 'platform_admin')
  @Permissions('read:users')
  @ApiOperation({ summary: 'Get roles for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User with their roles' })
  async getUserRolesById(
    @Param('userId') userId: string,
  ): Promise<UserRolesResponseDto> {
    const user = await this.getUserRoles.execute(userId);
    return {
      user,
      message: `User has ${user.roles.length} role(s)`,
    };
  }

  @Post('users/:userId/assign')
  @Roles('admin', 'system_admin', 'platform_admin')
  @Permissions('update:users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a role to a user (local DB only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @ApiResponse({ status: 400, description: 'User already has role' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ): Promise<UserRolesResponseDto> {
    const user = await this.assignUserRole.execute({
      userId,
      roleName: dto.roleName,
    });

    // Send notification to user about the new role assignment
    await this.notificationService.notifyRoleAssigned({
      userId: user.id,
      userEmail: user.email,
      roleName: dto.roleName,
    });

    return {
      user,
      message: `Role '${dto.roleName}' assigned successfully (local DB only)`,
    };
  }

  @Delete('users/:userId/roles/:roleName')
  @Roles('admin', 'system_admin', 'platform_admin')
  @Permissions('update:users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a role from a user (local DB only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'roleName', description: 'Role name to remove' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @ApiResponse({ status: 400, description: 'User does not have role' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleName') roleName: string,
  ): Promise<UserRolesResponseDto> {
    const user = await this.removeUserRole.execute({
      userId,
      roleName,
    });

    // Send notification to user about the role removal
    await this.notificationService.notifyRoleRemoved({
      userId: user.id,
      userEmail: user.email,
      roleName,
    });

    return {
      user,
      message: `Role '${roleName}' removed successfully (local DB only)`,
    };
  }

  @Post('users/:userId/sync')
  @Roles('admin', 'system_admin', 'platform_admin')
  @Permissions('update:users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync user roles from Auth0 to local database' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Roles synced successfully' })
  @ApiResponse({
    status: 400,
    description: 'User does not have Auth0 account linked',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async syncUserRoles(
    @Param('userId') userId: string,
  ): Promise<UserRolesResponseDto> {
    const user = await this.syncUserRolesFromAuth0.execute(userId);
    return {
      user,
      message: `Roles synced from Auth0. User now has ${user.roles.length} role(s)`,
    };
  }
}
