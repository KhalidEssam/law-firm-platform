// ============================================
// DOCUMENT MODULE
// src/infrastructure/modules/document.module.ts
// ============================================

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Prisma
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

// Controllers
import { DocumentController } from '../../interface/http/document.controller';

// Repositories
import { PrismaDocumentRepository } from '../../infrastructure/persistence/document/prisma.repository';
import { DOCUMENT_REPOSITORY } from '../../core/domain/document/ports/document.repository';

// Storage Services
import {
  CloudinaryStorageService,
  S3StorageService,
  DocumentStorageService,
  CLOUDINARY_PROVIDER,
  S3_PROVIDER,
} from '../../core/application/document/services/storage';

// Notification Service
import { DocumentNotificationService } from '../../core/application/document/services/document-notification.service';

// Use Cases
import {
  UploadDocumentUseCase,
  VerifyDocumentUseCase,
  DeleteDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsUseCase,
} from '../../core/application/document/use-cases';

// Notification Module (optional integration)
import { NotificationModule } from '../../interface/notification/notification.module';

@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => NotificationModule)],
  controllers: [DocumentController],
  providers: [
    // ============================================
    // REPOSITORIES
    // ============================================
    {
      provide: DOCUMENT_REPOSITORY,
      useFactory: (prisma: PrismaService) => {
        return new PrismaDocumentRepository(prisma);
      },
      inject: [PrismaService],
    },

    // ============================================
    // STORAGE PROVIDERS
    // ============================================
    {
      provide: CLOUDINARY_PROVIDER,
      useClass: CloudinaryStorageService,
    },
    {
      provide: S3_PROVIDER,
      useClass: S3StorageService,
    },
    DocumentStorageService,

    // ============================================
    // NOTIFICATION SERVICE
    // ============================================
    DocumentNotificationService,

    // ============================================
    // USE CASES
    // ============================================
    UploadDocumentUseCase,
    VerifyDocumentUseCase,
    DeleteDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
  ],
  exports: [
    DOCUMENT_REPOSITORY,
    DocumentStorageService,
    DocumentNotificationService,
    // Export use cases for cross-module integration
    UploadDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
    VerifyDocumentUseCase,
    DeleteDocumentUseCase,
  ],
})
export class DocumentModule {}
