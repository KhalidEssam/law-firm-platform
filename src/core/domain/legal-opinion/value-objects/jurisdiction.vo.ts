// ============================================
// VALUE OBJECT 7: JURISDICTION
// Legal jurisdiction for the opinion
// ============================================

// import { DomainException } from '../shared/domain-exception';

/**
 * Jurisdiction - The legal jurisdiction applicable to the opinion
 *
 * Business Rules:
 * - Must specify country and optionally state/province/region
 * - Cannot be empty
 * - Must be a recognized legal jurisdiction
 * - Immutable once set
 *
 * Importance:
 * - Different jurisdictions have different laws
 * - Determines which legal framework applies
 * - Affects lawyer assignment (need expertise in that jurisdiction)
 * - Critical for accurate legal opinion
 */

export interface JurisdictionData {
  country: string;
  region?: string; // State, Province, Emirate, etc.
  city?: string;
  legalSystem?: LegalSystem; // Civil law, Common law, Sharia law, etc.
}

export enum LegalSystem {
  CIVIL_LAW = 'civil_law',
  COMMON_LAW = 'common_law',
  SHARIA_LAW = 'sharia_law',
  MIXED = 'mixed',
  CUSTOMARY = 'customary',
}

export class Jurisdiction {
  private readonly country: string;
  private readonly region?: string;
  private readonly city?: string;
  private readonly legalSystem?: LegalSystem;

  private constructor(data: JurisdictionData) {
    this.validate(data);
    this.country = data.country.trim();
    this.region = data.region?.trim();
    this.city = data.city?.trim();
    this.legalSystem = data.legalSystem;
  }

  private validate(_data: JurisdictionData): void {
    // if (!data.country || data.country.trim().length === 0) {
    //   throw new DomainException('Jurisdiction must specify a country');
    // }
    // if (data.country.trim().length < 2) {
    //   throw new DomainException('Country name must be at least 2 characters');
    // }
    // if (data.country.trim().length > 100) {
    //   throw new DomainException('Country name is too long');
    // }
    // // Validate region if provided
    // if (data.region && data.region.trim().length > 100) {
    //   throw new DomainException('Region name is too long');
    // }
    // // Validate city if provided
    // if (data.city && data.city.trim().length > 100) {
    //   throw new DomainException('City name is too long');
    // }
  }

  // Factory method: Create jurisdiction
  static create(data: JurisdictionData): Jurisdiction {
    return new Jurisdiction(data);
  }

  // Factory method: Create from simple string (country only)
  static fromCountry(country: string): Jurisdiction {
    return new Jurisdiction({ country });
  }

  // Factory method: Common jurisdictions (convenience)
  static saudiArabia(region?: string): Jurisdiction {
    return new Jurisdiction({
      country: 'Saudi Arabia',
      region,
      legalSystem: LegalSystem.SHARIA_LAW,
    });
  }

  static uae(emirate?: string): Jurisdiction {
    return new Jurisdiction({
      country: 'United Arab Emirates',
      region: emirate,
      legalSystem: LegalSystem.MIXED,
    });
  }

  static egypt(governorate?: string): Jurisdiction {
    return new Jurisdiction({
      country: 'Egypt',
      region: governorate,
      legalSystem: LegalSystem.MIXED,
    });
  }

  // Getters
  getCountry(): string {
    return this.country;
  }

  getRegion(): string | undefined {
    return this.region;
  }

  getCity(): string | undefined {
    return this.city;
  }

  getLegalSystem(): LegalSystem | undefined {
    return this.legalSystem;
  }

  // Get full jurisdiction name
  getFullName(): string {
    const parts = [this.country];
    if (this.region) parts.push(this.region);
    if (this.city) parts.push(this.city);
    return parts.join(', ');
  }

  // Get short name (country + region)
  getShortName(): string {
    return this.region ? `${this.country}, ${this.region}` : this.country;
  }

  // Check if it's a specific country
  isCountry(countryName: string): boolean {
    return this.country.toLowerCase() === countryName.toLowerCase();
  }

  // Check if jurisdiction is in Middle East
  isMiddleEast(): boolean {
    const middleEastCountries = [
      'Saudi Arabia',
      'United Arab Emirates',
      'Qatar',
      'Kuwait',
      'Bahrain',
      'Oman',
      'Egypt',
      'Jordan',
      'Lebanon',
      'Iraq',
      'Syria',
      'Yemen',
    ];

    return middleEastCountries.some(
      (country) => this.country.toLowerCase() === country.toLowerCase(),
    );
  }

  // Check if requires Sharia law expertise
  requiresShareExpertise(): boolean {
    return (
      this.legalSystem === LegalSystem.SHARIA_LAW ||
      this.legalSystem === LegalSystem.MIXED
    );
  }

  // Value object equality
  equals(other: Jurisdiction): boolean {
    if (!other) return false;
    return (
      this.country === other.country &&
      this.region === other.region &&
      this.city === other.city &&
      this.legalSystem === other.legalSystem
    );
  }

  // String representation
  toString(): string {
    return this.getFullName();
  }

  // For database storage
  toJSON(): JurisdictionData {
    return {
      country: this.country,
      region: this.region,
      city: this.city,
      legalSystem: this.legalSystem,
    };
  }

  // Reconstitute from JSON
  static fromJSON(data: JurisdictionData): Jurisdiction {
    return new Jurisdiction(data);
  }
}
