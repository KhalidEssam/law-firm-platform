import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/user/user.entity';
import type { IUserRepository, IUserFilters, IPaginationOptions, IPaginatedResult } from '../ports/user.repository';

@Injectable()
export class GetAllUsersUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository
    ) { }

    async execute(filters?: IUserFilters, pagination?: IPaginationOptions): Promise<IPaginatedResult<User>> {
        return await this.userRepository.findAll(filters, pagination);
    }
}