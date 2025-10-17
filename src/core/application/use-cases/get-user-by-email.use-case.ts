import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { User } from '../../domain/user/entities/user.entity';
import type { IUserRepository } from '../../domain/user/ports/user.repository';


@Injectable()
export class GetUserByEmailUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(email: string): Promise<User> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        return user;
    }
}