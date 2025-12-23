// ============================================
// DOCUMENT STORAGE SERVICE (FACADE)
// Unified interface for multiple storage providers
// ============================================

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider, UploadResult } from '../../../../domain/document/value-objects/document.vo';
import type {
    IStorageProvider,
    FileUploadInput,
    FileDeleteOptions,
    SignedUrlOptions,
} from './storage-provider.interface';
import {
    CLOUDINARY_PROVIDER,
    S3_PROVIDER,
} from './storage-provider.interface';

/**
 * Storage service configuration
 */
export interface StorageServiceConfig {
    defaultProvider: StorageProvider;
    fallbackProvider?: StorageProvider;
    enableFallback: boolean;
}

@Injectable()
export class DocumentStorageService {
    private readonly logger = new Logger(DocumentStorageService.name);
    private readonly providers: Map<StorageProvider, IStorageProvider>;
    private readonly config: StorageServiceConfig;

    constructor(
        private readonly configService: ConfigService,
        @Optional() @Inject(CLOUDINARY_PROVIDER) private readonly cloudinaryProvider?: IStorageProvider,
        @Optional() @Inject(S3_PROVIDER) private readonly s3Provider?: IStorageProvider,
    ) {
        this.providers = new Map();
        this.config = this.loadConfig();
        this.registerProviders();
    }

    private loadConfig(): StorageServiceConfig {
        const defaultProviderStr = this.configService.get<string>(
            'STORAGE_DEFAULT_PROVIDER',
            'cloudinary'
        );

        const fallbackProviderStr = this.configService.get<string>('STORAGE_FALLBACK_PROVIDER');

        return {
            defaultProvider: this.parseProvider(defaultProviderStr),
            fallbackProvider: fallbackProviderStr
                ? this.parseProvider(fallbackProviderStr)
                : undefined,
            enableFallback: this.configService.get<boolean>('STORAGE_ENABLE_FALLBACK', false),
        };
    }

    private parseProvider(value: string): StorageProvider {
        switch (value.toLowerCase()) {
            case 'cloudinary':
                return StorageProvider.CLOUDINARY;
            case 's3':
            case 'aws_s3':
                return StorageProvider.AWS_S3;
            case 'local':
                return StorageProvider.LOCAL;
            default:
                return StorageProvider.CLOUDINARY;
        }
    }

    private registerProviders(): void {
        if (this.cloudinaryProvider) {
            this.providers.set(StorageProvider.CLOUDINARY, this.cloudinaryProvider);
            this.logger.log('Registered Cloudinary storage provider');
        }

        if (this.s3Provider) {
            this.providers.set(StorageProvider.AWS_S3, this.s3Provider);
            this.logger.log('Registered AWS S3 storage provider');
        }

        if (this.providers.size === 0) {
            this.logger.warn('No storage providers registered. Document upload will fail.');
        }
    }

    /**
     * Get the default storage provider
     */
    getDefaultProvider(): IStorageProvider | null {
        return this.getProvider(this.config.defaultProvider);
    }

    /**
     * Get a specific storage provider
     */
    getProvider(provider: StorageProvider): IStorageProvider | null {
        return this.providers.get(provider) || null;
    }

    /**
     * Check if any provider is available
     */
    hasAvailableProvider(): boolean {
        for (const provider of this.providers.values()) {
            if (provider.isConfigured()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all configured providers
     */
    getConfiguredProviders(): StorageProvider[] {
        const configured: StorageProvider[] = [];
        for (const [type, provider] of this.providers) {
            if (provider.isConfigured()) {
                configured.push(type);
            }
        }
        return configured;
    }

    /**
     * Upload a file using the default provider with fallback
     */
    async upload(input: FileUploadInput): Promise<UploadResult> {
        // Try default provider first
        const defaultProvider = this.getProvider(this.config.defaultProvider);

        if (defaultProvider?.isConfigured()) {
            const result = await defaultProvider.upload(input);
            if (result.success) {
                return result;
            }

            this.logger.warn(
                `Default provider ${this.config.defaultProvider} failed: ${result.error}`
            );
        }

        // Try fallback provider if enabled
        if (this.config.enableFallback && this.config.fallbackProvider) {
            const fallbackProvider = this.getProvider(this.config.fallbackProvider);

            if (fallbackProvider?.isConfigured()) {
                this.logger.log(`Trying fallback provider: ${this.config.fallbackProvider}`);
                const result = await fallbackProvider.upload(input);

                if (result.success) {
                    return result;
                }

                this.logger.warn(
                    `Fallback provider ${this.config.fallbackProvider} failed: ${result.error}`
                );
            }
        }

        // All providers failed
        return {
            success: false,
            fileUrl: '',
            provider: this.config.defaultProvider,
            error: 'No configured storage provider available for upload',
        };
    }

    /**
     * Upload to a specific provider
     */
    async uploadTo(provider: StorageProvider, input: FileUploadInput): Promise<UploadResult> {
        const storageProvider = this.getProvider(provider);

        if (!storageProvider?.isConfigured()) {
            return {
                success: false,
                fileUrl: '',
                provider,
                error: `Storage provider ${provider} is not configured`,
            };
        }

        return storageProvider.upload(input);
    }

    /**
     * Delete a file from storage
     */
    async delete(provider: StorageProvider, options: FileDeleteOptions): Promise<boolean> {
        const storageProvider = this.getProvider(provider);

        if (!storageProvider?.isConfigured()) {
            this.logger.warn(`Cannot delete: provider ${provider} is not configured`);
            return false;
        }

        return storageProvider.delete(options);
    }

    /**
     * Get a signed URL for secure file access
     */
    async getSignedUrl(
        provider: StorageProvider,
        options: SignedUrlOptions
    ): Promise<string | null> {
        const storageProvider = this.getProvider(provider);

        if (!storageProvider?.isConfigured() || !storageProvider.getSignedUrl) {
            return null;
        }

        try {
            return await storageProvider.getSignedUrl(options);
        } catch (error) {
            this.logger.error(`Failed to get signed URL from ${provider}:`, error);
            return null;
        }
    }

    /**
     * Get file metadata from storage
     */
    async getMetadata(
        provider: StorageProvider,
        publicId: string
    ): Promise<Record<string, any> | null> {
        const storageProvider = this.getProvider(provider);

        if (!storageProvider?.isConfigured() || !storageProvider.getMetadata) {
            return null;
        }

        return storageProvider.getMetadata(publicId);
    }

    /**
     * Get storage service status
     */
    getStatus(): {
        defaultProvider: StorageProvider;
        configuredProviders: StorageProvider[];
        fallbackEnabled: boolean;
        fallbackProvider?: StorageProvider;
    } {
        return {
            defaultProvider: this.config.defaultProvider,
            configuredProviders: this.getConfiguredProviders(),
            fallbackEnabled: this.config.enableFallback,
            fallbackProvider: this.config.fallbackProvider,
        };
    }
}
