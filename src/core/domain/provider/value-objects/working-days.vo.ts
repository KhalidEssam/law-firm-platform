import { ValueObject } from '../../base/ValueObject';
export interface WorkingDaysProps {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export class WorkingDays extends ValueObject<WorkingDaysProps> {
  private constructor(props: WorkingDaysProps) {
    super(props);
  }
  get value(): WorkingDaysProps {
    return this.props;
  }
  public static create(props: Partial<WorkingDaysProps> = {}): WorkingDays {
    return new WorkingDays({
      monday: props.monday ?? false,
      tuesday: props.tuesday ?? false,
      wednesday: props.wednesday ?? false,
      thursday: props.thursday ?? false,
      friday: props.friday ?? false,
      saturday: props.saturday ?? false,
      sunday: props.sunday ?? false,
    });
  }

  public isWorkingDay(day: keyof WorkingDaysProps): boolean {
    return this.props[day];
  }

  public getWorkingDaysCount(): number {
    return Object.values(this.props).filter(Boolean).length;
  }
}
