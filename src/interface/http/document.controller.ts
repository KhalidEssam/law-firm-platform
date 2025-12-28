// ============================================
// DOCUMENT CONTROLLER
// src/interface/http/document.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Use Cases
import {
  UploadDocumentUseCase,
  VerifyDocumentUseCase,
  DeleteDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsUseCase,
} from '../../core/application/document/use-cases';

// Value Objects
import {
  DocumentCategory,
  DocumentRequestType,
  DocumentVerificationStatus,
  DEFAULT_MAX_FILE_SIZE,
} from '../../core/domain/document/value-objects/document.vo';

// Storage Service
import { DocumentStorageService } from '../../core/application/document/services/storage/document-storage.service';

@Controller('documents')
export class DocumentController {
  constructor(
    private readonly uploadDocument: UploadDocumentUseCase,
    private readonly verifyDocument: VerifyDocumentUseCase,
    private readonly deleteDocument: DeleteDocumentUseCase,
    private readonly getDocument: GetDocumentUseCase,
    private readonly listDocuments: ListDocumentsUseCase,
    private readonly storageService: DocumentStorageService,
  ) {}

  // ============================================
  // STORAGE STATUS
  // ============================================

  @Get('storage/status')
  @Roles('admin')
  async getStorageStatus() {
    return this.storageService.getStatus();
  }

  // ============================================
  // UPLOAD ENDPOINTS
  // ============================================

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: DEFAULT_MAX_FILE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('requestType') requestType?: string,
    @Body('requestId') requestId?: string,
    @Body('category') category?: string,
    @Body('description') description?: string,
    @CurrentUser() user?: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.uploadDocument.execute({
      uploadedBy: user?.id || 'anonymous',
      file: {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      requestType: requestType as DocumentRequestType,
      requestId,
      category: category as DocumentCategory,
      description,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      id: result.document!.id,
      fileName: result.document!.fileName,
      fileUrl: result.document!.fileUrl,
      fileType: result.document!.fileType,
      fileSize: result.document!.fileSize,
      uploadedAt: result.document!.uploadedAt,
    };
  }

  @Post('upload/:requestType/:requestId')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadToRequest(
    @Param('requestType') requestType: string,
    @Param('requestId') requestId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: DEFAULT_MAX_FILE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('category') category?: string,
    @Body('description') description?: string,
    @CurrentUser() user?: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.uploadDocument.execute({
      uploadedBy: user?.id || 'anonymous',
      file: {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      requestType: requestType as DocumentRequestType,
      requestId,
      category: category as DocumentCategory,
      description,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      id: result.document!.id,
      fileName: result.document!.fileName,
      fileUrl: result.document!.fileUrl,
      fileType: result.document!.fileType,
      fileSize: result.document!.fileSize,
      requestType,
      requestId,
      uploadedAt: result.document!.uploadedAt,
    };
  }

  // ============================================
  // READ ENDPOINTS
  // ============================================

  @Get()
  async findAll(
    @Query('uploadedBy') uploadedBy?: string,
    @Query('category') category?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('isVerified') isVerified?: string,
    @Query('consultationId') consultationId?: string,
    @Query('legalOpinionId') legalOpinionId?: string,
    @Query('serviceRequestId') serviceRequestId?: string,
    @Query('litigationCaseId') litigationCaseId?: string,
    @Query('supportTicketId') supportTicketId?: string,
    @Query('searchTerm') searchTerm?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.listDocuments.execute({
      uploadedBy,
      category: category as DocumentCategory,
      verificationStatus: verificationStatus as DocumentVerificationStatus,
      isVerified: isVerified !== undefined ? isVerified === 'true' : undefined,
      consultationId,
      legalOpinionId,
      serviceRequestId,
      litigationCaseId,
      supportTicketId,
      searchTerm,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      data: result.documents.map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        category: doc.category,
        description: doc.description,
        isVerified: doc.isVerified,
        verificationStatus: doc.verificationStatus,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  @Get('pending-verification')
  @Roles('admin', 'verifier')
  async getPendingVerification(@Query('limit') limit?: string) {
    const documents = await this.listDocuments.listPendingVerification(
      limit ? parseInt(limit, 10) : undefined,
    );

    return {
      data: documents.map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
        requestType: doc.requestType,
        requestId: doc.requestId,
      })),
    };
  }

  @Get('request/:requestType/:requestId')
  async getByRequest(
    @Param('requestType') requestType: string,
    @Param('requestId') requestId: string,
  ) {
    const documents = await this.getDocument.getByRequest(
      requestType as DocumentRequestType,
      requestId,
    );

    return {
      data: documents.map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        description: doc.description,
        isVerified: doc.isVerified,
        uploadedAt: doc.uploadedAt,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const doc = await this.getDocument.execute(id);
    return {
      id: doc.id,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      category: doc.category,
      description: doc.description,
      isVerified: doc.isVerified,
      verificationStatus: doc.verificationStatus,
      verifiedBy: doc.verifiedBy,
      verifiedAt: doc.verifiedAt,
      verificationNotes: doc.verificationNotes,
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.uploadedAt,
      requestType: doc.requestType,
      requestId: doc.requestId,
    };
  }

  @Get(':id/signed-url')
  async getSignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const signedUrl = await this.getDocument.getSignedUrl(
      id,
      expiresIn ? parseInt(expiresIn, 10) : undefined,
    );

    return { signedUrl };
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string) {
    return this.getDocument.getStatistics({ uploadedBy: id });
  }

  // ============================================
  // VERIFICATION ENDPOINTS
  // ============================================

  @Put(':id/verify')
  @Roles('admin', 'verifier')
  @Permissions('documents:verify')
  async verify(
    @Param('id') id: string,
    @Body('notes') notes?: string,
    @CurrentUser() user?: { id: string },
  ) {
    const doc = await this.verifyDocument.verify({
      documentId: id,
      verifiedBy: user?.id || 'system',
      notes,
    });

    return {
      id: doc.id,
      isVerified: doc.isVerified,
      verificationStatus: doc.verificationStatus,
      verifiedBy: doc.verifiedBy,
      verifiedAt: doc.verifiedAt,
    };
  }

  @Put(':id/reject')
  @Roles('admin', 'verifier')
  @Permissions('documents:verify')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user?: { id: string },
  ) {
    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const doc = await this.verifyDocument.reject({
      documentId: id,
      rejectedBy: user?.id || 'system',
      reason,
    });

    return {
      id: doc.id,
      isVerified: doc.isVerified,
      verificationStatus: doc.verificationStatus,
      verifiedBy: doc.verifiedBy,
      verifiedAt: doc.verifiedAt,
      verificationNotes: doc.verificationNotes,
    };
  }

  @Put('verify/bulk')
  @Roles('admin', 'verifier')
  @Permissions('documents:verify')
  async verifyBulk(
    @Body('documentIds') documentIds: string[],
    @Body('notes') notes?: string,
    @CurrentUser() user?: { id: string },
  ) {
    if (!documentIds || documentIds.length === 0) {
      throw new BadRequestException('Document IDs are required');
    }

    const result = await this.verifyDocument.verifyMultiple({
      documentIds,
      verifiedBy: user?.id || 'system',
      notes,
    });

    return {
      verified: result.verified,
      failed: result.failed,
    };
  }

  // ============================================
  // DELETE ENDPOINTS
  // ============================================

  @Delete(':id')
  @Permissions('documents:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Query('hardDelete') hardDelete?: string,
    @CurrentUser() user?: { id: string },
  ) {
    await this.deleteDocument.execute({
      documentId: id,
      deletedBy: user?.id || 'system',
      hardDelete: hardDelete === 'true',
    });
  }

  @Delete('request/:requestType/:requestId')
  @Permissions('documents:delete')
  async removeByRequest(
    @Param('requestType') requestType: string,
    @Param('requestId') requestId: string,
    @Query('hardDelete') hardDelete?: string,
    @CurrentUser() user?: { id: string },
  ) {
    const count = await this.deleteDocument.deleteByRequest({
      requestType: requestType as DocumentRequestType,
      requestId,
      deletedBy: user?.id || 'system',
      hardDelete: hardDelete === 'true',
    });

    return { deleted: count };
  }

  @Put(':id/restore')
  @Roles('admin')
  @Permissions('documents:restore')
  async restore(@Param('id') id: string) {
    await this.deleteDocument.restore(id);
    return { restored: true };
  }
}
