import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/user/user.entity';
import { type IUserRepository } from '../ports/user.repository';
import { Auth0Service } from '../../../infrastructure/persistence/auth0/auth0.service';
import { Email } from 'src/core/domain/user/value-objects/email.vo';
import { City } from 'src/core/domain/user/value-objects/city.vo';
import { Username } from 'src/core/domain/user/value-objects/username.vo';

interface CreateUserCommand {
    email: Email;
    password: string;
    username: Username;
    fullName?: string;
    gender?: string;
    city?: City;
}

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        private readonly auth0Service: Auth0Service,
    ) { }

    async execute(command: CreateUserCommand): Promise<User> {
        // 🔍 Check if user exists
        const existing = await this.userRepository.findByEmail(command.email.getValue());
        if (existing) throw new Error('User already exists');

        // 🧩 Create user in Auth0
        const auth0User = await this.auth0Service.createUser(
            command.email.getValue(),
            command.password,
            command.username.getValue(),
        );

        // 🏗️ Create domain user (primitives)
        const user = User.create({
            auth0Id: auth0User.user_id,
            email: command.email,
            username: command.username,
            fullName: command.fullName,
            gender: command.gender,
            city: command.city,
            emailVerified: false,
            mobileVerified: false,
        });

        return this.userRepository.create(user);
    }
}
