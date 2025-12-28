// src/core/domain/routing/entities/routing-rule.entity.ts

import crypto from 'crypto';
import {
  RoutingStrategy,
  isValidRoutingStrategy,
  isAutoAssignStrategy,
} from '../value-objects/routing-strategy.vo';
import {
  RoutingConditions,
  RoutingConditionsData,
  RequestContext,
  createRoutingConditions,
} from '../value-objects/routing-conditions.vo';
import {
  ProviderTarget,
  ProviderTargetData,
  ProviderInfo,
  createProviderTarget,
} from '../value-objects/provider-target.vo';
import {
  RequestType,
  isValidRequestType,
} from '../value-objects/request-type.vo';

export interface RoutingRuleProps {
  id?: string;
  name: string;
  requestType: RequestType | string;
  conditions?: RoutingConditionsData | null;
  priority?: number;
  routingStrategy: RoutingStrategy | string;
  targetProviders?: ProviderTargetData | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * RoutingRule Entity - Aggregate Root
 * Represents a rule for automatically routing requests to providers
 */
export class RoutingRule {
  private constructor(
    public readonly id: string,
    private _name: string,
    private _requestType: RequestType,
    private _conditions: RoutingConditions,
    private _priority: number,
    private _routingStrategy: RoutingStrategy,
    private _targetProviders: ProviderTarget,
    private _isActive: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ============================================
  // FACTORY METHODS
  // ============================================

  /**
   * Create a new RoutingRule
   */
  static create(props: RoutingRuleProps): RoutingRule {
    const now = new Date();

    // Validate request type
    const requestType =
      typeof props.requestType === 'string'
        ? isValidRequestType(props.requestType)
          ? props.requestType
          : RequestType.CONSULTATION
        : props.requestType;

    // Validate routing strategy
    const routingStrategy =
      typeof props.routingStrategy === 'string'
        ? isValidRoutingStrategy(props.routingStrategy)
          ? props.routingStrategy
          : RoutingStrategy.MANUAL
        : props.routingStrategy;

    return new RoutingRule(
      props.id || crypto.randomUUID(),
      props.name,
      requestType,
      createRoutingConditions(props.conditions),
      props.priority ?? 0,
      routingStrategy,
      createProviderTarget(props.targetProviders),
      props.isActive ?? true,
      props.createdAt || now,
      props.updatedAt || now,
    );
  }

  /**
   * Rehydrate from persistence
   */
  static rehydrate(props: {
    id: string;
    name: string;
    requestType: string;
    conditions: RoutingConditionsData | null;
    priority: number;
    routingStrategy: string;
    targetProviders: ProviderTargetData | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): RoutingRule {
    return new RoutingRule(
      props.id,
      props.name,
      props.requestType as RequestType,
      createRoutingConditions(props.conditions),
      props.priority,
      props.routingStrategy as RoutingStrategy,
      createProviderTarget(props.targetProviders),
      props.isActive,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ============================================
  // GETTERS
  // ============================================

  get name(): string {
    return this._name;
  }

  get requestType(): RequestType {
    return this._requestType;
  }

  get conditions(): RoutingConditions {
    return this._conditions;
  }

  get priority(): number {
    return this._priority;
  }

  get routingStrategy(): RoutingStrategy {
    return this._routingStrategy;
  }

  get targetProviders(): ProviderTarget {
    return this._targetProviders;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============================================
  // DOMAIN METHODS - Rule Evaluation
  // ============================================

  /**
   * Check if this rule matches the given request context
   */
  matchesRequest(context: RequestContext): boolean {
    // Rule must be active
    if (!this._isActive) {
      return false;
    }

    // Request type must match
    if (context.requestType !== this._requestType) {
      return false;
    }

    // Check conditions
    return this._conditions.matches(context);
  }

  /**
   * Get eligible providers for this rule from a list
   */
  getEligibleProviders(providers: ProviderInfo[]): ProviderInfo[] {
    return this._targetProviders.filterEligible(providers);
  }

  /**
   * Select the best provider based on the routing strategy
   */
  selectProvider(
    eligibleProviders: ProviderInfo[],
    lastAssignedIndex?: number,
  ): ProviderInfo | null {
    if (eligibleProviders.length === 0) {
      return null;
    }

    switch (this._routingStrategy) {
      case RoutingStrategy.ROUND_ROBIN:
        return this.selectRoundRobin(eligibleProviders, lastAssignedIndex);

      case RoutingStrategy.LOAD_BALANCED:
        return this.selectLoadBalanced(eligibleProviders);

      case RoutingStrategy.SPECIALIZED:
        return this.selectSpecialized(eligibleProviders);

      case RoutingStrategy.MANUAL:
        return null; // No auto-assignment

      default:
        return eligibleProviders[0];
    }
  }

  /**
   * Check if this rule supports auto-assignment
   */
  supportsAutoAssignment(): boolean {
    return isAutoAssignStrategy(this._routingStrategy);
  }

  // ============================================
  // DOMAIN METHODS - Rule Management
  // ============================================

  /**
   * Update the rule name
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Rule name cannot be empty');
    }
    this._name = name.trim();
    this.touch();
  }

  /**
   * Update the request type
   */
  updateRequestType(requestType: RequestType): void {
    this._requestType = requestType;
    this.touch();
  }

  /**
   * Update the conditions
   */
  updateConditions(conditions: RoutingConditionsData | null): void {
    this._conditions = createRoutingConditions(conditions);
    this.touch();
  }

  /**
   * Update the priority
   */
  updatePriority(priority: number): void {
    if (priority < 0) {
      throw new Error('Priority cannot be negative');
    }
    this._priority = priority;
    this.touch();
  }

  /**
   * Update the routing strategy
   */
  updateRoutingStrategy(strategy: RoutingStrategy): void {
    this._routingStrategy = strategy;
    this.touch();
  }

  /**
   * Update the target providers
   */
  updateTargetProviders(target: ProviderTargetData | null): void {
    this._targetProviders = createProviderTarget(target);
    this.touch();
  }

  /**
   * Activate the rule
   */
  activate(): void {
    this._isActive = true;
    this.touch();
  }

  /**
   * Deactivate the rule
   */
  deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  // ============================================
  // PRIVATE SELECTION METHODS
  // ============================================

  /**
   * Round-robin selection
   * Selects the next provider in rotation
   */
  private selectRoundRobin(
    providers: ProviderInfo[],
    lastAssignedIndex?: number,
  ): ProviderInfo {
    const nextIndex =
      lastAssignedIndex !== undefined
        ? (lastAssignedIndex + 1) % providers.length
        : 0;
    return providers[nextIndex];
  }

  /**
   * Load-balanced selection
   * Selects the provider with the fewest active requests
   */
  private selectLoadBalanced(providers: ProviderInfo[]): ProviderInfo {
    const sorted = this._targetProviders.sortByLoadBalance(providers);
    return sorted[0];
  }

  /**
   * Specialized selection
   * Selects the provider with the best rating among those with matching specializations
   */
  private selectSpecialized(providers: ProviderInfo[]): ProviderInfo {
    const requiredSpecs = this._targetProviders.getRequiredSpecializations();

    // If no specific specializations required, sort by rating
    if (requiredSpecs.length === 0) {
      return this._targetProviders.sortByRating(providers)[0];
    }

    // Filter to providers with matching specializations
    const matchingProviders = providers.filter((p) => {
      if (!p.specializations?.length) return false;
      const providerSpecs = p.specializations.map((s) => s.toLowerCase());
      return requiredSpecs.some((req) =>
        providerSpecs.includes(req.toLowerCase()),
      );
    });

    if (matchingProviders.length === 0) {
      // Fallback to any eligible provider sorted by rating
      return this._targetProviders.sortByRating(providers)[0];
    }

    // Sort matching providers by rating
    return this._targetProviders.sortByRating(matchingProviders)[0];
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private touch(): void {
    this._updatedAt = new Date();
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  toObject(): {
    id: string;
    name: string;
    requestType: RequestType;
    conditions: RoutingConditionsData;
    priority: number;
    routingStrategy: RoutingStrategy;
    targetProviders: ProviderTargetData;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      name: this._name,
      requestType: this._requestType,
      conditions: this._conditions.toJSON(),
      priority: this._priority,
      routingStrategy: this._routingStrategy,
      targetProviders: this._targetProviders.toJSON(),
      isActive: this._isActive,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
