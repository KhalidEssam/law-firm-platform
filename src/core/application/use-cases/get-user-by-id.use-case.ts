import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/user/user.entity';
import type { IUserRepository } from '../ports/user.repository';

@Injectable()
export class GetUserByIdUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository
    ) { }

    async execute(id: string): Promise<User | null> {
        const user = await this.userRepository.findById(id);
        return user;
    }
}