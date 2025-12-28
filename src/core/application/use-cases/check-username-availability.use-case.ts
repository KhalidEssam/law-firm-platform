import { Injectable, Inject } from '@nestjs/common';
import { type IUserRepository } from '../../domain/user/ports/user.repository';

@Injectable()
export class CheckUsernameAvailabilityUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(username: string): Promise<boolean> {
    return !(await this.userRepository.usernameExists(username));
  }
}
