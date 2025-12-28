import { Entity } from '../../base/Entity';
import { ProviderUserRoleVO } from '../value-objects/provider-user-role.vo';
export interface ProviderUserProps {
  providerId: string;
  userId: string;
  role: ProviderUserRoleVO;
  specializations?: string[];
  isActive: boolean;
  canAcceptRequests: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ProviderUser extends Entity<ProviderUserProps> {
  get providerId(): string {
    return this.props.providerId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): ProviderUserRoleVO {
    return this.props.role;
  }

  get specializations(): string[] {
    return this.props.specializations ?? [];
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get canAcceptRequests(): boolean {
    return this.props.canAcceptRequests;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  private constructor(props: ProviderUserProps, id?: string) {
    super(props, id);
  }

  public static create(props: ProviderUserProps, id?: string): ProviderUser {
    return new ProviderUser(
      {
        ...props,
        isActive: props.isActive ?? true,
        canAcceptRequests: props.canAcceptRequests ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public enableRequestAcceptance(): void {
    this.props.canAcceptRequests = true;
    this.props.updatedAt = new Date();
  }

  public disableRequestAcceptance(): void {
    this.props.canAcceptRequests = false;
    this.props.updatedAt = new Date();
  }

  public updateSpecializations(specializations: string[]): void {
    this.props.specializations = specializations;
    this.props.updatedAt = new Date();
  }

  public softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }
}
