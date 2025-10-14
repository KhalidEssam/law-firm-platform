import { Entity } from "../../base/Entity";
import { TimeSlot } from "../value-objects/time-slot.vo";
export interface ProviderScheduleProps {
    providerId: string;
    dayOfWeek: number; // 0-6
    timeSlot: TimeSlot;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class ProviderSchedule extends Entity<ProviderScheduleProps> {
    get providerId(): string {
        return this.props.providerId;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }
    get dayOfWeek(): number {
        return this.props.dayOfWeek;
    }

    get timeSlot(): TimeSlot {
        return this.props.timeSlot;
    }

    get isAvailable(): boolean {
        return this.props.isAvailable;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    private constructor(props: ProviderScheduleProps, id?: string) {
        super(props, id);
    }

    public static create(props: ProviderScheduleProps, id?: string): ProviderSchedule {
        if (props.dayOfWeek < 0 || props.dayOfWeek > 6) {
            throw new Error('Day of week must be between 0 and 6');
        }

        return new ProviderSchedule(
            {
                ...props,
                isAvailable: props.isAvailable ?? true,
                createdAt: props.createdAt ?? new Date(),
                updatedAt: props.updatedAt ?? new Date(),
            },
            id
        );
    }

    public markAvailable(): void {
        this.props.isAvailable = true;
        this.props.updatedAt = new Date();
    }

    public markUnavailable(): void {
        this.props.isAvailable = false;
        this.props.updatedAt = new Date();
    }

    public updateTimeSlot(timeSlot: TimeSlot): void {
        this.props.timeSlot = timeSlot;
        this.props.updatedAt = new Date();
    }
}