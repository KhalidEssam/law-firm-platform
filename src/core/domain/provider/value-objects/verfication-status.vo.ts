import { ValueObject } from '../../base/ValueObject';

export type VerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export interface VerificationStatusProps {
  status: VerificationStatus;
}

export class VerificationStatusVO extends ValueObject<VerificationStatusProps> {
  get status(): VerificationStatus {
    return this.props.status;
  }

  get isPending(): boolean {
    return this.props.status === 'pending';
  }

  get isApproved(): boolean {
    return this.props.status === 'approved';
  }

  get isRejected(): boolean {
    return this.props.status === 'rejected';
  }

  get isSuspended(): boolean {
    return this.props.status === 'suspended';
  }

  private constructor(props: VerificationStatusProps) {
    super(props);
  }

  public static create(
    status: VerificationStatus = 'pending',
  ): VerificationStatusVO {
    return new VerificationStatusVO({ status });
  }

  public approve(): VerificationStatusVO {
    return VerificationStatusVO.create('approved');
  }

  public reject(): VerificationStatusVO {
    return VerificationStatusVO.create('rejected');
  }

  public suspend(): VerificationStatusVO {
    return VerificationStatusVO.create('suspended');
  }
}
