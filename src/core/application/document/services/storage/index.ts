// ============================================
// STORAGE SERVICES BARREL EXPORT
// ============================================

// Types - use export type for interfaces
export type {
  IStorageProvider,
  FileUploadInput,
  FileDeleteOptions,
  SignedUrlOptions,
  StorageProviderConfig,
} from './storage-provider.interface';

// Symbols for DI - exported as values
export {
  STORAGE_PROVIDER,
  CLOUDINARY_PROVIDER,
  S3_PROVIDER,
} from './storage-provider.interface';

export {
  CloudinaryStorageService,
  type CloudinaryConfig,
} from './cloudinary.service';
export { S3StorageService, type S3Config } from './s3.service';
export {
  DocumentStorageService,
  type StorageServiceConfig,
} from './document-storage.service';
