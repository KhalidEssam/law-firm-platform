import { ValueObject } from '../../base/ValueObject';


export type ServiceType = 'consultation' | 'legal_opinion' | 'litigation' | 'specific_service';

export interface ServiceTypeProps {
    type: ServiceType;
    category?: string;
}

export class ServiceTypeVO extends ValueObject<ServiceTypeProps> {
    get type(): ServiceType {
        return this.props.type;
    }

    get category(): string | undefined {
        return this.props.category;
    }

    private constructor(props: ServiceTypeProps) {
        super(props);
    }

    public static create(type: ServiceType, category?: string): ServiceTypeVO {
        return new ServiceTypeVO({ type, category });
    }
}
