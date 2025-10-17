// // core/application/ports/user.repository.ts
// // import { User } from '../../domain/user/entities/user.entity';

// export interface IUserFilters {
//     ageGroup?: string;
//     employmentSector?: string;
//     nationality?: string;
//     profession?: string;
// }

// export interface IPaginationOptions {
//     page?: number;
//     limit?: number;
// }

// export interface IPaginatedResult<T> {
//     items: T[];
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
// }

// // export interface IUserRepository {
// //     create(user: User): Promise<User>;
// //     findByEmail(email: string): Promise<User | null>;
// //     findByAuth0Id(auth0Id: string): Promise<User | null>;
// //     findById(id: string): Promise<User | null>;
// //     findAll(filters?: IUserFilters, pagination?: IPaginationOptions): Promise<IPaginatedResult<User>>;
// //     update(user: User): Promise<User>;
// //     delete(id: string): Promise<void>;
// // }
