import { Entity } from './Entity';

/**
 * Domain Event Interface
 * All domain events must implement this interface
 */
export interface DomainEvent {
  /** When the event occurred */
  occurredOn: Date;

  /** Get the aggregate ID that this event relates to */
  getAggregateId(): string;

  /** Optional: Event type identifier */
  eventType?: string;

  /** Optional: Event version for event sourcing */
  eventVersion?: number;
}

/**
 * Base Domain Event class
 * Provides common functionality for domain events
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventType: string;
  public readonly eventVersion: number;

  protected constructor(
    aggregateId: string,
    eventType?: string,
    eventVersion: number = 1,
  ) {
    this.occurredOn = new Date();
    this.eventType = eventType ?? this.constructor.name;
    this.eventVersion = eventVersion;
    this._aggregateId = aggregateId;
  }

  private _aggregateId: string;

  public getAggregateId(): string {
    return this._aggregateId;
  }
}

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  /**
   * Get all domain events that have been raised
   */
  public get domainEvents(): ReadonlyArray<DomainEvent> {
    return Object.freeze([...this._domainEvents]);
  }

  /**
   * Get the current version of the aggregate
   * Useful for optimistic locking and event sourcing
   */
  public get version(): number {
    return this._version;
  }

  /**
   * Add a domain event to be dispatched
   * Events are not dispatched immediately but collected for later processing
   * @param domainEvent - The domain event to add
   */
  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  /**
   * Clear all domain events
   * Should be called after events have been dispatched
   */
  public clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if there are any domain events pending
   */
  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Get a specific domain event by type
   * @param eventType - The type of event to find
   */
  public getEventsByType(eventType: string): DomainEvent[] {
    return this._domainEvents.filter((event) => event.eventType === eventType);
  }

  /**
   * Increment the aggregate version
   * Should be called after successful persistence
   */
  public incrementVersion(): void {
    this._version++;
  }

  /**
   * Set the aggregate version
   * Used when loading from persistence
   * @param version - The version to set
   */
  protected setVersion(version: number): void {
    this._version = version;
  }

  /**
   * Apply a domain event to the aggregate
   * This is useful for event sourcing patterns
   * @param event - The event to apply
   */
  protected applyEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
    this.incrementVersion();
  }

  /**
   * Validate the entire aggregate
   * Should check all invariants across the aggregate boundary
   */
  // protected abstract validateInvariants(): void;

  /**
   * Mark the aggregate as deleted (soft delete)
   * Can be overridden for custom deletion logic
   */
  public markAsDeleted?(): void;

  /**
   * Check if the aggregate has been modified
   * Useful for change tracking
   */
  public isModified?(): boolean;

  /**
   * Convert aggregate to a snapshot for event sourcing
   */
  public toSnapshot?(): any;

  /**
   * Restore aggregate from a snapshot
   */
  public static fromSnapshot?<T>(snapshot: any): AggregateRoot<T>;
}

/**
 * Type guard to check if an entity is an AggregateRoot
 */
export function isAggregateRoot(obj: any): obj is AggregateRoot<any> {
  return obj instanceof AggregateRoot;
}
