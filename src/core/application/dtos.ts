// // ============================================
// // PROVIDER PROFILE DTOs
// // application/dtos/provider-profile/
// // ============================================

// import { IsString, IsOptional, IsEmail, IsUrl, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

// export class CreateProviderProfileDto {
//     @IsString()
//     @IsNotEmpty()
//     userId: string;

//     @IsString()
//     @IsNotEmpty()
//     @MinLength(2)
//     @MaxLength(200)
//     organizationName: string;

//     @IsOptional()
//     @IsString()
//     @MaxLength(200)
//     organizationNameAr?: string;

//     @IsString()
//     @IsNotEmpty()
//     licenseNumber: string;

//     @IsOptional()
//     @IsString()
//     taxNumber?: string;

//     @IsOptional()
//     @IsString()
//     @MaxLength(1000)
//     description?: string;

//     @IsOptional()
//     @IsString()
//     @MaxLength(1000)
//     descriptionAr?: string;

//     @IsOptional()
//     @IsEmail()
//     businessEmail?: string;

//     @IsOptional()
//     @IsString()
//     businessPhone?: string;

//     @IsOptional()
//     @IsUrl()
//     website?: string;
// }

// export class UpdateProviderProfileDto {
//     @IsOptional()
//     @IsString()
//     @MaxLength(1000)
//     description?: string;

//     @IsOptional()
//     @IsString()
//     @MaxLength(1000)
//     descriptionAr?: string;

//     @IsOptional()
//     @IsEmail()
//     businessEmail?: string;

//     @IsOptional()
//     @IsString()
//     businessPhone?: string;

//     @IsOptional()
//     @IsUrl()
//     website?: string;
// }

// // ============================================
// // PROVIDER USER DTOs
// // application/dtos/provider-user/
// // ============================================

// import { IsString, IsOptional, IsArray, IsNotEmpty, IsIn, IsBoolean } from 'class-validator';

// export class CreateProviderUserDto {
//     @IsString()
//     @IsNotEmpty()
//     providerId: string;

//     @IsString()
//     @IsNotEmpty()
//     userId: string;

//     @IsString()
//     @IsNotEmpty()
//     @IsIn(['account_manager', 'lawyer', 'assistant'])
//     role: string;

//     @IsOptional()
//     @IsArray()
//     @IsString({ each: true })
//     specializations?: string[];
// }

// export class UpdateProviderUserDto {
//     @IsOptional()
//     @IsArray()
//     @IsString({ each: true })
//     specializations?: string[];

//     @IsOptional()
//     @IsBoolean()
//     canAcceptRequests?: boolean;
// }

// // ============================================
// // PROVIDER SERVICE DTOs
// // application/dtos/provider-service/
// // ============================================

// import { IsString, IsOptional, IsNotEmpty, IsIn, IsNumber, IsPositive, Min, ValidateNested } from 'class-validator';
// import { Type } from 'class-transformer';

// export class PricingDto {
//     @IsOptional()
//     @IsNumber()
//     @IsPositive()
//     amount?: number;

//     @IsOptional()
//     @IsString()
//     @MinLength(3)
//     @MaxLength(3)
//     currency?: string;

//     @IsOptional()
//     @IsString()
//     @IsIn(['fixed', 'hourly', 'range'])
//     type?: string;

//     @IsOptional()
//     @IsNumber()
//     @Min(0)
//     minAmount?: number;

//     @IsOptional()
//     @IsNumber()
//     @Min(0)
//     maxAmount?: number;
// }

// export class CreateProviderServiceDto {
//     @IsString()
//     @IsNotEmpty()
//     providerId: string;

//     @IsString()
//     @IsNotEmpty()
//     @IsIn(['consultation', 'legal_opinion', 'litigation', 'specific_service'])
//     serviceType: string;

//     @IsOptional()
//     @IsString()
//     category?: string;

//     @IsOptional()
//     @ValidateNested()
//     @Type(() => PricingDto)
//     pricing?: PricingDto;
// }

// export class UpdateProviderServiceDto {
//     @IsOptional()
//     @ValidateNested()
//     @Type(() => PricingDto)
//     pricing?: PricingDto;

//     @IsOptional()
//     @IsBoolean()
//     isActive?: boolean;
// }

// // ============================================
// // PROVIDER SCHEDULE DTOs
// // application/dtos/provider-schedule/
// // ============================================

// import { IsString, IsNotEmpty, IsNumber, Min, Max, Matches, IsBoolean, IsOptional } from 'class-validator';

// export class CreateProviderScheduleDto {
//     @IsString()
//     @IsNotEmpty()
//     providerId: string;

//     @IsNumber()
//     @Min(0)
//     @Max(6)
//     dayOfWeek: number;

//     @IsString()
//     @IsNotEmpty()
//     @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
//         message: 'startTime must be in HH:mm format',
//     })
//     startTime: string;

//     @IsString()
//     @IsNotEmpty()
//     @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
//         message: 'endTime must be in HH:mm format',
//     })
//     endTime: string;
// }

// export class UpdateProviderScheduleDto {
//     @IsOptional()
//     @IsString()
//     @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
//         message: 'startTime must be in HH:mm format',
//     })
//     startTime?: string;

//     @IsOptional()
//     @IsString()
//     @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
//         message: 'endTime must be in HH:mm format',
//     })
//     endTime?: string;

//     @IsOptional()
//     @IsBoolean()
//     isAvailable?: boolean;
// }

// // ============================================
// // QUERY DTOs (for filtering and pagination)
// // application/dtos/common/
// // ============================================

// import { IsOptional, IsString, IsBoolean, IsNumber, Min } from 'class-validator';
// import { Type } from 'class-transformer';

// export class PaginationDto {
//     @IsOptional()
//     @Type(() => Number)
//     @IsNumber()
//     @Min(0)
//     offset?: number = 0;

//     @IsOptional()
//     @Type(() => Number)
//     @IsNumber()
//     @Min(1)
//     limit?: number = 10;
// }

// export class ListProviderProfilesDto extends PaginationDto {
//     @IsOptional()
//     @IsString()
//     @IsIn(['pending', 'approved', 'rejected', 'suspended'])
//     verificationStatus?: string;

//     @IsOptional()
//     @Type(() => Boolean)
//     @IsBoolean()
//     isActive?: boolean;
// }

// export class ListProviderUsersDto extends PaginationDto {
//     @IsOptional()
//     @Type(() => Boolean)
//     @IsBoolean()
//     isActive?: boolean;

//     @IsOptional()
//     @Type(() => Boolean)
//     @IsBoolean()
//     canAcceptRequests?: boolean;
// }

// export class ListProviderServicesDto extends PaginationDto {
//     @IsOptional()
//     @IsString()
//     @IsIn(['consultation', 'legal_opinion', 'litigation', 'specific_service'])
//     serviceType?: string;

//     @IsOptional()
//     @IsString()
//     category?: string;

//     @IsOptional()
//     @Type(() => Boolean)
//     @IsBoolean()
//     isActive?: boolean;
// }

// export class ListProviderSchedulesDto {
//     @IsOptional()
//     @Type(() => Number)
//     @IsNumber()
//     @Min(0)
//     @Max(6)
//     dayOfWeek?: number;

//     @IsOptional()
//     @Type(() => Boolean)
//     @IsBoolean()
//     isAvailable?: boolean;
// }

// // ============================================
// // RESPONSE DTOs (for consistent API responses)
// // application/dtos/responses/
// // ============================================

// export class ProviderProfileResponseDto {
//     id: string;
//     userId: string;
//     organizationName: string;
//     organizationNameAr?: string;
//     licenseNumber: string;
//     taxNumber?: string;
//     description?: string;
//     descriptionAr?: string;
//     verificationStatus: string;
//     isActive: boolean;
//     businessEmail?: string;
//     businessPhone?: string;
//     website?: string;
//     createdAt: Date;
//     updatedAt: Date;
// }

// export class ProviderUserResponseDto {
//     id: string;
//     providerId: string;
//     userId: string;
//     role: string;
//     specializations: string[];
//     isActive: boolean;
//     canAcceptRequests: boolean;
//     createdAt: Date;
//     updatedAt: Date;
// }

// export class ProviderServiceResponseDto {
//     id: string;
//     providerId: string;
//     serviceType: string;
//     category?: string;
//     isActive: boolean;
//     pricing?: {
//         amount?: number;
//         currency?: string;
//         type?: string;
//         minAmount?: number;
//         maxAmount?: number;
//     };
//     createdAt: Date;
//     updatedAt: Date;
// }

// export class ProviderScheduleResponseDto {
//     id: string;
//     providerId: string;
//     dayOfWeek: number;
//     startTime: string;
//     endTime: string;
//     isAvailable: boolean;
//     createdAt: Date;
//     updatedAt: Date;
// }

// export class PaginatedResponseDto<T> {
//     data: T[];
//     total: number;
//     limit: number;
//     offset: number;
// }

// // ============================================
// // INDEX FILE (exports all DTOs)
// // application/dtos/index.ts
// // ============================================

// export * from './provider-profile/CreateProviderProfileDto';
// export * from './provider-profile/UpdateProviderProfileDto';
// export * from './provider-user/CreateProviderUserDto';
// export * from './provider-user/UpdateProviderUserDto';
// export * from './provider-service/CreateProviderServiceDto';
// export * from './provider-service/UpdateProviderServiceDto';
// export * from './provider-schedule/CreateProviderScheduleDto';
// export * from './provider-schedule/UpdateProviderScheduleDto';
// export * from './common/PaginationDto';
// export * from './common/ListProviderProfilesDto';
// export * from './common/ListProviderUsersDto';
// export * from './common/ListProviderServicesDto';
// export * from './common/ListProviderSchedulesDto';
// export * from './responses/ProviderProfileResponseDto';
// export * from './responses/ProviderUserResponseDto';
// export * from './responses/ProviderServiceResponseDto';
// export * from './responses/ProviderScheduleResponseDto';
// export * from './responses/PaginatedResponseDto';