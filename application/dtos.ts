import { IsString, IsOptional, IsEmail, IsUrl, IsNotEmpty, MinLength, MaxLength, Matches, IsEnum } from 'class-validator';

export class CreateProviderProfileDtos {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(200)
    organizationName: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    organizationNameAr?: string;

    @IsString()
    @IsNotEmpty()
    licenseNumber: string;

    @IsOptional()
    @IsString()
    taxNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    descriptionAr?: string;

    @IsOptional()
    @IsEmail()
    businessEmail?: string;

    @IsOptional()
    @IsString()
    businessPhone?: string;

    @IsOptional()
    @IsUrl()
    website?: string;
}

export class UpdateProviderProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    descriptionAr?: string;

    @IsOptional()
    @IsEmail()
    businessEmail?: string;

    @IsOptional()
    @IsString()
    businessPhone?: string;

    @IsOptional()
    @IsUrl()
    website?: string;
}



// ============================================
// USER DTOs
// presentation/http/dtos/user/
// ============================================

import { Type } from 'class-transformer';

// ============================================
// CREATE USER DTO
// ============================================

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_-]+$/, {
        message: 'Username can only contain letters, numbers, underscores, and hyphens',
    })
    username: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @IsOptional()
    @IsString()
    auth0Id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    fullName?: string;

    @IsOptional()
    @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
    gender?: string;

    @IsOptional()
    @IsString()
    city?: string;
}

// ============================================
// UPDATE USER PROFILE DTO
// ============================================

export class UpdateUserProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    fullName?: string;

    @IsOptional()
    @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
    gender?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    biography?: string;

    @IsOptional()
    @IsString()
    profession?: string;

    @IsOptional()
    @IsString()
    photo?: string;

    @IsOptional()
    @IsEnum(['18-24', '25-34', '35-44', '45-54', '55-64', '65+'])
    ageGroup?: string;

    @IsOptional()
    @IsString()
    nationality?: string;

    @IsOptional()
    @IsEnum(['public', 'private', 'self_employed', 'unemployed', 'student', 'retired'])
    employmentSector?: string;
}

// ============================================
// UPDATE PROFILE STATUS DTO
// ============================================

export class UpdateProfileStatusDto {
    @IsEnum(['pending', 'active', 'suspended', 'inactive'])
    status: 'pending' | 'active' | 'suspended' | 'inactive';
}

// ============================================
// LIST USERS QUERY DTO
// ============================================

export class ListUsersQueryDto {
    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @Type(() => Number)
    offset?: number = 0;

    @IsOptional()
    @Type(() => Boolean)
    emailVerified?: boolean;

    @IsOptional()
    @Type(() => Boolean)
    mobileVerified?: boolean;

    @IsOptional()
    @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
    gender?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    nationality?: string;

    @IsOptional()
    @IsEnum(['18-24', '25-34', '35-44', '45-54', '55-64', '65+'])
    ageGroup?: string;
}

// ============================================
// SEARCH USERS QUERY DTO
// ============================================

export class SearchUsersQueryDto {
    @IsString()
    @MinLength(2)
    query: string;

    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @Type(() => Number)
    offset?: number = 0;

    @IsOptional()
    @IsEnum(['email', 'username', 'fullName'], { each: true })
    fields?: ('email' | 'username' | 'fullName')[];
}

// ============================================
// CHECK AVAILABILITY DTO
// ============================================

export class CheckEmailDto {
    @IsEmail()
    email: string;
}

export class CheckUsernameDto {
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    username: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class UserResponseDto {
    id: string;
    email: string;
    username: string;
    auth0Id?: string;
    fullName?: string;
    gender?: string;
    city?: string;
    biography?: string;
    profession?: string;
    photo?: string;
    ageGroup?: string;
    nationality?: string;
    employmentSector?: string;
    emailVerified: boolean;
    mobileVerified: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class ListUsersResponseDto {
    users: UserResponseDto[];
    total: number;
    limit: number;
    offset: number;
}

export class AvailabilityResponseDto {
    available: boolean;
}