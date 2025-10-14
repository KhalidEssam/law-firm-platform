import {
    Body,
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../core/application/use-cases/create-user.use-case';
import { SyncAuth0UserUseCase } from '../../core/application/use-cases/sync-auth0-user.use-case';
import { UpdateUserProfileUseCase } from '../../core/application/use-cases/update-user-profile.usecase';
import { GetUserByIdUseCase } from '../../core/application/use-cases/get-user-by-id.use-case';
import { GetAllUsersUseCase } from '../../core/application/use-cases/get-all-users.use-case';
import { DeleteUserUseCase } from '../../core/application/use-cases/delete-user.use-case';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly syncUserUseCase: SyncAuth0UserUseCase,
        private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
        private readonly getUserByIdUseCase: GetUserByIdUseCase,
        private readonly getAllUsersUseCase: GetAllUsersUseCase,
        private readonly deleteUserUseCase: DeleteUserUseCase,
    ) { }

    // 📦 Create a new user
    @Post()
    async create(@Body() body: any) {
        const user = await this.createUserUseCase.execute(body);
        return { message: 'User created successfully', user };
    }

    // 👤 Sync current Auth0 user profile (usually used on login)
    @Roles('system admin')
    @Permissions('read:users')
    @Get('me')
    async getProfile(@Req() req: any) {
        const auth0User = req.user; // comes from JwtStrategy.validate()
        const user = await this.syncUserUseCase.execute(auth0User);
        return { message: 'User profile synced successfully', user };
    }

    // ✏️ Update profile info (for the currently authenticated user)
    @Patch('me')
    async updateProfile(@Req() req: any, @Body() body: any) {
        const auth0Id = req.user.sub; // comes from JWT token payload (Auth0)
        const updatedUser = await this.updateUserProfileUseCase.execute({
            auth0Id,
            ...body,
        });
        return { message: 'Profile updated successfully', user: updatedUser };
    }

    // 🧑‍💼 Admins can update any user by their Auth0 ID (optional endpoint)
    @Roles('system admin')
    @Permissions('update:users')
    @Patch(':auth0Id')
    async adminUpdateUser(@Body() body: any, @Req() req: any) {
        const updatedUser = await this.updateUserProfileUseCase.execute(body);
        return { message: 'User updated successfully by admin', user: updatedUser };
    }

    // 📋 Get a list of all users with optional filtering and pagination
    @Roles('system admin')
    @Permissions('read:users')
    @Get()
    async getAllUsers(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('ageGroup') ageGroup?: string,
        @Query('employmentSector') employmentSector?: string,
        @Query('nationality') nationality?: string,
        @Query('profession') profession?: string,
    ) {
        const result = await this.getAllUsersUseCase.execute(
            {
                ageGroup,
                employmentSector,
                nationality,
                profession,
            },
            {
                page: page ? parseInt(page.toString(), 10) : undefined,
                limit: limit ? parseInt(limit.toString(), 10) : undefined,
            },
        );
        return { message: 'Users retrieved successfully', ...result };
    }

    // 🔍 Get a specific user by ID
    @Roles('system admin')
    @Permissions('read:users')
    @Get(':id')
    async getUserById(@Param('id') id: string) {
        const user = await this.getUserByIdUseCase.execute(id);
        return { message: 'User retrieved successfully', user };
    }

    // 🗑️ Delete a user
    @Roles('system admin')
    @Permissions('delete:users')
    @Delete(':id')
    async deleteUser(@Param('id') id: string) {
        await this.deleteUserUseCase.execute(id);
        return { message: 'User deleted successfully' };
    }
}
