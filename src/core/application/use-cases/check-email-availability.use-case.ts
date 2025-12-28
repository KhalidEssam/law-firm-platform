import { Injectable, Inject } from '@nestjs/common';
import { type IUserRepository } from '../../domain/user/ports/user.repository';

@Injectable()
export class CheckEmailAvailabilityUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(email: string): Promise<boolean> {
    return !(await this.userRepository.emailExists(email));
  }
}
