import { ValueObject } from '../../base/ValueObject';


export interface OrganizationNameProps {
    name: string;
    nameAr?: string;
}

export class OrganizationName extends ValueObject<OrganizationNameProps> {
    get name(): string {
        return this.props.name;
    }

    get nameAr(): string | undefined {
        return this.props.nameAr;
    }

    private constructor(props: OrganizationNameProps) {
        super(props);
    }

    public static create(props: OrganizationNameProps): OrganizationName {
        if (!props.name || props.name.trim().length === 0) {
            throw new Error('Organization name is required');
        }
        if (props.name.length > 200) {
            throw new Error('Organization name is too long');
        }
        return new OrganizationName(props);
    }
}
