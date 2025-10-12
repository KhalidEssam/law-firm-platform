export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly username: string,
        public readonly auth0Id?: string,
        public readonly fullName?: string,
        public readonly gender?: string,
        public readonly city?: string,
        public readonly emailVerified: boolean = false,
        public readonly mobileVerified: boolean = false,
    ) { }

    static create(props: Omit<User, 'id'>): User {
        return new User(
            crypto.randomUUID(),
            props.email,
            props.username,
            props.auth0Id,
            props.fullName,
            props.gender,
            props.city,
            props.emailVerified,
            props.mobileVerified,
        );
    }
}
