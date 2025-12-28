import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

// HTTP Metrics
export const httpRequestsTotal = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

// Business Metrics
export const activeUsersGauge = makeGaugeProvider({
  name: 'active_users_total',
  help: 'Total number of active users',
});

export const membershipsByTier = makeGaugeProvider({
  name: 'memberships_by_tier',
  help: 'Number of memberships by tier',
  labelNames: ['tier'],
});

export const requestsByStatus = makeGaugeProvider({
  name: 'service_requests_by_status',
  help: 'Number of service requests by status',
  labelNames: ['type', 'status'],
});

export const transactionsTotal = makeCounterProvider({
  name: 'transactions_total',
  help: 'Total number of financial transactions',
  labelNames: ['type', 'status', 'currency'],
});

export const transactionAmount = makeHistogramProvider({
  name: 'transaction_amount',
  help: 'Transaction amounts',
  labelNames: ['type', 'currency'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000],
});

// Database Metrics
export const dbQueryDuration = makeHistogramProvider({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

export const dbConnectionsActive = makeGaugeProvider({
  name: 'db_connections_active',
  help: 'Number of active database connections',
});

// Error Metrics
export const errorsTotal = makeCounterProvider({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'code'],
});

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'exoln_lex_',
        },
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    httpRequestsTotal,
    httpRequestDuration,
    activeUsersGauge,
    membershipsByTier,
    requestsByStatus,
    transactionsTotal,
    transactionAmount,
    dbQueryDuration,
    dbConnectionsActive,
    errorsTotal,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
