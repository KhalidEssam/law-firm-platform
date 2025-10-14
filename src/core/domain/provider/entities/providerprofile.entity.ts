
// import { Entity } from '../../base/Entity';
import { AggregateRoot } from '../../base/AggregateRoot';
import { OrganizationName } from '../value-objects/organization-name.vo';
import { LicenseNumber } from '../value-objects/license-number.vo';
import { VerificationStatusVO } from '../value-objects/verfication-status.vo';
import { WorkingDays } from '../value-objects/working-days.vo';
import { WorkingHours } from '../value-objects/working-hours.vo';
import { ContactInfo } from '../value-objects/contact-info.vo';


export interface ProviderProfileProps {
    userId: string;
    organizationName: OrganizationName;
    licenseNumber: LicenseNumber;
    taxNumber?: string;
    description?: string;
    descriptionAr?: string;
    verificationStatus: VerificationStatusVO;
    isActive: boolean;
    workingDays?: WorkingDays;
    workingHours?: WorkingHours;
    contactInfo?: ContactInfo;
    documents?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class ProviderProfile extends AggregateRoot<ProviderProfileProps> {
    get userId(): string {
        return this.props.userId;
    }

    get organizationName(): OrganizationName {
        return this.props.organizationName;
    }

    get licenseNumber(): LicenseNumber {
        return this.props.licenseNumber;
    }

    get verificationStatus(): VerificationStatusVO {
        return this.props.verificationStatus;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get isApproved(): boolean {
        return this.props.verificationStatus.isApproved;
    }
   get taxNumber(): string | undefined {
        return this.props.taxNumber;
    }

    get description(): string | undefined {
        return this.props.description;
    }

    get descriptionAr(): string | undefined {
        return this.props.descriptionAr;
    }

    get documents(): any {
        return this.props.documents;
    }

    get deletedAt(): Date | undefined {
        return this.props.deletedAt;
    }

    // get updatedAt(): Date | undefined {
    //     return this.props.updatedAt;
    // }
    get workingDays(): WorkingDays | undefined {
        return this.props.workingDays;
    }

    get workingHours(): WorkingHours | undefined {
        return this.props.workingHours;
    }

    get contactInfo(): ContactInfo | undefined {
        return this.props.contactInfo;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    get isDeleted(): boolean {
        return this.props.deletedAt !== undefined;
    }

    private constructor(props: ProviderProfileProps, id?: string) {
        super(props, id);
    }

    public static create(props: ProviderProfileProps, id?: string): ProviderProfile {
        const profile = new ProviderProfile(
            {
                ...props,
                verificationStatus: props.verificationStatus ?? VerificationStatusVO.create(),
                isActive: props.isActive ?? false,
                createdAt: props.createdAt ?? new Date(),
                updatedAt: props.updatedAt ?? new Date(),
            },
            id
        );

        return profile;
    }

    public approve(): void {
        if (this.props.verificationStatus.isApproved) {
            throw new Error('Provider is already approved');
        }
        this.props.verificationStatus = this.props.verificationStatus.approve();
        this.props.updatedAt = new Date();
    }

    public reject(): void {
        if (this.props.verificationStatus.isRejected) {
            throw new Error('Provider is already rejected');
        }
        this.props.verificationStatus = this.props.verificationStatus.reject();
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    public suspend(): void {
        this.props.verificationStatus = this.props.verificationStatus.suspend();
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    public activate(): void {
        if (!this.props.verificationStatus.isApproved) {
            throw new Error('Cannot activate a non-approved provider');
        }
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }

    public deactivate(): void {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    public updateContactInfo(contactInfo: ContactInfo): void {
        this.props.contactInfo = contactInfo;
        this.props.updatedAt = new Date();
    }

    public updateWorkingSchedule(workingDays: WorkingDays, workingHours: WorkingHours): void {
        this.props.workingDays = workingDays;
        this.props.workingHours = workingHours;
        this.props.updatedAt = new Date();
    }

    public softDelete(): void {
        this.props.deletedAt = new Date();
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
}
