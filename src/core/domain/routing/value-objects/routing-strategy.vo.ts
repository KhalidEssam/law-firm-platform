// src/core/domain/routing/value-objects/routing-strategy.vo.ts

/**
 * RoutingStrategy Value Object
 * Defines how requests are automatically assigned to providers
 */
export enum RoutingStrategy {
    /**
     * Distribute requests evenly among providers in rotation
     * Each provider gets assigned in turn, cycling through the list
     */
    ROUND_ROBIN = 'round_robin',

    /**
     * Assign to provider with the lowest number of active requests
     * Prevents overloading any single provider
     */
    LOAD_BALANCED = 'load_balanced',

    /**
     * Match request category/type to provider specializations
     * Ensures experts handle relevant cases
     */
    SPECIALIZED = 'specialized',

    /**
     * No automatic assignment - requires manual admin intervention
     * Used for complex, VIP, or special cases
     */
    MANUAL = 'manual',
}

/**
 * Validate if a string is a valid RoutingStrategy
 */
export function isValidRoutingStrategy(value: string): value is RoutingStrategy {
    return Object.values(RoutingStrategy).includes(value as RoutingStrategy);
}

/**
 * Get human-readable description for a routing strategy
 */
export function getStrategyDescription(strategy: RoutingStrategy): string {
    const descriptions: Record<RoutingStrategy, string> = {
        [RoutingStrategy.ROUND_ROBIN]: 'Distribute requests evenly among providers in rotation',
        [RoutingStrategy.LOAD_BALANCED]: 'Assign to provider with lowest active requests',
        [RoutingStrategy.SPECIALIZED]: 'Match requests to provider specializations',
        [RoutingStrategy.MANUAL]: 'Requires manual assignment by admin',
    };
    return descriptions[strategy];
}

/**
 * Check if strategy requires automatic provider selection
 */
export function isAutoAssignStrategy(strategy: RoutingStrategy): boolean {
    return strategy !== RoutingStrategy.MANUAL;
}

/**
 * Check if strategy requires specialization matching
 */
export function requiresSpecializationMatching(strategy: RoutingStrategy): boolean {
    return strategy === RoutingStrategy.SPECIALIZED;
}

/**
 * Maps Prisma RoutingStrategy to domain enum
 */
export function mapPrismaToRoutingStrategy(prismaStrategy: string): RoutingStrategy {
    const strategyMap: Record<string, RoutingStrategy> = {
        'round_robin': RoutingStrategy.ROUND_ROBIN,
        'load_balanced': RoutingStrategy.LOAD_BALANCED,
        'specialized': RoutingStrategy.SPECIALIZED,
        'manual': RoutingStrategy.MANUAL,
    };
    return strategyMap[prismaStrategy] || RoutingStrategy.MANUAL;
}

/**
 * Maps domain RoutingStrategy to Prisma enum string
 */
export function mapRoutingStrategyToPrisma(strategy: RoutingStrategy): string {
    return strategy; // They're the same in this case
}
