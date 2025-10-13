import { User } from './user.entity';

export interface IUserRepository {
    findByAuth0Id(auth0Id: string): Promise<User | null>;
    update(user: User): Promise<User>;
}
