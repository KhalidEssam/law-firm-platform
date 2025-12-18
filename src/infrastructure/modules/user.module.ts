import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaUserRepository } from '../persistence/user/prisma-user.repository';
import { PrismaOtpRepository } from '../persistence/user/prisma-otp.repository';
import { Auth0Service } from '../persistence/auth0/auth0.service';
import { WhatsAppService } from '../services/whatsapp/whatsapp.service';
import { CreateUserUseCase } from '../../core/application/use-cases/create-user.use-case';
import { SyncAuth0UserUseCase } from '../../core/application/use-cases/sync-auth0-user.use-case';
import { UserController } from '../../interface/http/users.controller';
import { UpdateUserProfileUseCase } from '../../core/application/use-cases/update-user-profile.usecase';
import { GetUserByIdUseCase } from '../../core/application/use-cases/get-user-by-id.use-case';
import { ListUsersUseCase } from '../../core/application/use-cases/get-all-users.use-case';
import { DeleteUserUseCase } from '../../core/application/use-cases/delete-user.use-case';
// import { HardDeleteUserUseCase } from '../../core/application/use-cases/hard-delete-user.use-case';

import { GetUserByEmailUseCase } from 'src/core/application/use-cases/get-user-by-email.use-case';
import { GetUserByUsernameUseCase } from 'src/core/application/use-cases/get-user-by-username.use-case';
import { GetUserByAuth0IdUseCase } from 'src/core/application/use-cases/get-user-by-auth0.use-case';
import { VerifyEmailUseCase } from 'src/core/application/use-cases/verify-email.use-case';
import { VerifyMobileUseCase } from 'src/core/application/use-cases/verify-mobile.use-case';
import { UpdateProfileStatusUseCase } from 'src/core/application/use-cases/update-profile-status.use-case';
import { RestoreUserUseCase } from 'src/core/application/use-cases/restore-user.use-case';
import { SearchUsersUseCase } from 'src/core/application/use-cases/search-user.use-case';
import { CheckEmailAvailabilityUseCase } from 'src/core/application/use-cases/check-email-availability.use-case';
import { CheckUsernameAvailabilityUseCase } from 'src/core/application/use-cases/check-username-availability.use-case';
import { SendMobileOtpUseCase } from 'src/core/application/use-cases/send-mobile-otp.use-case';
import { VerifyMobileOtpUseCase } from 'src/core/application/use-cases/verify-mobile-otp.use-case';
import {
    GetUserIdentitiesUseCase,
    SetPrimaryIdentityUseCase,
    UnlinkIdentityUseCase,
} from 'src/core/application/use-cases/user-identities.use-case';
@Module({
    controllers: [UserController],
    providers: [
        // Infrastructure dependencies
        PrismaService,
        Auth0Service,
        { provide: 'IUserRepository', useClass: PrismaUserRepository },
        { provide: 'IOtpRepository', useClass: PrismaOtpRepository },
        { provide: 'IWhatsAppService', useClass: WhatsAppService },

        // Use Cases
        CreateUserUseCase,
        GetUserByIdUseCase,
        GetUserByEmailUseCase,
        GetUserByUsernameUseCase,
        GetUserByAuth0IdUseCase,
        ListUsersUseCase,
        UpdateUserProfileUseCase,
        VerifyEmailUseCase,
        VerifyMobileUseCase,
        UpdateProfileStatusUseCase,
        DeleteUserUseCase,
        RestoreUserUseCase,
        SearchUsersUseCase,
        SyncAuth0UserUseCase,
        CheckEmailAvailabilityUseCase,
        CheckUsernameAvailabilityUseCase,

        // Identity Management Use Cases
        GetUserIdentitiesUseCase,
        SetPrimaryIdentityUseCase,
        UnlinkIdentityUseCase,

        // Mobile OTP Use Cases
        SendMobileOtpUseCase,
        VerifyMobileOtpUseCase,
    ],
    exports: [
        'IUserRepository',
        'IOtpRepository',
        'IWhatsAppService',
        GetUserByIdUseCase,
        GetUserByAuth0IdUseCase,
        SyncAuth0UserUseCase,
    ],
})
export class UserModule { }
