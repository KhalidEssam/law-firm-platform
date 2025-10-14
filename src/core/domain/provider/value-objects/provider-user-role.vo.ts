import { ValueObject } from '../../base/ValueObject';


export type ProviderUserRole = 'account_manager' | 'lawyer' | 'assistant';

export interface ProviderUserRoleProps {
    role: ProviderUserRole;
}

export class ProviderUserRoleVO extends ValueObject<ProviderUserRoleProps> {
    get role(): ProviderUserRole {
        return this.props.role;
    }

    get isAccountManager(): boolean {
        return this.props.role === 'account_manager';
    }

    get isLawyer(): boolean {
        return this.props.role === 'lawyer';
    }

    get isAssistant(): boolean {
        return this.props.role === 'assistant';
    }

    private constructor(props: ProviderUserRoleProps) {
        super(props);
    }

    public static create(role: ProviderUserRole): ProviderUserRoleVO {
        return new ProviderUserRoleVO({ role });
    }
}
