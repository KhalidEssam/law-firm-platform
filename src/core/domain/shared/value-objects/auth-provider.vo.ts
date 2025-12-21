// ============================================
// AUTH PROVIDER VALUE OBJECT
// src/core/domain/shared/value-objects/auth-provider.vo.ts
// ============================================

/**
 * AuthProvider enum matching Prisma schema
 * Supports multiple login methods per user (Account Linking)
 */
export enum AuthProviderEnum {
    AUTH0 = 'auth0',                   // Username/password via Auth0
    GOOGLE_OAUTH2 = 'google_oauth2',   // Google OAuth
    FACEBOOK = 'facebook',             // Facebook OAuth
    APPLE = 'apple',                   // Apple Sign In
    MICROSOFT = 'microsoft',           // Microsoft OAuth
    TWITTER = 'twitter',               // Twitter/X OAuth
    GITHUB = 'github',                 // GitHub OAuth
    LINKEDIN = 'linkedin',             // LinkedIn OAuth
    PHONE = 'phone',                   // Phone/SMS passwordless
    EMAIL = 'email',                   // Email passwordless (magic link)
}

/**
 * AuthProvider Value Object
 * Represents an authentication provider/method
 */
export class AuthProvider {
    private static readonly validProviders = Object.values(AuthProviderEnum);

    private constructor(private readonly value: AuthProviderEnum) {}

    static create(value: string): AuthProvider {
        const normalizedValue = value.toLowerCase() as AuthProviderEnum;
        if (!AuthProvider.validProviders.includes(normalizedValue)) {
            throw new Error(
                `Invalid auth provider: ${value}. Must be one of: ${AuthProvider.validProviders.join(', ')}`
            );
        }
        return new AuthProvider(normalizedValue);
    }

    static auth0(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.AUTH0);
    }

    static googleOAuth2(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.GOOGLE_OAUTH2);
    }

    static facebook(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.FACEBOOK);
    }

    static apple(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.APPLE);
    }

    static microsoft(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.MICROSOFT);
    }

    static twitter(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.TWITTER);
    }

    static github(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.GITHUB);
    }

    static linkedin(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.LINKEDIN);
    }

    static phone(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.PHONE);
    }

    static email(): AuthProvider {
        return new AuthProvider(AuthProviderEnum.EMAIL);
    }

    getValue(): AuthProviderEnum {
        return this.value;
    }

    // Provider type checks
    isAuth0(): boolean {
        return this.value === AuthProviderEnum.AUTH0;
    }

    isGoogleOAuth2(): boolean {
        return this.value === AuthProviderEnum.GOOGLE_OAUTH2;
    }

    isFacebook(): boolean {
        return this.value === AuthProviderEnum.FACEBOOK;
    }

    isApple(): boolean {
        return this.value === AuthProviderEnum.APPLE;
    }

    isMicrosoft(): boolean {
        return this.value === AuthProviderEnum.MICROSOFT;
    }

    isTwitter(): boolean {
        return this.value === AuthProviderEnum.TWITTER;
    }

    isGithub(): boolean {
        return this.value === AuthProviderEnum.GITHUB;
    }

    isLinkedin(): boolean {
        return this.value === AuthProviderEnum.LINKEDIN;
    }

    isPhone(): boolean {
        return this.value === AuthProviderEnum.PHONE;
    }

    isEmail(): boolean {
        return this.value === AuthProviderEnum.EMAIL;
    }

    // Business rule methods
    isSocialProvider(): boolean {
        return [
            AuthProviderEnum.GOOGLE_OAUTH2,
            AuthProviderEnum.FACEBOOK,
            AuthProviderEnum.APPLE,
            AuthProviderEnum.MICROSOFT,
            AuthProviderEnum.TWITTER,
            AuthProviderEnum.GITHUB,
            AuthProviderEnum.LINKEDIN,
        ].includes(this.value);
    }

    isPasswordless(): boolean {
        return [AuthProviderEnum.PHONE, AuthProviderEnum.EMAIL].includes(this.value);
    }

    isCredentialBased(): boolean {
        return this.value === AuthProviderEnum.AUTH0;
    }

    /**
     * Check if this provider requires email verification
     */
    requiresEmailVerification(): boolean {
        // Social providers typically verify email
        return !this.isSocialProvider();
    }

    /**
     * Get display name for the provider
     */
    getDisplayName(): string {
        const displayNames: Record<AuthProviderEnum, string> = {
            [AuthProviderEnum.AUTH0]: 'Email & Password',
            [AuthProviderEnum.GOOGLE_OAUTH2]: 'Google',
            [AuthProviderEnum.FACEBOOK]: 'Facebook',
            [AuthProviderEnum.APPLE]: 'Apple',
            [AuthProviderEnum.MICROSOFT]: 'Microsoft',
            [AuthProviderEnum.TWITTER]: 'X (Twitter)',
            [AuthProviderEnum.GITHUB]: 'GitHub',
            [AuthProviderEnum.LINKEDIN]: 'LinkedIn',
            [AuthProviderEnum.PHONE]: 'Phone Number',
            [AuthProviderEnum.EMAIL]: 'Magic Link',
        };
        return displayNames[this.value];
    }

    equals(other: AuthProvider): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}

/**
 * Check if a string is a valid auth provider
 */
export function isValidAuthProvider(value: string): value is AuthProviderEnum {
    return Object.values(AuthProviderEnum).includes(value as AuthProviderEnum);
}

/**
 * Map Prisma enum to domain AuthProvider
 */
export function mapAuthProviderFromPrisma(prismaProvider: string): AuthProvider {
    if (isValidAuthProvider(prismaProvider)) {
        return AuthProvider.create(prismaProvider);
    }
    return AuthProvider.auth0();
}

/**
 * Map domain AuthProvider to Prisma enum value
 */
export function mapAuthProviderToPrisma(provider: AuthProvider): string {
    return provider.getValue();
}
