// ============================================
// SPECIALIZATION ENTITY
// Master list of legal specializations
// src/core/domain/specialization/entities/specialization.entity.ts
// ============================================

import { AggregateRoot } from '../../base/AggregateRoot';

export interface SpecializationProps {
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    category: string; // civil, criminal, commercial, family, labor, etc.
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class Specialization extends AggregateRoot<SpecializationProps> {
    get name(): string {
        return this.props.name;
    }

    get nameAr(): string {
        return this.props.nameAr;
    }

    get description(): string | undefined {
        return this.props.description;
    }

    get descriptionAr(): string | undefined {
        return this.props.descriptionAr;
    }

    get category(): string {
        return this.props.category;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    private constructor(props: SpecializationProps, id?: string) {
        super(props, id);
    }

    public static create(props: SpecializationProps, id?: string): Specialization {
        return new Specialization(
            {
                ...props,
                isActive: props.isActive ?? true,
                createdAt: props.createdAt ?? new Date(),
                updatedAt: props.updatedAt ?? new Date(),
            },
            id
        );
    }

    public activate(): void {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }

    public deactivate(): void {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    public updateDetails(params: {
        name?: string;
        nameAr?: string;
        description?: string;
        descriptionAr?: string;
        category?: string;
    }): void {
        if (params.name !== undefined) this.props.name = params.name;
        if (params.nameAr !== undefined) this.props.nameAr = params.nameAr;
        if (params.description !== undefined) this.props.description = params.description;
        if (params.descriptionAr !== undefined) this.props.descriptionAr = params.descriptionAr;
        if (params.category !== undefined) this.props.category = params.category;
        this.props.updatedAt = new Date();
    }
}
