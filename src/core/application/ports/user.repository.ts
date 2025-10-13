// core/application/ports/user.repository.ts
import { User } from '../../domain/user/user.entity';

export interface IUserRepository {
    create(user: User): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findByAuth0Id(auth0Id: string): Promise<User | null>;
    update(user: User): Promise<User>;
}
