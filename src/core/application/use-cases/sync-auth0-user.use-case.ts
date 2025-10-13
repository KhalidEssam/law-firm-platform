import { Injectable, Inject } from '@nestjs/common';
import { type IUserRepository } from '../ports/user.repository';
import { User } from '../../domain/user/user.entity';


@Injectable()
export class SyncAuth0UserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(decodedToken: any): Promise<User> {
        const auth0Id = decodedToken.sub;
        const email = decodedToken.email;
        const username = decodedToken.nickname || decodedToken.name || decodedToken.email;

        // Check if user already exists locally
        const existing = await this.userRepository.findByAuth0Id(auth0Id);
        if (existing) return existing;

        // Create new local user
        const user = User.create({
            auth0Id,
            email,
            username,
            fullName: decodedToken.name || undefined,
            emailVerified: decodedToken.email_verified || false,
            mobileVerified: false,
        });

        return this.userRepository.create(user);
    }
}
