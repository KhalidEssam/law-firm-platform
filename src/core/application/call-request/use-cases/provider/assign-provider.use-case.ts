// ============================================
// ASSIGN PROVIDER USE CASE
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import { type ICallRequestRepository } from '../../ports/call-request.repository';
import { type IProviderValidationService } from '../../ports/provider-validation.port';
import { AssignProviderDto } from '../../dto/call-request.dto';

@Injectable()
export class AssignProviderUseCase {
  constructor(
    @Inject('ICallRequestRepository')
    private readonly callRequestRepo: ICallRequestRepository,
    @Inject('IProviderValidationService')
    private readonly providerValidation: IProviderValidationService,
  ) {}

  async execute(
    callRequestId: string,
    dto: AssignProviderDto,
  ): Promise<CallRequest> {
    const callRequest = await this.callRequestRepo.findById(callRequestId);
    if (!callRequest) {
      throw new NotFoundException(
        `Call request with ID ${callRequestId} not found`,
      );
    }

    // Validate that the provider is a valid ProviderUser linked to an approved ProviderProfile
    const validationResult =
      await this.providerValidation.validateProviderForAssignment(
        dto.providerId,
      );
    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.error);
    }

    callRequest.assignProvider(dto.providerId);

    return await this.callRequestRepo.update(callRequest);
  }
}
