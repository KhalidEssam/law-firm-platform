// ============================================
// CLOUDINARY STORAGE SERVICE
// Primary storage provider for document uploads
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { StorageProvider, UploadResult } from '../../../../domain/document/value-objects/document.vo';
import {
    IStorageProvider,
    FileUploadInput,
    FileDeleteOptions,
    SignedUrlOptions,
} from './storage-provider.interface';

/**
 * Cloudinary configuration
 */
export interface CloudinaryConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder?: string;
    secure?: boolean;
}

@Injectable()
export class CloudinaryStorageService implements IStorageProvider {
    private readonly logger = new Logger(CloudinaryStorageService.name);
    private readonly config: CloudinaryConfig | null;
    private isInitialized = false;

    constructor(private readonly configService: ConfigService) {
        this.config = this.loadConfig();
        if (this.config) {
            this.initialize();
        }
    }

    private loadConfig(): CloudinaryConfig | null {
        const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

        if (!cloudName || !apiKey || !apiSecret) {
            this.logger.warn('Cloudinary credentials not configured. Document upload will be disabled.');
            return null;
        }

        return {
            cloudName,
            apiKey,
            apiSecret,
            folder: this.configService.get<string>('CLOUDINARY_FOLDER', 'exoln-lex'),
            secure: true,
        };
    }

    private initialize(): void {
        if (!this.config) return;

        try {
            cloudinary.config({
                cloud_name: this.config.cloudName,
                api_key: this.config.apiKey,
                api_secret: this.config.apiSecret,
                secure: this.config.secure,
            });
            this.isInitialized = true;
            this.logger.log('Cloudinary storage service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Cloudinary:', error);
        }
    }

    getProvider(): StorageProvider {
        return StorageProvider.CLOUDINARY;
    }

    isConfigured(): boolean {
        return this.isInitialized && this.config !== null;
    }

    async upload(input: FileUploadInput): Promise<UploadResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                fileUrl: '',
                provider: StorageProvider.CLOUDINARY,
                error: 'Cloudinary is not configured',
            };
        }

        try {
            const folder = input.folder || this.config!.folder;
            const resourceType = this.getResourceType(input.mimeType);

            // Convert buffer to base64 data URI
            const base64Data = `data:${input.mimeType};base64,${input.buffer.toString('base64')}`;

            const result: UploadApiResponse = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload(
                    base64Data,
                    {
                        folder,
                        resource_type: resourceType,
                        public_id: this.generatePublicId(input.fileName),
                        tags: input.tags,
                        context: input.metadata,
                        use_filename: true,
                        unique_filename: true,
                        overwrite: false,
                    },
                    (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                        if (error) reject(error);
                        else resolve(result!);
                    }
                );
            });

            this.logger.log(`File uploaded to Cloudinary: ${result.public_id}`);

            return {
                success: true,
                fileUrl: result.secure_url,
                publicId: result.public_id,
                provider: StorageProvider.CLOUDINARY,
                metadata: {
                    format: result.format,
                    bytes: result.bytes,
                    width: result.width,
                    height: result.height,
                    resourceType: result.resource_type,
                    createdAt: result.created_at,
                },
            };
        } catch (error: any) {
            this.logger.error('Cloudinary upload failed:', error);
            return {
                success: false,
                fileUrl: '',
                provider: StorageProvider.CLOUDINARY,
                error: error.message || 'Upload failed',
            };
        }
    }

    async delete(options: FileDeleteOptions): Promise<boolean> {
        if (!this.isConfigured()) {
            this.logger.warn('Cloudinary is not configured, cannot delete file');
            return false;
        }

        const publicId = options.publicId || this.extractPublicIdFromUrl(options.fileUrl);

        if (!publicId) {
            this.logger.warn('No public_id provided for deletion');
            return false;
        }

        try {
            const result = await cloudinary.uploader.destroy(publicId);
            const success = result.result === 'ok';

            if (success) {
                this.logger.log(`File deleted from Cloudinary: ${publicId}`);
            } else {
                this.logger.warn(`Failed to delete file from Cloudinary: ${publicId}, result: ${result.result}`);
            }

            return success;
        } catch (error: any) {
            this.logger.error(`Cloudinary deletion failed for ${publicId}:`, error);
            return false;
        }
    }

    async getSignedUrl(options: SignedUrlOptions): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error('Cloudinary is not configured');
        }

        const expiresAt = Math.floor(Date.now() / 1000) + (options.expiresIn || 3600);

        return cloudinary.url(options.publicId, {
            secure: true,
            sign_url: true,
            type: 'authenticated',
            expires_at: expiresAt,
            ...options.transformation,
        });
    }

    async getMetadata(publicId: string): Promise<Record<string, any> | null> {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            const result = await cloudinary.api.resource(publicId);
            return {
                publicId: result.public_id,
                format: result.format,
                bytes: result.bytes,
                width: result.width,
                height: result.height,
                resourceType: result.resource_type,
                createdAt: result.created_at,
                secureUrl: result.secure_url,
            };
        } catch (error) {
            this.logger.error(`Failed to get metadata for ${publicId}:`, error);
            return null;
        }
    }

    /**
     * Get Cloudinary resource type from MIME type
     */
    private getResourceType(mimeType: string): 'image' | 'video' | 'raw' | 'auto' {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        return 'raw'; // For documents (PDF, DOCX, etc.)
    }

    /**
     * Generate a unique public_id from filename
     */
    private generatePublicId(fileName: string): string {
        const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
        const sanitized = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        const timestamp = Date.now();
        return `${sanitized}_${timestamp}`;
    }

    /**
     * Extract public_id from Cloudinary URL
     */
    private extractPublicIdFromUrl(url?: string): string | null {
        if (!url) return null;

        try {
            // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    }
}
