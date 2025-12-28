import { ValueObject } from '../../base/ValueObject';

export interface ContactInfoProps {
  businessEmail?: string;
  businessPhone?: string;
  website?: string;
}

export class ContactInfo extends ValueObject<ContactInfoProps> {
  get businessEmail(): string | undefined {
    return this.props.businessEmail;
  }

  get businessPhone(): string | undefined {
    return this.props.businessPhone;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  private constructor(props: ContactInfoProps) {
    super(props);
  }

  public static create(props: ContactInfoProps = {}): ContactInfo {
    if (props.businessEmail && !this.isValidEmail(props.businessEmail)) {
      throw new Error('Invalid email format');
    }
    if (props.website && !this.isValidUrl(props.website)) {
      throw new Error('Invalid website URL');
    }
    return new ContactInfo(props);
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
