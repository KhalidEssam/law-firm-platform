// ============================================
// SPECIALIZATION REPOSITORY INTERFACES (PORTS)
// src/core/domain/specialization/ports/specialization.repository.ts
// ============================================

import { Specialization } from '../entities/specialization.entity';
import { ProviderSpecialization } from '../entities/provider-specialization.entity';

// ============================================
// DI TOKENS
// ============================================

export const SPECIALIZATION_REPOSITORY = Symbol('SPECIALIZATION_REPOSITORY');
export const PROVIDER_SPECIALIZATION_REPOSITORY = Symbol('PROVIDER_SPECIALIZATION_REPOSITORY');

// ============================================
// FILTER & PAGINATION INTERFACES
// ============================================

export interface ListSpecializationsOptions {
    category?: string;
    isActive?: boolean;
    searchTerm?: string;
    limit?: number;
    offset?: number;
}

export interface ListProviderSpecializationsOptions {
    providerId?: string;
    specializationId?: string;
    isCertified?: boolean;
    minExperienceYears?: number;
    limit?: number;
    offset?: number;
}

export interface ProvidersBySpecializationOptions {
    specializationId: string;
    isCertified?: boolean;
    minExperienceYears?: number;
    minSuccessRate?: number;
    limit?: number;
    offset?: number;
}

// ============================================
// SPECIALIZATION REPOSITORY INTERFACE
// ============================================

export interface ISpecializationRepository {
    // Basic CRUD
    create(specialization: Specialization): Promise<Specialization>;
    findById(id: string): Promise<Specialization | null>;
    findByName(name: string): Promise<Specialization | null>;
    update(specialization: Specialization): Promise<Specialization>;
    delete(id: string): Promise<void>;

    // Queries
    list(options?: ListSpecializationsOptions): Promise<Specialization[]>;
    count(options?: Omit<ListSpecializationsOptions, 'limit' | 'offset'>): Promise<number>;
    findByCategory(category: string): Promise<Specialization[]>;
    findActiveSpecializations(): Promise<Specialization[]>;
    existsByName(name: string): Promise<boolean>;

    // Category operations
    getCategories(): Promise<string[]>;
    findByCategories(categories: string[]): Promise<Specialization[]>;
}

// ============================================
// PROVIDER SPECIALIZATION REPOSITORY INTERFACE
// ============================================

export interface IProviderSpecializationRepository {
    // Basic CRUD
    create(providerSpecialization: ProviderSpecialization): Promise<ProviderSpecialization>;
    findById(id: string): Promise<ProviderSpecialization | null>;
    findByProviderAndSpecialization(
        providerId: string,
        specializationId: string
    ): Promise<ProviderSpecialization | null>;
    update(providerSpecialization: ProviderSpecialization): Promise<ProviderSpecialization>;
    delete(id: string): Promise<void>;

    // Queries
    list(options?: ListProviderSpecializationsOptions): Promise<ProviderSpecialization[]>;
    count(options?: Omit<ListProviderSpecializationsOptions, 'limit' | 'offset'>): Promise<number>;

    // Provider-centric queries
    findByProvider(providerId: string): Promise<ProviderSpecialization[]>;
    findCertifiedByProvider(providerId: string): Promise<ProviderSpecialization[]>;
    getProviderExpertise(providerId: string): Promise<{
        specializations: ProviderSpecialization[];
        totalCases: number;
        averageSuccessRate: number | null;
    }>;

    // Specialization-centric queries
    findBySpecialization(options: ProvidersBySpecializationOptions): Promise<ProviderSpecialization[]>;
    countProvidersBySpecialization(specializationId: string): Promise<number>;

    // Top providers
    findTopProvidersBySpecialization(
        specializationId: string,
        limit?: number
    ): Promise<ProviderSpecialization[]>;

    // Validation
    existsByProviderAndSpecialization(providerId: string, specializationId: string): Promise<boolean>;

    // Bulk operations
    deleteByProvider(providerId: string): Promise<void>;
    deleteBySpecialization(specializationId: string): Promise<void>;

    // Statistics
    incrementCaseCount(id: string): Promise<ProviderSpecialization>;
    updateSuccessRate(id: string, successRate: number): Promise<ProviderSpecialization>;
}
