import { ValueObject } from '../../base/ValueObject';

export interface WorkingHoursProps {
  start: string; // HH:mm format
  end: string;
}

export class WorkingHours extends ValueObject<WorkingHoursProps> {
  get start(): string {
    return this.props.start;
  }
  get value(): WorkingHoursProps {
    return this.props;
  }
  get end(): string {
    return this.props.end;
  }

  private constructor(props: WorkingHoursProps) {
    super(props);
  }

  public static create(props: WorkingHoursProps): WorkingHours {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(props.start)) {
      throw new Error('Invalid start time format. Expected HH:mm');
    }
    if (!timeRegex.test(props.end)) {
      throw new Error('Invalid end time format. Expected HH:mm');
    }

    const [startHour, startMin] = props.start.split(':').map(Number);
    const [endHour, endMin] = props.end.split(':').map(Number);

    if (startHour * 60 + startMin >= endHour * 60 + endMin) {
      throw new Error('End time must be after start time');
    }

    return new WorkingHours(props);
  }
}
