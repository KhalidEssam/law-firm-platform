// src/core/domain/routing/value-objects/routing-conditions.vo.ts

/**
 * RequestContext - Data from an incoming request used for routing evaluation
 */
export interface RequestContext {
  requestType: string; // consultation, legal_opinion, litigation, call, service
  category?: string | null; // civil, criminal, commercial, family, labor, etc.
  urgency?: string | null; // low, normal, high, urgent
  subscriberTier?: string | null; // basic, premium, enterprise
  subscriberId?: string;
  amount?: number | null; // Estimated value of the case
  region?: string | null; // Geographic region
  specializations?: string[]; // Required specializations
  metadata?: Record<string, any>;
}

/**
 * RoutingConditions - Criteria for matching requests to routing rules
 */
export interface RoutingConditionsData {
  categories?: string[]; // Match these categories (OR)
  excludeCategories?: string[]; // Exclude these categories
  urgencies?: string[]; // Match these urgency levels (OR)
  subscriberTiers?: string[]; // Only for these subscriber tiers
  minAmount?: number; // Minimum case value
  maxAmount?: number; // Maximum case value
  regions?: string[]; // Geographic regions to match
  specializations?: string[]; // Required specializations (any match)
  customRules?: CustomRule[]; // Additional custom matching rules
}

/**
 * CustomRule - Flexible custom matching rule
 */
export interface CustomRule {
  field: string; // Field to check (e.g., 'metadata.priority')
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'in'
    | 'not_in';
  value: any; // Value to compare against
}

/**
 * RoutingConditions Value Object
 * Encapsulates the logic for matching requests to routing rules
 */
export class RoutingConditions {
  private readonly conditions: RoutingConditionsData;

  constructor(conditions: RoutingConditionsData | null | undefined) {
    this.conditions = conditions || {};
  }

  /**
   * Check if a request matches these conditions
   */
  matches(context: RequestContext): boolean {
    // If no conditions, match everything
    if (this.isEmpty()) {
      return true;
    }

    // Check category match
    if (!this.matchesCategory(context.category)) {
      return false;
    }

    // Check urgency match
    if (!this.matchesUrgency(context.urgency)) {
      return false;
    }

    // Check subscriber tier
    if (!this.matchesSubscriberTier(context.subscriberTier)) {
      return false;
    }

    // Check amount range
    if (!this.matchesAmount(context.amount)) {
      return false;
    }

    // Check region
    if (!this.matchesRegion(context.region)) {
      return false;
    }

    // Check specializations
    if (!this.matchesSpecializations(context.specializations)) {
      return false;
    }

    // Check custom rules
    if (!this.matchesCustomRules(context)) {
      return false;
    }

    return true;
  }

  /**
   * Check if conditions are empty (match all)
   */
  isEmpty(): boolean {
    return (
      !this.conditions.categories?.length &&
      !this.conditions.excludeCategories?.length &&
      !this.conditions.urgencies?.length &&
      !this.conditions.subscriberTiers?.length &&
      !this.conditions.regions?.length &&
      !this.conditions.specializations?.length &&
      !this.conditions.customRules?.length &&
      this.conditions.minAmount === undefined &&
      this.conditions.maxAmount === undefined
    );
  }

  /**
   * Get the raw conditions data
   */
  toJSON(): RoutingConditionsData {
    return { ...this.conditions };
  }

  // ============================================
  // PRIVATE MATCHING METHODS
  // ============================================

  private matchesCategory(category: string | null | undefined): boolean {
    const { categories, excludeCategories } = this.conditions;

    // Check exclusions first
    if (excludeCategories?.length && category) {
      if (excludeCategories.includes(category.toLowerCase())) {
        return false;
      }
    }

    // If no categories specified, match all
    if (!categories?.length) {
      return true;
    }

    // Category must be in the list
    if (!category) {
      return false;
    }

    return categories
      .map((c) => c.toLowerCase())
      .includes(category.toLowerCase());
  }

  private matchesUrgency(urgency: string | null | undefined): boolean {
    const { urgencies } = this.conditions;

    // If no urgencies specified, match all
    if (!urgencies?.length) {
      return true;
    }

    // Urgency must be in the list
    if (!urgency) {
      return false;
    }

    return urgencies
      .map((u) => u.toLowerCase())
      .includes(urgency.toLowerCase());
  }

  private matchesSubscriberTier(tier: string | null | undefined): boolean {
    const { subscriberTiers } = this.conditions;

    // If no tiers specified, match all
    if (!subscriberTiers?.length) {
      return true;
    }

    // Tier must be in the list
    if (!tier) {
      return false;
    }

    return subscriberTiers
      .map((t) => t.toLowerCase())
      .includes(tier.toLowerCase());
  }

  private matchesAmount(amount: number | null | undefined): boolean {
    const { minAmount, maxAmount } = this.conditions;

    // If no amount constraints, match all
    if (minAmount === undefined && maxAmount === undefined) {
      return true;
    }

    // If amount is required but not provided, don't match
    if (amount === null || amount === undefined) {
      return false;
    }

    if (minAmount !== undefined && amount < minAmount) {
      return false;
    }

    if (maxAmount !== undefined && amount > maxAmount) {
      return false;
    }

    return true;
  }

  private matchesRegion(region: string | null | undefined): boolean {
    const { regions } = this.conditions;

    // If no regions specified, match all
    if (!regions?.length) {
      return true;
    }

    // Region must be in the list
    if (!region) {
      return false;
    }

    return regions.map((r) => r.toLowerCase()).includes(region.toLowerCase());
  }

  private matchesSpecializations(
    specializations: string[] | undefined,
  ): boolean {
    const { specializations: requiredSpecs } = this.conditions;

    // If no specializations specified, match all
    if (!requiredSpecs?.length) {
      return true;
    }

    // If specializations are required but not provided, don't match
    if (!specializations?.length) {
      return false;
    }

    // At least one specialization must match (OR logic)
    const normalizedRequired = requiredSpecs.map((s) => s.toLowerCase());
    const normalizedProvided = specializations.map((s) => s.toLowerCase());

    return normalizedRequired.some((req) => normalizedProvided.includes(req));
  }

  private matchesCustomRules(context: RequestContext): boolean {
    const { customRules } = this.conditions;

    // If no custom rules, match all
    if (!customRules?.length) {
      return true;
    }

    // All custom rules must match (AND logic)
    return customRules.every((rule) => this.evaluateCustomRule(rule, context));
  }

  private evaluateCustomRule(
    rule: CustomRule,
    context: RequestContext,
  ): boolean {
    const fieldValue = this.getNestedValue(context, rule.field);

    switch (rule.operator) {
      case 'equals':
        return fieldValue === rule.value;
      case 'not_equals':
        return fieldValue !== rule.value;
      case 'contains':
        return String(fieldValue)
          .toLowerCase()
          .includes(String(rule.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(rule.value);
      case 'less_than':
        return Number(fieldValue) < Number(rule.value);
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * Create RoutingConditions from raw data
 */
export function createRoutingConditions(
  data: RoutingConditionsData | null | undefined,
): RoutingConditions {
  return new RoutingConditions(data);
}
