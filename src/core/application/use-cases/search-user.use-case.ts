import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/user/entities/user.entity';
import type { IUserRepository } from '../../domain/user/ports/user.repository';

export interface SearchUsersQuery {
  query: string;
  fields?: ('email' | 'username' | 'fullName')[];
  limit?: number;
  offset?: number;
}

@Injectable()
export class SearchUsersUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: SearchUsersQuery): Promise<User[]> {
    return await this.userRepository.search(query.query, {
      fields: query.fields,
      limit: query.limit,
      offset: query.offset,
    });
  }
}
