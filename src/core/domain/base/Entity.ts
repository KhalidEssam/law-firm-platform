// ============================================
// BASE ENTITY CLASS
// domain/entities/base/Entity.ts
// ============================================

import { v4 as uuidv4 } from 'uuid';

/**
 * Base Entity class for all domain entities
 * Entities are objects that have a unique identity that runs through time and different states
 * Two entities are equal if their IDs are equal, regardless of their other properties
 */
export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;

  /**
   * Constructor for Entity
   * @param props - The properties of the entity
   * @param id - Optional ID, will be generated if not provided
   */
  protected constructor(props: T, id?: string) {
    this._id = id ?? uuidv4();
    this.props = props;
  }

  /**
   * Getter for the entity ID
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Check if two entities are equal based on their IDs
   * @param entity - The entity to compare with
   * @returns true if entities have the same ID
   */
  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    return this._id === entity._id;
  }

  /**
   * Create a copy of the entity with updated properties
   * Useful for immutable patterns
   * @param props - Partial properties to update
   */
  protected clone(props?: Partial<T>): this {
    const constructor = this.constructor as new (props: T, id?: string) => this;
    return new constructor(
      {
        ...this.props,
        ...props,
      },
      this._id,
    );
  }

  /**
   * Convert entity to plain object
   * Useful for serialization
   */
  public toJSON(): any {
    return {
      id: this._id,
      ...this.props,
    };
  }

  /**
   * Get a hash code for the entity
   * Useful for collections and comparisons
   */
  public hashCode(): string {
    return this._id;
  }

  /**
   * Check if the entity is a new entity (not yet persisted)
   * Can be overridden in subclasses if they track persistence state
   */
  public isNew(): boolean {
    // Default implementation - can be overridden
    return false;
  }

  /**
   * Validate the entity's invariants
   * Should be called after any state change
   * Throws error if invariants are violated
   */
  protected validate(): void {
    // Override in subclasses to implement validation logic
  }

  /**
   * Hook called before entity is persisted
   * Can be overridden for pre-save operations
   */
  public beforePersist?(): void;

  /**
   * Hook called after entity is loaded from persistence
   * Can be overridden for post-load operations
   */
  public afterLoad?(): void;
}

/**
 * Type guard to check if an object is an Entity
 */
export function isEntity(obj: any): obj is Entity<any> {
  return obj instanceof Entity;
}

/**
 * Utility type to extract the props type from an Entity
 */
export type EntityProps<T extends Entity<any>> =
  T extends Entity<infer P> ? P : never;

/**
 * Utility type for entity creation props
 * Makes id optional for entity creation
 */
export type CreateEntityProps<T> = T & {
  id?: string;
};
