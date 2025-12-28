import { type IUserRepository } from '../../domain/user/ports/user.repository';
import { City } from '../../../core/domain/user/value-objects/city.vo';
import { Biography } from '../../../core/domain/user/value-objects/biography.vo';
import { Profession } from '../../../core/domain/user/value-objects/profession.vo';
import { UserPhoto } from '../../../core/domain/user/value-objects/user-photo.vo';
import { UserAgeGroup } from '../../../core/domain/user/value-objects/age-group.vo';
import { Nationality } from '../../../core/domain/user/value-objects/nationality.vo';
import { UserEmploymentSector } from '../../../core/domain/user/value-objects/employment-sector.vo';
import { User } from '../../../core/domain/user/entities/user.entity';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';

export interface UpdateUserProfileCommand {
  userId: string;
  fullName?: string;
  gender?: string;
  city?: string;
  biography?: string;
  profession?: string;
  photo?: string;
  ageGroup?: string;
  nationality?: string;
  employmentSector?: string;
}

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${command.userId} not found`);
    }

    const updatedUser = user.updateProfile({
      fullName: command.fullName,
      gender: command.gender,
      city: command.city ? City.create(command.city) : undefined,
      biography: command.biography
        ? Biography.create(command.biography)
        : undefined,
      profession: command.profession
        ? Profession.create(command.profession)
        : undefined,
      photo: command.photo ? UserPhoto.create(command.photo) : undefined,
      ageGroup: command.ageGroup
        ? UserAgeGroup.create(command.ageGroup)
        : undefined,
      nationality: command.nationality
        ? Nationality.create(command.nationality)
        : undefined,
      employmentSector: command.employmentSector
        ? UserEmploymentSector.create(command.employmentSector)
        : undefined,
    });

    return await this.userRepository.update(updatedUser);
  }
}
