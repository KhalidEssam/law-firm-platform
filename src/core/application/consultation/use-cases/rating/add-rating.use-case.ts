// ============================================
// ADD RATING USE CASE
// ============================================

import {
  ConsultationId,
  UserId,
} from '../../../../domain/consultation/value-objects/consultation-request-domain';

import {
  RequestRating,
  RatingValue,
  RatingComment,
} from '../../../../domain/consultation/entities/consultation-request-entities';

import {
  IConsultationRequestRepository,
  IRequestRatingRepository,
} from '../../ports/repository';

import {
  AddRatingDTO,
  RatingResponseDTO,
} from '../../consultation request.dtos';

export class AddRatingUseCase {
  constructor(
    private readonly consultationRepo: IConsultationRequestRepository,
    private readonly ratingRepo: IRequestRatingRepository,
  ) {}

  async execute(dto: AddRatingDTO): Promise<RatingResponseDTO> {
    const consultationId = ConsultationId.create(dto.consultationId);

    // Validate consultation exists and is completed
    const consultation = await this.consultationRepo.findById(consultationId);
    if (!consultation) {
      throw new Error(
        `Consultation request with ID ${dto.consultationId} not found`,
      );
    }

    if (!consultation.status.isCompleted()) {
      throw new Error('Can only rate completed consultations');
    }

    // Check if already rated
    const existingRating = await this.ratingRepo.exists(consultationId);
    if (existingRating) {
      throw new Error('This consultation has already been rated');
    }

    // Create rating entity
    const rating = RequestRating.create({
      consultationId,
      subscriberId: UserId.create(dto.subscriberId),
      rating: RatingValue.create(dto.rating),
      comment: dto.comment ? RatingComment.create(dto.comment) : undefined,
    });

    // Save
    const saved = await this.ratingRepo.create(rating);

    return this.toDTO(saved);
  }

  private toDTO(rating: RequestRating): RatingResponseDTO {
    return {
      id: rating.id.getValue(),
      consultationId: rating.consultationId.getValue(),
      subscriberId: rating.subscriberId.getValue(),
      rating: rating.rating.getValue(),
      comment: rating.comment?.getValue(),
      createdAt: rating.createdAt,
    };
  }
}
