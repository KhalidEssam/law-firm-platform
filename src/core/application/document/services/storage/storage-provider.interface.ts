// ============================================
// STORAGE PROVIDER INTERFACE
// Base interface for all storage providers
// ============================================

import {
  StorageProvider,
  UploadResult,
} from '../../../../domain/document/value-objects/document.vo';

/**
 * File upload input
 */
export interface FileUploadInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
  tags?: string[];
  metadata?: Record<string, string>;
}

/**
 * File deletion options
 */
export interface FileDeleteOptions {
  publicId?: string;
  fileUrl?: string;
}

/**
 * Signed URL options for secure access
 */
export interface SignedUrlOptions {
  publicId: string;
  expiresIn?: number; // seconds
  transformation?: Record<string, any>;
}

/**
 * Storage provider configuration
 */
export interface StorageProviderConfig {
  provider: StorageProvider;
  isEnabled: boolean;
  credentials: Record<string, string>;
  options?: Record<string, any>;
}

/**
 * Storage Provider Interface
 * All storage implementations must implement this interface
 */
export interface IStorageProvider {
  /**
   * Get the provider type
   */
  getProvider(): StorageProvider;

  /**
   * Check if provider is configured and ready
   */
  isConfigured(): boolean;

  /**
   * Upload a file to storage
   */
  upload(input: FileUploadInput): Promise<UploadResult>;

  /**
   * Delete a file from storage
   */
  delete(options: FileDeleteOptions): Promise<boolean>;

  /**
   * Generate a signed URL for secure access
   */
  getSignedUrl?(options: SignedUrlOptions): Promise<string>;

  /**
   * Get file metadata from storage
   */
  getMetadata?(publicId: string): Promise<Record<string, any> | null>;
}

/**
 * DI Token for storage provider
 */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
export const CLOUDINARY_PROVIDER = Symbol('CLOUDINARY_PROVIDER');
export const S3_PROVIDER = Symbol('S3_PROVIDER');
