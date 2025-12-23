// ============================================
// DOCUMENT USE CASES BARREL EXPORT
// ============================================

export {
    UploadDocumentUseCase,
    type UploadDocumentDTO,
    type UploadDocumentResult,
} from './upload-document.use-case';

export {
    VerifyDocumentUseCase,
    type VerifyDocumentDTO,
    type RejectDocumentDTO,
    type BulkVerifyDocumentsDTO,
} from './verify-document.use-case';

export {
    DeleteDocumentUseCase,
    type DeleteDocumentDTO,
    type DeleteDocumentsByRequestDTO,
} from './delete-document.use-case';

export { GetDocumentUseCase } from './get-document.use-case';

export {
    ListDocumentsUseCase,
    type ListDocumentsDTO,
    type ListDocumentsResult,
} from './list-documents.use-case';
