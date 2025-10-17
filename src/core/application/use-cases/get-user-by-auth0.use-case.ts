
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { User } from '../../domain/user/entities/user.entity';
import type { IUserRepository } from '../../domain/user/ports/user.repository';


@Injectable()
export class GetUserByAuth0IdUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(auth0Id: string): Promise<User> {
        const user = await this.userRepository.findByAuth0Id(auth0Id);
        if (!user) {
            throw new NotFoundException(`User with Auth0 ID ${auth0Id} not found`);
        }
        return user;
    }
}