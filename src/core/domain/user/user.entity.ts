import crypto from 'crypto';
import { Email } from './value-objects/email.vo';
import { Username } from './value-objects/username.vo';
import { City } from './value-objects/city.vo';

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
        );
    }

    // ✅ Domain-safe immutable update
    updateProfile(data: {
        fullName?: string;
        gender?: string;
        city?: City;
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
        );
    }
}
