import { ValueObject } from '../../base/ValueObject';
export interface LicenseNumberProps {
    value: string;
}

export class LicenseNumber extends ValueObject<LicenseNumberProps> {
    get value(): string {
        return this.props.value;
    }

    private constructor(props: LicenseNumberProps) {
        super(props);
    }

    public static create(value: string): LicenseNumber {
        if (!value || value.trim().length === 0) {
            throw new Error('License number is required');
        }
        if (!/^[A-Z0-9-]+$/i.test(value)) {
            throw new Error('License number format is invalid');
        }
        return new LicenseNumber({ value: value.trim().toUpperCase() });
    }
}

