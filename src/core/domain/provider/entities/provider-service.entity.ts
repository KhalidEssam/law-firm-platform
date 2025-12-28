import { Entity } from '../../base/Entity';
import { ServiceTypeVO } from '../value-objects/service-type.vo';
import { Pricing } from '../value-objects/pricing.vo';

export interface ProviderServiceProps {
  providerId: string;
  serviceType: ServiceTypeVO;
  isActive: boolean;
  pricing?: Pricing;
  createdAt: Date;
  updatedAt: Date;
}

export class ProviderService extends Entity<ProviderServiceProps> {
  get providerId(): string {
    return this.props.providerId;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get serviceType(): ServiceTypeVO {
    return this.props.serviceType;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get pricing(): Pricing | undefined {
    return this.props.pricing;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: ProviderServiceProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: ProviderServiceProps,
    id?: string,
  ): ProviderService {
    return new ProviderService(
      {
        ...props,
        isActive: props.isActive ?? true,
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

  public updatePricing(pricing: Pricing): void {
    this.props.pricing = pricing;
    this.props.updatedAt = new Date();
  }
}
