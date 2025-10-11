import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [AuthModule], // imports AuthService & ROLE_PROVIDER through CoreModule
    controllers: [RolesController],
})
export class RolesModule { }
