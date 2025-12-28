import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('active_users_total')
    private readonly activeUsersGauge: Gauge<string>,
    @InjectMetric('memberships_by_tier')
    private readonly membershipsByTier: Gauge<string>,
    @InjectMetric('service_requests_by_status')
    private readonly requestsByStatus: Gauge<string>,
    @InjectMetric('transactions_total')
    private readonly transactionsTotal: Counter<string>,
    @InjectMetric('transaction_amount')
    private readonly transactionAmount: Histogram<string>,
    @InjectMetric('db_query_duration_seconds')
    private readonly dbQueryDuration: Histogram<string>,
    @InjectMetric('db_connections_active')
    private readonly dbConnectionsActive: Gauge<string>,
    @InjectMetric('errors_total')
    private readonly errorsTotal: Counter<string>,
  ) {}

  // HTTP Metrics
  recordHttpRequest(method: string, route: string, statusCode: number): void {
    this.httpRequestsTotal.inc({
      method,
      route: this.normalizeRoute(route),
      status_code: statusCode.toString(),
    });
  }

  recordHttpDuration(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    this.httpRequestDuration.observe(
      {
        method,
        route: this.normalizeRoute(route),
        status_code: statusCode.toString(),
      },
      durationSeconds,
    );
  }

  // Business Metrics
  setActiveUsers(count: number): void {
    this.activeUsersGauge.set(count);
  }

  setMembershipsByTier(tier: string, count: number): void {
    this.membershipsByTier.set({ tier }, count);
  }

  setRequestsByStatus(type: string, status: string, count: number): void {
    this.requestsByStatus.set({ type, status }, count);
  }

  recordTransaction(
    type: string,
    status: string,
    currency: string,
    amount: number,
  ): void {
    this.transactionsTotal.inc({ type, status, currency });
    this.transactionAmount.observe({ type, currency }, amount);
  }

  // Database Metrics
  recordDbQuery(operation: string, table: string, durationSeconds: number): void {
    this.dbQueryDuration.observe({ operation, table }, durationSeconds);
  }

  setDbConnections(count: number): void {
    this.dbConnectionsActive.set(count);
  }

  // Error Metrics
  recordError(type: string, code: string): void {
    this.errorsTotal.inc({ type, code });
  }

  // Helper to normalize routes (replace IDs with placeholders)
  private normalizeRoute(route: string): string {
    return route
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .split('?')[0]; // Remove query params
  }
}
