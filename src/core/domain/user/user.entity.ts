import crypto from 'crypto';
import { Email } from './value-objects/email.vo';
import { Username } from './value-objects/username.vo';
import { City } from './value-objects/city.vo';
import { Biography } from './value-objects/biography.vo';
import { Profession } from './value-objects/profession.vo';
import { UserPhoto } from './value-objects/user-photo.vo';
import { UserAgeGroup } from './value-objects/age-group.vo';
import { Nationality } from './value-objects/nationality.vo';
import { UserEmploymentSector } from './value-objects/employment-sector.vo';

export class User {
    constructor(
        public readonly id: string,
        public readonly email: Email,
        public readonly username: Username,
        public readonly auth0Id?: string,
        public readonly fullName?: string,
        public readonly gender?: string,
        public readonly city?: City,
        public readonly emailVerified: boolean = false,
        public readonly mobileVerified: boolean = false,
        public readonly biography?: Biography,
        public readonly profession?: Profession,
        public readonly photo?: UserPhoto,
        public readonly ageGroup?: UserAgeGroup,
        public readonly nationality?: Nationality,
        public readonly employmentSector?: UserEmploymentSector,
    ) { }

    // ✅ Factory method
    static create(props: {
        email: Email;
        username: Username;
        auth0Id?: string;
        fullName?: string;
        gender?: string;
        city?: City;
        emailVerified?: boolean;
        mobileVerified?: boolean;
        biography?: Biography;
        profession?: Profession;
        photo?: UserPhoto;
        ageGroup?: UserAgeGroup;
        nationality?: Nationality;
        employmentSector?: UserEmploymentSector;
    }): User {
        return new User(
            crypto.randomUUID(),
            props.email,
            props.username,
            props.auth0Id,
            props.fullName,
            props.gender,
            props.city,
            props.emailVerified ?? false,
            props.mobileVerified ?? false,
            props.biography,
            props.profession,
            props.photo,
            props.ageGroup,
            props.nationality,
            props.employmentSector,
        );
    }

    // ✅ Domain-safe immutable update
    updateProfile(data: {
        fullName?: string;
        gender?: string;
        city?: City;
        biography?: Biography;
        profession?: Profession;
        photo?: UserPhoto;
        ageGroup?: UserAgeGroup;
        nationality?: Nationality;
        employmentSector?: UserEmploymentSector;
    }): User {
        return new User(
            this.id,
            this.email,
            this.username,
            this.auth0Id,
            data.fullName ?? this.fullName,
            data.gender ?? this.gender,
            data.city ?? this.city,
            this.emailVerified,
            this.mobileVerified,
            data.biography ?? this.biography,
            data.profession ?? this.profession,
            data.photo ?? this.photo,
            data.ageGroup ?? this.ageGroup,
            data.nationality ?? this.nationality,
            data.employmentSector ?? this.employmentSector,
        );
    }
}
