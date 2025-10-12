import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/user/user.entity';
import { type IUserRepository } from '../ports/user.repository';
import { Auth0Service } from '../../../infrastructure/persistence/auth0/auth0.service';

interface CreateUserCommand {
    email: string;
    password: string;
    username: string;
    fullName?: string;
    gender?: string;
    city?: string;
}

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        private readonly auth0Service: Auth0Service,
    ) { }

    async execute(command: CreateUserCommand): Promise<User> {
        const existing = await this.userRepository.findByEmail(command.email);
        if (existing) throw new Error('User already exists');

        // Create Auth0 user first
        const auth0User = await this.auth0Service.createUser(
            command.email,
            command.password,
            command.username,
        );

        // Map to domain entity
        const user = User.create({
            email: command.email,
            username: command.username,
            auth0Id: auth0User.user_id,
            fullName: command.fullName,
            gender: command.gender,
            city: command.city,
            emailVerified: false,
            mobileVerified: false,
        });

        return await this.userRepository.create(user);
    }
}
