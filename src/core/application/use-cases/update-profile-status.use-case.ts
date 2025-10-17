import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../domain/user/entities/user.entity';
import type { IUserRepository } from '../../domain/user/ports/user.repository';


export interface UpdateProfileStatusCommand {
    userId: string;
    status: 'pending' | 'active' | 'suspended' | 'inactive';
}

@Injectable()
export class UpdateProfileStatusUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: UpdateProfileStatusCommand): Promise<User> {
        const user = await this.userRepository.findById(command.userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${command.userId} not found`);
        }

        return await this.userRepository.updateProfileStatus(command.userId, command.status);
    }
}