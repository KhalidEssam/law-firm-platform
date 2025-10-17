// ============================================
// 6. LIST USERS USE CASE (Enhanced)
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/user/entities/user.entity';
import type { IUserRepository } from '../../domain/user/ports/user.repository';

export interface ListUsersQuery {
    limit?: number;
    offset?: number;
    emailVerified?: boolean;
    mobileVerified?: boolean;
    gender?: string;
    city?: string;
    nationality?: string;
    ageGroup?: string;
}

export interface ListUsersResult {
    users: User[];
    total: number;
    limit: number;
    offset: number;
}

@Injectable()
export class ListUsersUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(query: ListUsersQuery): Promise<ListUsersResult> {
        const [users, total] = await Promise.all([
            this.userRepository.list(query),
            this.userRepository.count(query),
        ]);

        return {
            users,
            total,
            limit: query.limit || 10,
            offset: query.offset || 0,
        };
    }
}