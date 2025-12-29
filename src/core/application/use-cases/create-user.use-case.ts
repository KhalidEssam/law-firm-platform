import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { User } from '../../domain/user/entities/user.entity';
import { type IUserRepository } from '../../domain/user/ports/user.repository';
// Auth0Service import removed - unused
import { Email } from '../../domain/user/value-objects/email.vo';
import { City } from '../../domain/user/value-objects/city.vo';
import { Username } from '../../domain/user/value-objects/username.vo';

export interface CreateUserCommand {
  email: string;
  username: string;
  password?: string; // Optional if using Auth0
  auth0Id?: string;
  fullName?: string;
  gender?: string;
  city?: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(command.email);
    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const usernameExists = await this.userRepository.usernameExists(
      command.username,
    );
    if (usernameExists) {
      throw new ConflictException('Username already exists');
    }

    // Create user entity
    const user = User.create({
      email: Email.create(command.email),
      username: Username.create(command.username),
      auth0Id: command.auth0Id,
      fullName: command.fullName,
      gender: command.gender,
      city: command.city ? City.create(command.city) : undefined,
      emailVerified: false,
      mobileVerified: false,
    });

    return await this.userRepository.create(user);
  }
}
