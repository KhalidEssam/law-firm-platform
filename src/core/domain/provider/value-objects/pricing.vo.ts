import { ValueObject } from '../../base/ValueObject';


export interface PricingProps {
    amount?: number;
    currency?: string;
    type?: 'fixed' | 'hourly' | 'range';
    minAmount?: number;
    maxAmount?: number;
}

export class Pricing extends ValueObject<PricingProps> {
    private constructor(props: PricingProps) {
        super(props);
    }
    get value(): PricingProps {
        return this.props;
    }
    public static create(props: PricingProps = {}): Pricing {
        if (props.amount !== undefined && props.amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (props.minAmount !== undefined && props.minAmount < 0) {
            throw new Error('Minimum amount cannot be negative');
        }
        if (props.maxAmount !== undefined && props.maxAmount < 0) {
            throw new Error('Maximum amount cannot be negative');
        }
        if (props.minAmount && props.maxAmount && props.minAmount > props.maxAmount) {
            throw new Error('Minimum amount cannot be greater than maximum amount');
        }
        return new Pricing(props);
    }
}