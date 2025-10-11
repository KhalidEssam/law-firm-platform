export interface IRoleProvider {
    getRoles(): Promise<string[]>;
    assignRole(userId: string, role: string): Promise<void>;
}
export const ROLE_PROVIDER = Symbol('ROLE_PROVIDER');
