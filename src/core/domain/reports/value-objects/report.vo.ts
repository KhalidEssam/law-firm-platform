// src/core/domain/reports/value-objects/report.vo.ts

/**
 * Report Type Enum
 */
export enum ReportType {
    FINANCIAL = 'financial',
    OPERATIONAL = 'operational',
    PERFORMANCE = 'performance',
    COMPLIANCE = 'compliance',
}

/**
 * Job Status Enum
 */
export enum JobStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    RETRYING = 'retrying',
}

/**
 * Metric Type Enum
 */
export enum MetricType {
    COUNTER = 'counter',
    GAUGE = 'gauge',
    HISTOGRAM = 'histogram',
    SUMMARY = 'summary',
}

/**
 * Report Name Value Object
 */
export class ReportName {
    private constructor(private readonly _value: string) {}

    static create(name: string): ReportName {
        if (!name || name.trim().length === 0) {
            throw new Error('Report name cannot be empty');
        }
        if (name.length > 200) {
            throw new Error('Report name cannot exceed 200 characters');
        }
        return new ReportName(name.trim());
    }

    get value(): string {
        return this._value;
    }

    equals(other: ReportName): boolean {
        return this._value === other._value;
    }
}

/**
 * Report Parameters Value Object
 */
export interface ReportParametersData {
    startDate?: string;
    endDate?: string;
    providerId?: string;
    subscriberId?: string;
    requestType?: string;
    status?: string;
    groupBy?: string;
    format?: 'json' | 'csv' | 'pdf' | 'excel';
    includeDetails?: boolean;
    filters?: Record<string, unknown>;
}

export class ReportParameters {
    private constructor(private readonly _data: ReportParametersData) {}

    static create(data?: ReportParametersData): ReportParameters {
        return new ReportParameters(data || {});
    }

    get startDate(): Date | undefined {
        return this._data.startDate ? new Date(this._data.startDate) : undefined;
    }

    get endDate(): Date | undefined {
        return this._data.endDate ? new Date(this._data.endDate) : undefined;
    }

    get providerId(): string | undefined {
        return this._data.providerId;
    }

    get subscriberId(): string | undefined {
        return this._data.subscriberId;
    }

    get requestType(): string | undefined {
        return this._data.requestType;
    }

    get status(): string | undefined {
        return this._data.status;
    }

    get groupBy(): string | undefined {
        return this._data.groupBy;
    }

    get format(): 'json' | 'csv' | 'pdf' | 'excel' {
        return this._data.format || 'json';
    }

    get includeDetails(): boolean {
        return this._data.includeDetails || false;
    }

    get filters(): Record<string, unknown> {
        return this._data.filters || {};
    }

    toJSON(): ReportParametersData {
        return { ...this._data };
    }
}

/**
 * Metric Name Value Object
 */
export class MetricName {
    private constructor(private readonly _value: string) {}

    static create(name: string): MetricName {
        if (!name || name.trim().length === 0) {
            throw new Error('Metric name cannot be empty');
        }
        // Validate metric name format (alphanumeric with underscores and dots)
        if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(name)) {
            throw new Error('Metric name must start with a letter and contain only alphanumeric characters, underscores, and dots');
        }
        return new MetricName(name);
    }

    get value(): string {
        return this._value;
    }

    equals(other: MetricName): boolean {
        return this._value === other._value;
    }
}

/**
 * Metric Dimensions Value Object
 */
export interface MetricDimensionsData {
    requestType?: string;
    status?: string;
    providerId?: string;
    subscriberId?: string;
    region?: string;
    category?: string;
    [key: string]: string | undefined;
}

export class MetricDimensions {
    private constructor(private readonly _data: MetricDimensionsData) {}

    static create(data?: MetricDimensionsData): MetricDimensions {
        return new MetricDimensions(data || {});
    }

    get(key: string): string | undefined {
        return this._data[key];
    }

    has(key: string): boolean {
        return key in this._data && this._data[key] !== undefined;
    }

    toJSON(): MetricDimensionsData {
        return { ...this._data };
    }

    matches(filter: Partial<MetricDimensionsData>): boolean {
        for (const [key, value] of Object.entries(filter)) {
            if (value !== undefined && this._data[key] !== value) {
                return false;
            }
        }
        return true;
    }
}

/**
 * Time Range Value Object
 */
export class TimeRange {
    private constructor(
        private readonly _start: Date,
        private readonly _end: Date,
    ) {}

    static create(start: Date, end: Date): TimeRange {
        if (start > end) {
            throw new Error('Start date must be before end date');
        }
        return new TimeRange(start, end);
    }

    static lastDays(days: number): TimeRange {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        return new TimeRange(start, end);
    }

    static lastHours(hours: number): TimeRange {
        const end = new Date();
        const start = new Date();
        start.setHours(start.getHours() - hours);
        return new TimeRange(start, end);
    }

    static thisMonth(): TimeRange {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return new TimeRange(start, end);
    }

    static thisYear(): TimeRange {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        return new TimeRange(start, end);
    }

    get start(): Date {
        return this._start;
    }

    get end(): Date {
        return this._end;
    }

    get durationMs(): number {
        return this._end.getTime() - this._start.getTime();
    }

    get durationDays(): number {
        return Math.ceil(this.durationMs / (1000 * 60 * 60 * 24));
    }

    contains(date: Date): boolean {
        return date >= this._start && date <= this._end;
    }
}
