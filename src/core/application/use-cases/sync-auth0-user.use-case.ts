import { Injectable, Inject } from '@nestjs/common';
import { type IUserRepository } from '../../domain/user/ports/user.repository';
import { User } from '../../domain/user/entities/user.entity';
import { Email } from 'src/core/domain/user/value-objects/email.vo';
import { Username } from 'src/core/domain/user/value-objects/username.vo';


export interface SyncAuth0UserCommand {
    auth0Id: string;
    email: string;
    username: string;
    fullName?: string;
    emailVerified?: boolean;
}

@Injectable()
export class SyncAuth0UserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: SyncAuth0UserCommand): Promise<User> {
        // Check if user already exists
        const existing = await this.userRepository.findByAuth0Id(command.auth0Id);
        if (existing) {
            return existing;
        }

        console.log('[SyncAuth0UserUseCase] Syncing user', command, command.auth0Id, command.email, command.username, command.fullName);
        // Create new user
        const user = User.create({
            auth0Id: command.auth0Id,
            email: Email.create(command.email),
            username: Username.create(command.username),
            fullName: command.fullName,
            emailVerified: command.emailVerified || false,
            mobileVerified: false,
        });

        return await this.userRepository.create(user);
    }
}