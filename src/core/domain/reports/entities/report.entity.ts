// src/core/domain/reports/entities/report.entity.ts

import crypto from 'crypto';
import {
    ReportType,
    JobStatus,
    ReportName,
    ReportParameters,
    ReportParametersData,
} from '../value-objects/report.vo';

export interface ReportProps {
    id?: string;
    name: string;
    reportType: ReportType;
    parameters?: ReportParametersData;
    generatedBy?: string;
    generatedAt?: Date;
    fileUrl?: string;
    status?: JobStatus;
    resultData?: Record<string, unknown>;
    errorMessage?: string;
}

/**
 * Report Entity - Aggregate Root
 * Represents a generated report (financial, operational, performance, compliance)
 */
export class Report {
    private constructor(
        public readonly id: string,
        private _name: ReportName,
        private _reportType: ReportType,
        private _parameters: ReportParameters,
        private _generatedBy: string | null,
        private _generatedAt: Date,
        private _fileUrl: string | null,
        private _status: JobStatus,
        private _resultData: Record<string, unknown> | null,
        private _errorMessage: string | null,
    ) {}

    // ============================================
    // FACTORY METHODS
    // ============================================

    static create(props: ReportProps): Report {
        return new Report(
            props.id || crypto.randomUUID(),
            ReportName.create(props.name),
            props.reportType,
            ReportParameters.create(props.parameters),
            props.generatedBy || null,
            props.generatedAt || new Date(),
            props.fileUrl || null,
            props.status || JobStatus.PENDING,
            null,
            null,
        );
    }

    static rehydrate(props: Required<Omit<ReportProps, 'resultData' | 'errorMessage'>> & {
        resultData?: Record<string, unknown>;
        errorMessage?: string;
    }): Report {
        return new Report(
            props.id,
            ReportName.create(props.name),
            props.reportType,
            ReportParameters.create(props.parameters),
            props.generatedBy,
            props.generatedAt,
            props.fileUrl,
            props.status,
            props.resultData || null,
            props.errorMessage || null,
        );
    }

    // ============================================
    // GETTERS
    // ============================================

    get name(): string {
        return this._name.value;
    }

    get reportType(): ReportType {
        return this._reportType;
    }

    get parameters(): ReportParameters {
        return this._parameters;
    }

    get generatedBy(): string | null {
        return this._generatedBy;
    }

    get generatedAt(): Date {
        return this._generatedAt;
    }

    get fileUrl(): string | null {
        return this._fileUrl;
    }

    get status(): JobStatus {
        return this._status;
    }

    get resultData(): Record<string, unknown> | null {
        return this._resultData;
    }

    get errorMessage(): string | null {
        return this._errorMessage;
    }

    // ============================================
    // DOMAIN METHODS
    // ============================================

    /**
     * Start processing the report
     */
    startProcessing(): void {
        if (this._status !== JobStatus.PENDING && this._status !== JobStatus.RETRYING) {
            throw new Error(`Cannot start processing report in ${this._status} status`);
        }
        this._status = JobStatus.PROCESSING;
    }

    /**
     * Mark report as completed with result data
     */
    complete(resultData: Record<string, unknown>, fileUrl?: string): void {
        if (this._status !== JobStatus.PROCESSING) {
            throw new Error(`Cannot complete report in ${this._status} status`);
        }
        this._status = JobStatus.COMPLETED;
        this._resultData = resultData;
        this._fileUrl = fileUrl || null;
        this._generatedAt = new Date();
    }

    /**
     * Mark report as failed with error message
     */
    fail(errorMessage: string): void {
        if (this._status !== JobStatus.PROCESSING) {
            throw new Error(`Cannot fail report in ${this._status} status`);
        }
        this._status = JobStatus.FAILED;
        this._errorMessage = errorMessage;
    }

    /**
     * Retry generating the report
     */
    retry(): void {
        if (this._status !== JobStatus.FAILED) {
            throw new Error(`Cannot retry report in ${this._status} status`);
        }
        this._status = JobStatus.RETRYING;
        this._errorMessage = null;
    }

    /**
     * Set file URL (for stored reports)
     */
    setFileUrl(url: string): void {
        this._fileUrl = url;
    }

    // ============================================
    // QUERY METHODS
    // ============================================

    isCompleted(): boolean {
        return this._status === JobStatus.COMPLETED;
    }

    isFailed(): boolean {
        return this._status === JobStatus.FAILED;
    }

    isPending(): boolean {
        return this._status === JobStatus.PENDING;
    }

    isProcessing(): boolean {
        return this._status === JobStatus.PROCESSING;
    }

    // ============================================
    // SERIALIZATION
    // ============================================

    toObject(): {
        id: string;
        name: string;
        reportType: ReportType;
        parameters: ReportParametersData;
        generatedBy: string | null;
        generatedAt: Date;
        fileUrl: string | null;
        status: JobStatus;
        resultData: Record<string, unknown> | null;
        errorMessage: string | null;
    } {
        return {
            id: this.id,
            name: this._name.value,
            reportType: this._reportType,
            parameters: this._parameters.toJSON(),
            generatedBy: this._generatedBy,
            generatedAt: this._generatedAt,
            fileUrl: this._fileUrl,
            status: this._status,
            resultData: this._resultData,
            errorMessage: this._errorMessage,
        };
    }
}
