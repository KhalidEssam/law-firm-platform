import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaUserRepository } from '../persistence/user/prisma-user.repository';
import { Auth0Service } from '../persistence/auth0/auth0.service';
import { CreateUserUseCase } from '../../core/application/use-cases/create-user.use-case';
import { SyncAuth0UserUseCase } from '../../core/application/use-cases/sync-auth0-user.use-case';
import { UsersController } from '../../interface/http/users.controller';
import { UpdateUserProfileUseCase } from '../../core/application/use-cases/update-user-profile.usecase';
import { GetUserByIdUseCase } from '../../core/application/use-cases/get-user-by-id.use-case';
import { GetAllUsersUseCase } from '../../core/application/use-cases/get-all-users.use-case';
import { DeleteUserUseCase } from '../../core/application/use-cases/delete-user.use-case';

@Module({
    controllers: [UsersController],
    providers: [
        // Infrastructure dependencies
        PrismaService,
        Auth0Service,
        { provide: 'IUserRepository', useClass: PrismaUserRepository },

        // Use cases in the same order as controller constructor
        CreateUserUseCase,
        SyncAuth0UserUseCase,
        UpdateUserProfileUseCase,
        GetUserByIdUseCase,
        GetAllUsersUseCase,
        DeleteUserUseCase,
    ],
    exports: [SyncAuth0UserUseCase], // optional — only if other modules need it
})
export class UserModule { }
