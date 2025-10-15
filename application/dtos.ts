import { IsString, IsOptional, IsEmail, IsUrl, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

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