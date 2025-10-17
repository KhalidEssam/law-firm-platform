import { Body, Controller, Post, Get, Patch, Delete, Param, Query, UseGuards, Req, HttpCode, HttpStatus, } from '@nestjs/common';
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


// ============================================
// USER CONTROLLER
// presentation/http/controllers/UserController.ts
// ============================================

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
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
    ) { }

    // ============================================
    // PUBLIC / REGISTRATION ENDPOINTS
    // ============================================

    /**
     * Create a new user (Registration)
     * Accessible by: Anyone (public endpoint - remove guards if needed)
     */
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
        const user = await this.syncAuth0User.execute({
            auth0Id: auth0User.sub,
            email: auth0User.email,
            username: auth0User.nickname || auth0User.name || auth0User.email,
            fullName: auth0User.name,
            emailVerified: auth0User.email_verified,
        });
        return {
            user: this.mapToResponse(user),
        };
    }

    /**
     * Update current user profile
     * Accessible by: user, partner, platform, system admin
     */
    @Patch('me')
    @Roles('user', 'partner', 'platform', 'system admin')
    async updateMyProfile(
        @Req() req: any,
        @Body() dto: UpdateUserProfileDto,
    ): Promise<{ user: UserResponseDto }> {
        const user = await this.getUserByAuth0Id.execute(req.user.sub);
        const updated = await this.updateUserProfile.execute({
            userId: user.id,
            ...dto,
        });
        return {
            user: this.mapToResponse(updated),
        };
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