// ============================================
// BASE VALUE OBJECT CLASS
// domain/entities/base/ValueObject.ts
// ============================================

/**
 * Base ValueObject class for all domain value objects
 * 
 * Value Objects are immutable objects that are defined by their attributes.
 * Two value objects are equal if all their attributes are equal.
 * Value Objects have no identity - they are defined solely by their values.
 * 
 * Key characteristics:
 * - Immutable: Once created, cannot be changed
 * - No identity: Equality is based on structural comparison of attributes
 * - Side-effect free: Methods return new value objects rather than modifying state
 * - Self-validating: Validate their own invariants in the constructor
 */
export abstract class ValueObject<T> {
    /**
     * The properties of this value object
     * Frozen to ensure immutability
     */
    protected readonly props: T;

    /**
     * Constructor for ValueObject
     * Props are deeply frozen to ensure complete immutability
     * @param props - The properties of the value object
     */
    protected constructor(props: T) {
        this.props = Object.freeze(this.deepFreeze(props));
    }

    /**
     * Deep freeze an object to make it immutable at all levels
     * @param obj - The object to freeze
     * @returns The frozen object
     */
    private deepFreeze<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        Object.keys(obj).forEach((prop) => {
            const value = (obj as any)[prop];
            if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
                this.deepFreeze(value);
            }
        });

        return Object.freeze(obj);
    }

    /**
     * Check if two value objects are equal
     * Performs deep equality check on all properties
     * @param vo - The value object to compare with
     * @returns true if all properties are equal
     */
    public equals(vo?: ValueObject<T>): boolean {
        if (vo === null || vo === undefined) {
            return false;
        }

        if (vo === this) {
            return true;
        }

        if (!(vo instanceof ValueObject)) {
            return false;
        }

        return this.deepEquals(this.props, vo.props);
    }

    /**
     * Deep equality comparison for objects
     * @param obj1 - First object
     * @param obj2 - Second object
     * @returns true if objects are deeply equal
     */
    private deepEquals(obj1: any, obj2: any): boolean {
        if (obj1 === obj2) {
            return true;
        }

        if (obj1 === null || obj2 === null) {
            return false;
        }

        if (typeof obj1 !== typeof obj2) {
            return false;
        }

        if (typeof obj1 !== 'object') {
            return obj1 === obj2;
        }

        // Handle arrays
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            if (obj1.length !== obj2.length) {
                return false;
            }
            return obj1.every((item, index) => this.deepEquals(item, obj2[index]));
        }

        // Handle dates
        if (obj1 instanceof Date && obj2 instanceof Date) {
            return obj1.getTime() === obj2.getTime();
        }

        // Handle objects
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        return keys1.every((key) => this.deepEquals(obj1[key], obj2[key]));
    }

    /**
     * Convert value object to plain object
     * Useful for serialization and data transfer
     * @returns A plain object representation
     */
    public toJSON(): T {
        return { ...this.props };
    }

    /**
     * Convert value object to string representation
     * @returns JSON string representation
     */
    public toString(): string {
        return JSON.stringify(this.props);
    }

    /**
     * Get a hash code for the value object
     * Two equal value objects will have the same hash code
     * @returns Hash code string
     */
    public hashCode(): string {
        return this.toString();
    }

    /**
     * Get a shallow copy of the props
     * Protected method for use in subclasses
     * @returns Shallow copy of props
     */
    protected getProps(): T {
        return { ...this.props };
    }
}