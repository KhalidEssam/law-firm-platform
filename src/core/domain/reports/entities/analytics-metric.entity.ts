// src/core/domain/reports/entities/analytics-metric.entity.ts

import crypto from 'crypto';
import {
  MetricType,
  MetricName,
  MetricDimensions,
  MetricDimensionsData,
} from '../value-objects/report.vo';

export interface AnalyticsMetricProps {
  id?: string;
  metricName: string;
  metricType: MetricType;
  value: number;
  dimensions?: MetricDimensionsData;
  timestamp?: Date;
}

/**
 * AnalyticsMetric Entity
 * Represents a single metric data point for analytics
 */
export class AnalyticsMetric {
  private constructor(
    public readonly id: string,
    private _metricName: MetricName,
    private _metricType: MetricType,
    private _value: number,
    private _dimensions: MetricDimensions,
    private _timestamp: Date,
  ) {}

  // ============================================
  // FACTORY METHODS
  // ============================================

  static create(props: AnalyticsMetricProps): AnalyticsMetric {
    return new AnalyticsMetric(
      props.id || crypto.randomUUID(),
      MetricName.create(props.metricName),
      props.metricType,
      props.value,
      MetricDimensions.create(props.dimensions),
      props.timestamp || new Date(),
    );
  }

  static rehydrate(props: Required<AnalyticsMetricProps>): AnalyticsMetric {
    return new AnalyticsMetric(
      props.id,
      MetricName.create(props.metricName),
      props.metricType,
      props.value,
      MetricDimensions.create(props.dimensions),
      props.timestamp,
    );
  }

  // ============================================
  // FACTORY HELPERS FOR COMMON METRICS
  // ============================================

  /**
   * Create a counter metric (incrementable value)
   */
  static counter(
    name: string,
    value: number,
    dimensions?: MetricDimensionsData,
  ): AnalyticsMetric {
    return AnalyticsMetric.create({
      metricName: name,
      metricType: MetricType.COUNTER,
      value,
      dimensions,
    });
  }

  /**
   * Create a gauge metric (point-in-time value)
   */
  static gauge(
    name: string,
    value: number,
    dimensions?: MetricDimensionsData,
  ): AnalyticsMetric {
    return AnalyticsMetric.create({
      metricName: name,
      metricType: MetricType.GAUGE,
      value,
      dimensions,
    });
  }

  /**
   * Create a histogram metric (distribution value)
   */
  static histogram(
    name: string,
    value: number,
    dimensions?: MetricDimensionsData,
  ): AnalyticsMetric {
    return AnalyticsMetric.create({
      metricName: name,
      metricType: MetricType.HISTOGRAM,
      value,
      dimensions,
    });
  }

  // ============================================
  // GETTERS
  // ============================================

  get metricName(): string {
    return this._metricName.value;
  }

  get metricType(): MetricType {
    return this._metricType;
  }

  get value(): number {
    return this._value;
  }

  get dimensions(): MetricDimensions {
    return this._dimensions;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  isCounter(): boolean {
    return this._metricType === MetricType.COUNTER;
  }

  isGauge(): boolean {
    return this._metricType === MetricType.GAUGE;
  }

  isHistogram(): boolean {
    return this._metricType === MetricType.HISTOGRAM;
  }

  matchesDimensions(filter: Partial<MetricDimensionsData>): boolean {
    return this._dimensions.matches(filter);
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  toObject(): {
    id: string;
    metricName: string;
    metricType: MetricType;
    value: number;
    dimensions: MetricDimensionsData;
    timestamp: Date;
  } {
    return {
      id: this.id,
      metricName: this._metricName.value,
      metricType: this._metricType,
      value: this._value,
      dimensions: this._dimensions.toJSON(),
      timestamp: this._timestamp,
    };
  }
}

// ============================================
// AGGREGATED METRICS TYPES
// ============================================

export interface AggregatedMetric {
  metricName: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  dimensions?: MetricDimensionsData;
}

export interface MetricTimeSeries {
  metricName: string;
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
  dimensions?: MetricDimensionsData;
}

export interface MetricSummary {
  metricName: string;
  metricType: MetricType;
  totalDataPoints: number;
  latestValue: number;
  latestTimestamp: Date;
  aggregations: {
    sum: number;
    avg: number;
    min: number;
    max: number;
  };
}
