import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Auth0Service, Auth0Role } from '../../../infrastructure/persistence/auth0/auth0.service';

// ============================================
// INTERFACES / DTOs
// ============================================

export interface AssignRoleCommand {
    userId: string;         // Internal user ID
    roleName: string;       // Role name (e.g., 'admin', 'subscriber')
    syncToAuth0?: boolean;  // Whether to sync to Auth0 (default: true)
}

export interface RemoveRoleCommand {
    userId: string;
    roleName: string;
    syncToAuth0?: boolean;
}

export interface UserRoleDto {
    id: number;
    name: string;
    description: string | null;
    assignedAt: Date;
}

export interface RoleDto {
    id: number;
    name: string;
    description: string | null;
    permissionCount?: number;
}

export interface PermissionDto {
    id: number;
    name: string;
    description: string | null;
    category: string | null;
}

export interface UserWithRolesDto {
    id: string;
    email: string;
    username: string;
    fullName: string | null;
    auth0Id: string | null;
    roles: UserRoleDto[];
}

// ============================================
// HELPER: Role Name Conversion
// ============================================

/**
 * Convert local DB role name (underscores) to Auth0 format (spaces)
 * e.g., "system_admin" → "system admin"
 */
function localToAuth0RoleName(localName: string): string {
    return localName.replace(/_/g, ' ');
}

/**
 * Convert Auth0 role name (spaces) to local DB format (underscores)
 * e.g., "system admin" → "system_admin"
 */
function auth0ToLocalRoleName(auth0Name: string): string {
    return auth0Name.toLowerCase().replace(/\s+/g, '_');
}

// ============================================
// USE CASE: Assign Role to User
// ============================================

@Injectable()
export class AssignUserRoleUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auth0Service: Auth0Service,
    ) {}

    async execute(command: AssignRoleCommand): Promise<UserWithRolesDto> {
        const { userId, roleName, syncToAuth0 = true } = command;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } },
        });

        if (!user) {
            throw new NotFoundException(`User not found: ${userId}`);
        }

        // Find role by name
        const role = await this.prisma.role.findUnique({
            where: { name: roleName },
        });

        if (!role) {
            throw new NotFoundException(`Role not found: ${roleName}`);
        }

        // Check if user already has this role
        const existingAssignment = await this.prisma.userRole.findUnique({
            where: {
                userId_roleId: {
                    userId: user.id,
                    roleId: role.id,
                },
            },
        });

        if (existingAssignment) {
            throw new BadRequestException(`User already has role: ${roleName}`);
        }

        // Sync to Auth0 first (if user has auth0Id and sync is enabled)
        if (syncToAuth0 && user.auth0Id) {
            try {
                // Try to find Auth0 role by name (try both underscore and space formats)
                let auth0Role = await this.auth0Service.getRoleByName(roleName);
                if (!auth0Role) {
                    // Try with spaces instead of underscores (Auth0 format)
                    const auth0FormatName = localToAuth0RoleName(roleName);
                    auth0Role = await this.auth0Service.getRoleByName(auth0FormatName);
                }

                if (auth0Role) {
                    await this.auth0Service.assignRole(user.auth0Id, auth0Role.id);
                    console.log(`[AssignUserRoleUseCase] Synced role '${auth0Role.name}' to Auth0 for user ${user.auth0Id}`);
                } else {
                    console.warn(`[AssignUserRoleUseCase] Auth0 role not found: ${roleName}, skipping Auth0 sync`);
                }
            } catch (error) {
                console.error('[AssignUserRoleUseCase] Failed to sync role to Auth0:', error);
                throw new BadRequestException(`Failed to sync role to Auth0: ${error.message}`);
            }
        }

        // Assign role in local database
        await this.prisma.userRole.create({
            data: {
                userId: user.id,
                roleId: role.id,
            },
        });

        // Return updated user with roles
        const updatedUser = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: { role: true },
                    where: { deletedAt: null },
                },
            },
        });

        return this.mapToDto(updatedUser!);
    }

    private mapToDto(user: any): UserWithRolesDto {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            auth0Id: user.auth0Id,
            roles: user.roles.map((ur: any) => ({
                id: ur.role.id,
                name: ur.role.name,
                description: ur.role.description,
                assignedAt: ur.assignedAt,
            })),
        };
    }
}

// ============================================
// USE CASE: Remove Role from User
// ============================================

@Injectable()
export class RemoveUserRoleUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auth0Service: Auth0Service,
    ) {}

    async execute(command: RemoveRoleCommand): Promise<UserWithRolesDto> {
        const { userId, roleName, syncToAuth0 = true } = command;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User not found: ${userId}`);
        }

        // Find role by name
        const role = await this.prisma.role.findUnique({
            where: { name: roleName },
        });

        if (!role) {
            throw new NotFoundException(`Role not found: ${roleName}`);
        }

        // Check if user has this role
        const existingAssignment = await this.prisma.userRole.findUnique({
            where: {
                userId_roleId: {
                    userId: user.id,
                    roleId: role.id,
                },
            },
        });

        if (!existingAssignment) {
            throw new BadRequestException(`User does not have role: ${roleName}`);
        }

        // Sync to Auth0 first (if user has auth0Id and sync is enabled)
        if (syncToAuth0 && user.auth0Id) {
            try {
                // Try to find Auth0 role by name (try both underscore and space formats)
                let auth0Role = await this.auth0Service.getRoleByName(roleName);
                if (!auth0Role) {
                    const auth0FormatName = localToAuth0RoleName(roleName);
                    auth0Role = await this.auth0Service.getRoleByName(auth0FormatName);
                }

                if (auth0Role) {
                    await this.auth0Service.removeRole(user.auth0Id, auth0Role.id);
                    console.log(`[RemoveUserRoleUseCase] Removed role '${auth0Role.name}' from Auth0 for user ${user.auth0Id}`);
                }
            } catch (error) {
                console.error('[RemoveUserRoleUseCase] Failed to remove role from Auth0:', error);
                throw new BadRequestException(`Failed to remove role from Auth0: ${error.message}`);
            }
        }

        // Remove role from local database
        await this.prisma.userRole.delete({
            where: {
                userId_roleId: {
                    userId: user.id,
                    roleId: role.id,
                },
            },
        });

        // Return updated user with roles
        const updatedUser = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: { role: true },
                    where: { deletedAt: null },
                },
            },
        });

        return this.mapToDto(updatedUser!);
    }

    private mapToDto(user: any): UserWithRolesDto {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            auth0Id: user.auth0Id,
            roles: user.roles.map((ur: any) => ({
                id: ur.role.id,
                name: ur.role.name,
                description: ur.role.description,
                assignedAt: ur.assignedAt,
            })),
        };
    }
}

// ============================================
// USE CASE: Get User Roles
// ============================================

@Injectable()
export class GetUserRolesUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string): Promise<UserWithRolesDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: { role: true },
                    where: { deletedAt: null },
                },
            },
        });

        if (!user) {
            throw new NotFoundException(`User not found: ${userId}`);
        }

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            auth0Id: user.auth0Id,
            roles: user.roles.map((ur) => ({
                id: ur.role.id,
                name: ur.role.name,
                description: ur.role.description,
                assignedAt: ur.assignedAt,
            })),
        };
    }
}

// ============================================
// USE CASE: List All Roles
// ============================================

@Injectable()
export class ListRolesUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(): Promise<RoleDto[]> {
        const roles = await this.prisma.role.findMany({
            where: { deletedAt: null },
            include: {
                _count: {
                    select: { permissions: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        return roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            permissionCount: role._count.permissions,
        }));
    }
}

// ============================================
// USE CASE: List All Permissions
// ============================================

@Injectable()
export class ListPermissionsUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(category?: string): Promise<PermissionDto[]> {
        const permissions = await this.prisma.permission.findMany({
            where: {
                deletedAt: null,
                ...(category ? { category } : {}),
            },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });

        return permissions.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
        }));
    }
}

// ============================================
// USE CASE: Get Role with Permissions
// ============================================

@Injectable()
export class GetRolePermissionsUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(roleName: string): Promise<{ role: RoleDto; permissions: PermissionDto[] }> {
        const role = await this.prisma.role.findUnique({
            where: { name: roleName },
            include: {
                permissions: {
                    include: { permission: true },
                    where: { deletedAt: null },
                },
            },
        });

        if (!role) {
            throw new NotFoundException(`Role not found: ${roleName}`);
        }

        return {
            role: {
                id: role.id,
                name: role.name,
                description: role.description,
            },
            permissions: role.permissions.map((rp) => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })),
        };
    }
}

// ============================================
// USE CASE: Sync User Roles from Auth0
// ============================================

@Injectable()
export class SyncUserRolesFromAuth0UseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auth0Service: Auth0Service,
    ) {}

    async execute(userId: string): Promise<UserWithRolesDto> {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User not found: ${userId}`);
        }

        if (!user.auth0Id) {
            throw new BadRequestException('User does not have an Auth0 account linked');
        }

        // Get roles from Auth0
        const auth0Roles = await this.auth0Service.getUserRoles(user.auth0Id);

        // Get local roles that match Auth0 role names
        const roleNames = auth0Roles.map((r) => r.name);
        const localRoles = await this.prisma.role.findMany({
            where: { name: { in: roleNames } },
        });

        // Clear existing role assignments
        await this.prisma.userRole.deleteMany({
            where: { userId: user.id },
        });

        // Create new role assignments
        if (localRoles.length > 0) {
            await this.prisma.userRole.createMany({
                data: localRoles.map((role) => ({
                    userId: user.id,
                    roleId: role.id,
                })),
            });
        }

        // Return updated user with roles
        const updatedUser = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: { role: true },
                    where: { deletedAt: null },
                },
            },
        });

        return {
            id: updatedUser!.id,
            email: updatedUser!.email,
            username: updatedUser!.username,
            fullName: updatedUser!.fullName,
            auth0Id: updatedUser!.auth0Id,
            roles: updatedUser!.roles.map((ur) => ({
                id: ur.role.id,
                name: ur.role.name,
                description: ur.role.description,
                assignedAt: ur.assignedAt,
            })),
        };
    }
}

// ============================================
// USE CASE: Get Users by Role
// ============================================

@Injectable()
export class GetUsersByRoleUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        roleName: string,
        options?: { limit?: number; offset?: number },
    ): Promise<{ users: UserWithRolesDto[]; total: number }> {
        const role = await this.prisma.role.findUnique({
            where: { name: roleName },
        });

        if (!role) {
            throw new NotFoundException(`Role not found: ${roleName}`);
        }

        const { limit = 20, offset = 0 } = options || {};

        const [users, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where: {
                    roles: {
                        some: {
                            roleId: role.id,
                            deletedAt: null,
                        },
                    },
                    deletedAt: null,
                },
                include: {
                    roles: {
                        include: { role: true },
                        where: { deletedAt: null },
                    },
                },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({
                where: {
                    roles: {
                        some: {
                            roleId: role.id,
                            deletedAt: null,
                        },
                    },
                    deletedAt: null,
                },
            }),
        ]);

        return {
            users: users.map((user) => ({
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                auth0Id: user.auth0Id,
                roles: user.roles.map((ur) => ({
                    id: ur.role.id,
                    name: ur.role.name,
                    description: ur.role.description,
                    assignedAt: ur.assignedAt,
                })),
            })),
            total,
        };
    }
}
