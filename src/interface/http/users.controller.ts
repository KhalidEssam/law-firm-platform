import {
    Body,
    Controller,
    Post,
    Get,
    Patch,
    UseGuards,
    Req,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../core/application/use-cases/create-user.use-case';
import { SyncAuth0UserUseCase } from '../../core/application/use-cases/sync-auth0-user.use-case';
import { UpdateUserProfileUseCase } from '../../core/application/use-cases/update-user-profile.usecase';
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
}
