// src/core/domain/membership/repositories/membership.repository.ts
import { Membership } from '../entities/membership.entity';

export interface IMembershipRepository {
    create(membership: Membership): Promise<Membership>;
    findByUserId(userId: string): Promise<Membership | null>;
    findActiveByUserId(userId: string): Promise<Membership | null>;
    update(membership: Membership): Promise<Membership>;
    deactivate(membershipId: string): Promise<void>;
}
