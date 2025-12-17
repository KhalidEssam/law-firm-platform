import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { Auth0Module } from '../persistence/auth0/auth0.module';
import { AdminRolesController } from '../../interface/http/admin-roles.controller';
import {
    AssignUserRoleUseCase,
    RemoveUserRoleUseCase,
    GetUserRolesUseCase,
    ListRolesUseCase,
    ListPermissionsUseCase,
    GetRolePermissionsUseCase,
    SyncUserRolesFromAuth0UseCase,
    GetUsersByRoleUseCase,
} from '../../core/application/use-cases/user-role-management.use-case';
import { NotificationModule } from '../../interface/notification/notification.module';

@Module({
    imports: [PrismaModule, Auth0Module, NotificationModule],
    controllers: [AdminRolesController],
    providers: [
        // Use Cases
        AssignUserRoleUseCase,
        RemoveUserRoleUseCase,
        GetUserRolesUseCase,
        ListRolesUseCase,
        ListPermissionsUseCase,
        GetRolePermissionsUseCase,
        SyncUserRolesFromAuth0UseCase,
        GetUsersByRoleUseCase,
    ],
    exports: [
        AssignUserRoleUseCase,
        RemoveUserRoleUseCase,
        GetUserRolesUseCase,
        ListRolesUseCase,
    ],
})
export class AdminRolesModule {}
