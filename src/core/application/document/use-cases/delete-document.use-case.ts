// ============================================
// DELETE DOCUMENT USE CASE
// ============================================

import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import type { IDocumentRepository } from '../../../domain/document/ports/document.repository';
import { DOCUMENT_REPOSITORY } from '../../../domain/document/ports/document.repository';
import { DocumentRequestType } from '../../../domain/document/value-objects/document.vo';
import { DocumentStorageService } from '../services/storage/document-storage.service';

export interface DeleteDocumentDTO {
    documentId: string;
    deletedBy: string;
    hardDelete?: boolean; // If true, permanently delete from storage
}

export interface DeleteDocumentsByRequestDTO {
    requestType: DocumentRequestType;
    requestId: string;
    deletedBy: string;
    hardDelete?: boolean;
}

@Injectable()
export class DeleteDocumentUseCase {
    private readonly logger = new Logger(DeleteDocumentUseCase.name);

    constructor(
        @Inject(DOCUMENT_REPOSITORY)
        private readonly repository: IDocumentRepository,
        private readonly storageService: DocumentStorageService,
    ) {}

    async execute(dto: DeleteDocumentDTO): Promise<void> {
        const document = await this.repository.findById(dto.documentId);

        if (!document) {
            throw new NotFoundException(`Document with ID "${dto.documentId}" not found`);
        }

        if (dto.hardDelete) {
            // Delete from storage provider
            const deleted = await this.storageService.delete(document.storageProvider, {
                publicId: document.publicId,
                fileUrl: document.fileUrl,
            });

            if (!deleted) {
                this.logger.warn(
                    `Failed to delete file from storage for document ${dto.documentId}`
                );
            }

            // Hard delete from database
            await this.repository.delete(dto.documentId);

            this.logger.log(
                `Document ${dto.documentId} permanently deleted by ${dto.deletedBy}`
            );
        } else {
            // Soft delete
            await this.repository.softDelete(dto.documentId);

            this.logger.log(
                `Document ${dto.documentId} soft deleted by ${dto.deletedBy}`
            );
        }
    }

    async deleteByRequest(dto: DeleteDocumentsByRequestDTO): Promise<number> {
        const documents = await this.repository.findByRequest({
            requestType: dto.requestType,
            requestId: dto.requestId,
            includeDeleted: false,
        });

        if (documents.length === 0) {
            return 0;
        }

        let deletedCount = 0;

        for (const document of documents) {
            try {
                await this.execute({
                    documentId: document.id,
                    deletedBy: dto.deletedBy,
                    hardDelete: dto.hardDelete,
                });
                deletedCount++;
            } catch (error: any) {
                this.logger.warn(
                    `Failed to delete document ${document.id}: ${error.message}`
                );
            }
        }

        this.logger.log(
            `Deleted ${deletedCount}/${documents.length} documents for ${dto.requestType} ${dto.requestId}`
        );

        return deletedCount;
    }

    async restore(documentId: string): Promise<void> {
        const document = await this.repository.findById(documentId);

        if (!document) {
            throw new NotFoundException(`Document with ID "${documentId}" not found`);
        }

        if (!document.isDeleted) {
            this.logger.warn(`Document ${documentId} is not deleted`);
            return;
        }

        document.restore();
        await this.repository.update(document);

        this.logger.log(`Document ${documentId} restored`);
    }
}
