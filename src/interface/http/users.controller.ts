import { Body, Controller, Post, Get, Patch, Delete, Param, Query, BadRequestException, UseGuards, Req, HttpCode, HttpStatus, } from '@nestjs/common';
import { CreateUserUseCase } from '../../core/application/use-cases/create-user.use-case';
import { SyncAuth0UserUseCase } from '../../core/application/use-cases/sync-auth0-user.use-case';
import { UpdateUserProfileUseCase } from '../../core/application/use-cases/update-user-profile.usecase';
import { GetUserByIdUseCase } from '../../core/application/use-cases/get-user-by-id.use-case';
import { ListUsersUseCase } from '../../core/application/use-cases/get-all-users.use-case';
import { DeleteUserUseCase } from '../../core/application/use-cases/delete-user.use-case';
import { GetUserByEmailUseCase } from 'src/core/application/use-cases/get-user-by-email.use-case';
import { GetUserByUsernameUseCase } from '../../core/application/use-cases/get-user-by-username.use-case';
import { GetUserByAuth0IdUseCase } from '../../core/application/use-cases/get-user-by-auth0.use-case';
import { VerifyEmailUseCase } from '../../core/application/use-cases/verify-email.use-case';
import { VerifyMobileUseCase } from '../../core/application/use-cases/verify-mobile.use-case';
import { UpdateProfileStatusUseCase } from '../../core/application/use-cases/update-profile-status.use-case';
import { RestoreUserUseCase } from 'src/core/application/use-cases/restore-user.use-case';
import { SearchUsersUseCase } from 'src/core/application/use-cases/search-user.use-case';
import { CheckEmailAvailabilityUseCase } from 'src/core/application/use-cases/check-email-availability.use-case';
import { CheckUsernameAvailabilityUseCase } from 'src/core/application/use-cases/check-username-availability.use-case';
import {
    GetUserIdentitiesUseCase,
    SetPrimaryIdentityUseCase,
    UnlinkIdentityUseCase,
    getProviderDisplayName,
} from 'src/core/application/use-cases/user-identities.use-case';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import {
    AvailabilityResponseDto, CheckEmailDto, CheckUsernameDto,
    CreateUserDto, UpdateUserProfileDto, UserResponseDto, ListUsersResponseDto,
    UpdateProfileStatusDto, ListUsersQueryDto, SearchUsersQueryDto,
} from 'application/dtos';
import { Public } from 'src/auth/decorators/public.decorator';


// ============================================
// USER CONTROLLER
// presentation/http/controllers/UserController.ts
// ============================================

@Controller('users')
export class UserController {
    constructor(
        private readonly createUser: CreateUserUseCase,
        private readonly getUserById: GetUserByIdUseCase,
        private readonly getUserByEmail: GetUserByEmailUseCase,
        private readonly getUserByUsername: GetUserByUsernameUseCase,
        private readonly getUserByAuth0Id: GetUserByAuth0IdUseCase,
        private readonly listUsers: ListUsersUseCase,
        private readonly updateUserProfile: UpdateUserProfileUseCase,
        private readonly verifyEmail: VerifyEmailUseCase,
        private readonly verifyMobile: VerifyMobileUseCase,
        private readonly updateProfileStatus: UpdateProfileStatusUseCase,
        private readonly deleteUser: DeleteUserUseCase,
        // private readonly hardDeleteUser: HardDeleteUserUseCase,
        private readonly restoreUser: RestoreUserUseCase,
        private readonly searchUsers: SearchUsersUseCase,
        private readonly syncAuth0User: SyncAuth0UserUseCase,
        private readonly checkEmailAvailability: CheckEmailAvailabilityUseCase,
        private readonly checkUsernameAvailability: CheckUsernameAvailabilityUseCase,
        private readonly getUserIdentities: GetUserIdentitiesUseCase,
        private readonly setPrimaryIdentity: SetPrimaryIdentityUseCase,
        private readonly unlinkIdentity: UnlinkIdentityUseCase,
    ) { }

    // ============================================
    // PUBLIC / REGISTRATION ENDPOINTS
    // ============================================

    /**
     * Create a new user (Registration)
     * Accessible by: Anyone (public endpoint - remove guards if needed)
     */
    @Public()
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateUserDto): Promise<{ user: UserResponseDto }> {
        const user = await this.createUser.execute(dto);
        return {
            user: this.mapToResponse(user),
        };
    }

    /**
     * Check if email is available
     * Accessible by: Anyone (public)
     */
    @Public()
    @Post('check-email')
    @HttpCode(HttpStatus.OK)
    async checkEmail(@Body() dto: CheckEmailDto): Promise<AvailabilityResponseDto> {
        const available = await this.checkEmailAvailability.execute(dto.email);
        return { available };
    }

    /**
     * Check if username is available
     * Accessible by: Anyone (public)
     */
    @Public()
    @Post('check-username')
    @HttpCode(HttpStatus.OK)
    async checkUsername(@Body() dto: CheckUsernameDto): Promise<AvailabilityResponseDto> {
        const available = await this.checkUsernameAvailability.execute(dto.username);
        return { available };
    }

    // ============================================
    // CURRENT USER ENDPOINTS (All authenticated users)
    // ============================================

    /**
     * Get current user profile
     * Accessible by: user, partner, platform, system admin
     */
    @Get('me')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getMyProfile(@Req() req: any): Promise<{ user: UserResponseDto }> {
        const auth0User = req.user;
        console.log('[getMyProfile] Auth0 user:', auth0User);

        // Sync user AND their roles from Auth0 JWT to local database
        const user = await this.syncAuth0User.execute({
            auth0Id: auth0User.sub,
            email: auth0User.email,
            username: auth0User.nickname || auth0User.name || auth0User.email,
            fullName: auth0User.name,
            emailVerified: auth0User.email_verified,
            roles: auth0User.roles || [],  // Sync roles from Auth0 JWT
        });
        return {
            user: this.mapToResponse(user),
        };
    }
    /**
     * Update current user profile
     * Accessible by: user, partner, platform, system admin
     */
    /** */
    @Patch('me')
    @Roles('user')
    async updateMyProfile(
        @Req() req: any,
        @Body() dto: UpdateUserProfileDto & { sub?: string; email?: string; name?: string },
    ): Promise<{ user: UserResponseDto }> {
        console.log('Received body:', dto);

        const auth0User = req.user;

        if (!auth0User?.sub) {
            throw new BadRequestException('Auth0 ID is required to update user profile');
        }

        console.log('🔍 Syncing user with Auth0 ID:', auth0User.sub);

        // Sync user AND their roles from Auth0 JWT to local database
        let user;
        try {
            user = await this.syncAuth0User.execute({
                auth0Id: auth0User.sub,
                email: auth0User.email || dto.email,
                username: auth0User.nickname || auth0User.name || auth0User.email,
                fullName: auth0User.name,
                emailVerified: auth0User.email_verified,
                roles: auth0User.roles || [],  // Sync roles from Auth0 JWT
            });
            console.log('✅ User synced:', user?.id);
        } catch (error) {
            console.error('❌ Failed to sync user:', error);
            throw new BadRequestException(`Failed to sync user: ${error.message}`);
        }

        // Extract only the profile update fields (exclude auth fields)
        const { sub, email, name, ...profileUpdateDto } = dto;

        // Now safely update profile (only if there are fields to update)
        if (Object.keys(profileUpdateDto).length > 0) {
            console.log('📝 Updating profile with:', profileUpdateDto);

            try {
                const updated = await this.updateUserProfile.execute({
                    userId: user.id,
                    ...profileUpdateDto,
                });

                return {
                    user: this.mapToResponse(updated),
                };
            } catch (error) {
                console.error('❌ Failed to update profile:', error);
                throw new BadRequestException(`Failed to update profile: ${error.message}`);
            }
        }

        // If no profile fields to update, just return the user
        console.log('ℹ️ No profile fields to update, returning existing user');
        return {
            user: this.mapToResponse(user),
        };
    }

    // ============================================
    // IDENTITY MANAGEMENT ENDPOINTS
    // ============================================

    /**
     * Get all linked identities for current user
     * Shows all login methods (Google, Facebook, email/password, etc.)
     */
    @Get('me/identities')
    @Roles('user')
    async getMyIdentities(@Req() req: any): Promise<{
        identities: Array<{
            id: string;
            provider: string;
            providerDisplayName: string;
            email: string | null;
            displayName: string | null;
            isPrimary: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
        }>;
    }> {
        const auth0User = req.user;

        // First sync to ensure user exists
        const user = await this.syncAuth0User.execute({
            auth0Id: auth0User.sub,
            email: auth0User.email,
            username: auth0User.nickname || auth0User.name || auth0User.email,
            fullName: auth0User.name,
            emailVerified: auth0User.email_verified,
            roles: auth0User.roles || [],
        });

        const identities = await this.getUserIdentities.execute(user.id);

        return {
            identities: identities.map(identity => ({
                id: identity.id,
                provider: identity.provider,
                providerDisplayName: getProviderDisplayName(identity.provider),
                email: identity.email,
                displayName: identity.displayName,
                isPrimary: identity.isPrimary,
                lastLoginAt: identity.lastLoginAt,
                createdAt: identity.createdAt,
            })),
        };
    }

    /**
     * Set an identity as primary login method
     */
    @Patch('me/identities/:identityId/set-primary')
    @Roles('user')
    @HttpCode(HttpStatus.OK)
    async setMyPrimaryIdentity(
        @Req() req: any,
        @Param('identityId') identityId: string,
    ): Promise<{ success: boolean; message: string }> {
        const auth0User = req.user;

        // First sync to ensure user exists
        const user = await this.syncAuth0User.execute({
            auth0Id: auth0User.sub,
            email: auth0User.email,
            username: auth0User.nickname || auth0User.name || auth0User.email,
            fullName: auth0User.name,
            emailVerified: auth0User.email_verified,
            roles: auth0User.roles || [],
        });

        try {
            await this.setPrimaryIdentity.execute(user.id, identityId);
            return {
                success: true,
                message: 'Primary login method updated successfully',
            };
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Unlink an identity (remove a login method)
     * Cannot unlink if it's the only identity
     */
    @Delete('me/identities/:identityId')
    @Roles('user')
    @HttpCode(HttpStatus.OK)
    async unlinkMyIdentity(
        @Req() req: any,
        @Param('identityId') identityId: string,
    ): Promise<{ success: boolean; message: string }> {
        const auth0User = req.user;

        // First sync to ensure user exists
        const user = await this.syncAuth0User.execute({
            auth0Id: auth0User.sub,
            email: auth0User.email,
            username: auth0User.nickname || auth0User.name || auth0User.email,
            fullName: auth0User.name,
            emailVerified: auth0User.email_verified,
            roles: auth0User.roles || [],
        });

        try {
            await this.unlinkIdentity.execute(user.id, identityId);
            return {
                success: true,
                message: 'Login method unlinked successfully',
            };
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    // ============================================
    // ADMIN ENDPOINTS (system admin only)
    // ============================================

    /**
     * List all users with filters
     * Accessible by: system admin
     */
    @Get()
    @Roles('system admin')
    @Permissions('read:users')
    async list(@Query() query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
        const result = await this.listUsers.execute(query);
        return {
            users: result.users.map((u) => this.mapToResponse(u)),
            total: result.total,
            limit: result.limit,
            offset: result.offset,
        };
    }

    /**
     * Search users
     * Accessible by: system admin, platform
     */
    @Get('search')
    @Roles('system admin', 'platform')
    @Permissions('read:users')
    async search(@Query() query: SearchUsersQueryDto): Promise<{ users: UserResponseDto[] }> {
        const users = await this.searchUsers.execute(query);
        return {
            users: users.map((u) => this.mapToResponse(u)),
        };
    }

    /**
     * Get user by ID
     * Accessible by: system admin, platform
     */
    @Get(':id')
    @Roles('system admin', 'platform')
    @Permissions('read:users')
    async getById(@Param('id') id: string): Promise<{ user: UserResponseDto }> {
        const user = await this.getUserById.execute(id);
        return {
            user: this.mapToResponse(user),
        };
    }

    /**
     * Get user by email
     * Accessible by: system admin
     */
    @Get('email/:email')
    @Roles('system admin')
    @Permissions('read:users')
    async getByEmail(@Param('email') email: string): Promise<{ user: UserResponseDto }> {
        const user = await this.getUserByEmail.execute(email);
        return {
            user: this.mapToResponse(user),
        };
    }

    /**
     * Get user by username
     * Accessible by: system admin
     */
    @Get('username/:username')
    @Roles('system admin')
    @Permissions('read:users')
    async getByUsername(@Param('username') username: string): Promise<{ user: UserResponseDto }> {
        const user = await this.getUserByUsername.execute(username);
        return {
            user: this.mapToResponse(user),
        };
    }

    /**
     * Update user profile (Admin)
     * Accessible by: system admin
     */
    @Patch(':id')
    @Roles('system admin')
    @Permissions('update:users')
    async updateById(
        @Param('id') id: string,
        @Body() dto: UpdateUserProfileDto,
    ): Promise<{ user: UserResponseDto }> {
        const updated = await this.updateUserProfile.execute({
            userId: id,
            ...dto,
        });
        return {
            user: this.mapToResponse(updated),
        };
    }

    /**
     * Verify user email
     * Accessible by: system admin
     */
    @Post(':id/verify-email')
    @Roles('system admin')
    @Permissions('update:users')
    @HttpCode(HttpStatus.OK)
    async verifyUserEmail(@Param('id') id: string): Promise<{ user: UserResponseDto }> {
        const user = await this.verifyEmail.execute(id);
        return {
            user: this.mapToResponse(user),
        };
    }

    /**
     * Verify user mobile
     * Accessible by: system admin
     */
    @Post(':id/verify-mobile')
    @Roles('system admin')
    @Permissions('update:users')
    @HttpCode(HttpStatus.OK)
    async verifyUserMobile(@Param('id') id: string): Promise<{ user: UserResponseDto }> {
        const user = await this.verifyMobile.execute(id);
        return {
            user: this.mapToResponse(user),
        };
    }

    /**
     * Update user profile status
     * Accessible by: system admin
     */
    @Patch(':id/status')
    @Roles('system admin')
    @Permissions('update:users')
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateProfileStatusDto,
    ): Promise<{ user: UserResponseDto }> {
        const user = await this.updateProfileStatus.execute({
            userId: id,
            status: dto.status,
        });
        return {
            user: this.mapToResponse(user),
        };
    }

    /**
     * Soft delete user
     * Accessible by: system admin
     */
    @Delete(':id')
    @Roles('system admin')
    @Permissions('delete:users')
    @HttpCode(HttpStatus.OK)
    async softDelete(@Param('id') id: string): Promise<{ user: UserResponseDto }> {
        const user = await this.deleteUser.execute(id);
        return {
            user: this.mapToResponse(user),
        };
    }

    @Post(':id/restore')
    @Roles('system admin')
    @Permissions('update:users')
    @HttpCode(HttpStatus.OK)
    async restore(@Param('id') id: string): Promise<{ user: UserResponseDto }> {
        const user = await this.restoreUser.execute(id);
        return {
            user: this.mapToResponse(user),
        };
    }

    // ============================================
    // HELPER METHOD
    // ============================================

    private mapToResponse(user: any): UserResponseDto {
        return {
            id: user.id,
            email: user.email.getValue(),
            username: user.username.getValue(),
            auth0Id: user.auth0Id,
            fullName: user.fullName,
            gender: user.gender,
            city: user.city?.getValue(),
            biography: user.biography?.getValue(),
            profession: user.profession?.getValue(),
            photo: user.photo?.getUrl(),
            ageGroup: user.ageGroup?.getValue(),
            nationality: user.nationality?.getValue(),
            employmentSector: user.employmentSector?.getValue(),
            emailVerified: user.emailVerified,
            mobileVerified: user.mobileVerified,
        };
    }
}