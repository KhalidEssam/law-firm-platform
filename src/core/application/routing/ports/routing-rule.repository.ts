// ============================================
// ROUTING RULE REPOSITORY - RE-EXPORT FROM DOMAIN
// src/core/application/routing/ports/routing-rule.repository.ts
// ============================================
// NOTE: Repository interface has been moved to domain layer.
// This file re-exports for backward compatibility.
// New code should import from '@core/domain/routing/ports'
// ============================================

export type {
  // Filter & Pagination interfaces
  RoutingRuleFilters,
  PaginationOptions,
  PaginatedResult,
  RoundRobinState,

  // Repository interface
  IRoutingRuleRepository,
} from '../../../domain/routing/ports/routing-rule.repository';

export {
  // DI Token
  ROUTING_RULE_REPOSITORY,
} from '../../../domain/routing/ports/routing-rule.repository';
