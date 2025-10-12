import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaUserRepository } from '../persistence/user/user.repository.prisma';
import { Auth0Service } from '../persistence/auth0/auth0.service';
import { CreateUserUseCase } from '../../core/application/use-cases/create-user.use-case';
import { SyncAuth0UserUseCase } from '../../core/application/use-cases/sync-auth0-user.use-case'; // ✅ ADD THIS
import { UsersController } from '../../interface/http/users.controller';

@Module({
    controllers: [UsersController],
    providers: [
        PrismaService,
        Auth0Service,
        CreateUserUseCase,
        SyncAuth0UserUseCase,
        { provide: 'IUserRepository', useClass: PrismaUserRepository },
    ],
    exports: [SyncAuth0UserUseCase], // optional — only if other modules need it
})
export class UserModule { }
