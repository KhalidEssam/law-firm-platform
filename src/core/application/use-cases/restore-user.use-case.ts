import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/user/entities/user.entity';
import type { IUserRepository } from '../../domain/user/ports/user.repository';


@Injectable()
export class RestoreUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(userId: string): Promise<User> {
        return await this.userRepository.restore(userId);
    }
}
