// ============================================
// VALUE OBJECT: DELIVERY FORMAT
// Format for opinion delivery
// ============================================

// import { DomainException } from '../shared/domain-exception';

export enum DeliveryFormat {
  PDF = 'pdf',
  WORD = 'word',
  BOTH = 'both',
}

export class DeliveryFormatVO {
  private readonly value: DeliveryFormat;

  private constructor(value: DeliveryFormat) {
    this.validate(value);
    this.value = value;
  }

  private validate(value: DeliveryFormat): void {
    // if (!Object.values(DeliveryFormat).includes(value)) {
    //   throw new DomainException(`Invalid delivery format: ${value}`);
    // }
  }

  static create(value: DeliveryFormat | string): DeliveryFormatVO {
    return new DeliveryFormatVO(value as DeliveryFormat);
  }

  getValue(): DeliveryFormat {
    return this.value;
  }

  includesPDF(): boolean {
    return this.value === DeliveryFormat.PDF || this.value === DeliveryFormat.BOTH;
  }

  includesWord(): boolean {
    return this.value === DeliveryFormat.WORD || this.value === DeliveryFormat.BOTH;
  }

  getLabel(): string {
    const labels: Record<DeliveryFormat, string> = {
      [DeliveryFormat.PDF]: 'PDF only',
      [DeliveryFormat.WORD]: 'Word document only',
      [DeliveryFormat.BOTH]: 'PDF and Word',
    };
    return labels[this.value];
  }

  equals(other: DeliveryFormatVO): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
