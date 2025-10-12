import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { CreateUserUseCase } from '../../core/application/use-cases/create-user.use-case';
import { SyncAuth0UserUseCase } from '../../core/application/use-cases/sync-auth0-user.use-case';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard) // apply globally to all routes in this controller if you want


@Controller('users')
export class UsersController {
    constructor(private readonly createUserUseCase: CreateUserUseCase,
        private readonly syncUserUseCase: SyncAuth0UserUseCase
    ) { }

    @Post()
    async create(@Body() body: any) {
        const user = await this.createUserUseCase.execute(body);
        return { message: 'User created successfully', user };
    }

    @Roles('system admin') // must have one of these roles
    // @Permissions('read:users') // must also have this permission

    @Get('me')
    async getProfile(@Req() req: any) {
        const auth0User = req.user; // comes from JwtStrategy.validate()
        const user = await this.syncUserUseCase.execute(auth0User);
        return { message: 'User profile synced successfully', user };
    }
}
