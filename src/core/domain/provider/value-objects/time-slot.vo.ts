import { ValueObject } from '../../base/ValueObject';



export interface TimeSlotProps {
    startTime: string; // HH:mm
    endTime: string;
}

export class TimeSlot extends ValueObject<TimeSlotProps> {
    get startTime(): string {
        return this.props.startTime;
    }

    get endTime(): string {
        return this.props.endTime;
    }

    private constructor(props: TimeSlotProps) {
        super(props);
    }

    public static create(props: TimeSlotProps): TimeSlot {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (!timeRegex.test(props.startTime)) {
            throw new Error('Invalid start time format');
        }
        if (!timeRegex.test(props.endTime)) {
            throw new Error('Invalid end time format');
        }

        return new TimeSlot(props);
    }

    public overlaps(other: TimeSlot): boolean {
        return this.props.startTime < other.endTime && this.props.endTime > other.startTime;
    }
}