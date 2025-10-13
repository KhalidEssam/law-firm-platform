import { IUserRepository } from '../../../core/domain/user/user.repository';
import { City } from '../../../core/domain/user/value-objects/city.vo';

interface UpdateUserProfileDTO {
    auth0Id: string;
    fullName?: string;
    gender?: string;
    city?: string;
}

export class UpdateUserProfileUseCase {
    constructor(private readonly userRepo: IUserRepository) { }

    async execute(dto: UpdateUserProfileDTO) {
        const user = await this.userRepo.findByAuth0Id(dto.auth0Id);
        if (!user) throw new Error('User not found');

        const updatedUser = user.updateProfile({
            fullName: dto.fullName,
            gender: dto.gender,
            city: dto.city ? City.create(dto.city) : undefined,
        });

        return await this.userRepo.update(updatedUser);
    }
}
