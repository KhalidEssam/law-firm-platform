// prisma/seed.ts
import 'dotenv/config';

// ============================================
// ROLES DATA
// ============================================
const roles = [
    { name: 'user', description: 'Basic authenticated user with minimal access' },
    { name: 'subscriber', description: 'Paying customer who uses legal services' },
    { name: 'client', description: 'Legal opinion requester' },
    { name: 'provider', description: 'Legal service provider (lawyer/firm)' },
    { name: 'provider_admin', description: 'Administrator within a provider organization' },
    { name: 'partner', description: 'Business partner with platform access' },
    { name: 'lawyer', description: 'Attorney handling legal opinions and cases' },
    { name: 'provider_manager', description: 'Manages provider assignments and operations' },
    { name: 'analytics', description: 'Read-only access to analytics and reports' },
    { name: 'manager', description: 'Department manager with elevated permissions' },
    { name: 'platform', description: 'Platform-level operations access' },
    { name: 'platform_admin', description: 'Platform administrator with high-level access' },
    { name: 'admin', description: 'General administrator with broad access' },
    { name: 'system_admin', description: 'Full system administrator with unrestricted access' },
    { name: 'system', description: 'System/background jobs internal role' },
];

// ============================================
// PERMISSIONS DATA (Grouped by Category)
// ============================================
const permissions = [
    // Users Module
    { name: 'read:users', description: 'View user profiles and lists', category: 'users' },
    { name: 'update:users', description: 'Modify user profiles', category: 'users' },
    { name: 'delete:users', description: 'Delete user accounts', category: 'users' },

    // Payment Methods Module
    { name: 'read:payment-methods', description: 'View payment methods', category: 'payment-methods' },
    { name: 'write:payment-methods', description: 'Add/update payment methods', category: 'payment-methods' },
    { name: 'delete:payment-methods', description: 'Remove payment methods', category: 'payment-methods' },

    // Provider Module
    { name: 'create:provider-profile', description: 'Create provider profile', category: 'provider' },
    { name: 'update:provider-profile', description: 'Update provider profile', category: 'provider' },
    { name: 'delete:provider-profile', description: 'Delete provider profile', category: 'provider' },
    { name: 'approve:provider-profile', description: 'Approve provider profile', category: 'provider' },
    { name: 'reject:provider-profile', description: 'Reject provider profile', category: 'provider' },
    { name: 'create:provider-user', description: 'Add staff to provider organization', category: 'provider' },
    { name: 'update:provider-user', description: 'Update provider staff', category: 'provider' },
    { name: 'delete:provider-user', description: 'Remove provider staff', category: 'provider' },
    { name: 'create:provider-service', description: 'Add service offering', category: 'provider' },
    { name: 'update:provider-service', description: 'Update service offering', category: 'provider' },
    { name: 'delete:provider-service', description: 'Remove service offering', category: 'provider' },
    { name: 'create:provider-schedule', description: 'Create availability schedule', category: 'provider' },
    { name: 'update:provider-schedule', description: 'Update availability schedule', category: 'provider' },
    { name: 'delete:provider-schedule', description: 'Remove availability schedule', category: 'provider' },

    // Consultation Module
    { name: 'consultation:create', description: 'Create consultation request', category: 'consultation' },
    { name: 'consultation:read', description: 'View consultations', category: 'consultation' },
    { name: 'consultation:update', description: 'Update consultation', category: 'consultation' },
    { name: 'consultation:assign', description: 'Assign consultation to provider', category: 'consultation' },
    { name: 'consultation:complete', description: 'Mark consultation as completed', category: 'consultation' },
    { name: 'consultation:cancel', description: 'Cancel consultation', category: 'consultation' },
    { name: 'consultation:dispute', description: 'Dispute consultation', category: 'consultation' },
    { name: 'consultation:upload-document', description: 'Upload documents to consultation', category: 'consultation' },
    { name: 'consultation:send-message', description: 'Send messages in consultation', category: 'consultation' },
    { name: 'consultation:rate', description: 'Add rating to consultation', category: 'consultation' },
    { name: 'consultation:view-statistics', description: 'View consultation analytics', category: 'consultation' },
    { name: 'consultation:update-sla', description: 'Update SLA statuses', category: 'consultation' },

    // Legal Opinion Module
    { name: 'opinion:create', description: 'Create legal opinion request', category: 'legal-opinion' },
    { name: 'opinion:read', description: 'View legal opinions', category: 'legal-opinion' },
    { name: 'opinion:update', description: 'Update legal opinion', category: 'legal-opinion' },
    { name: 'opinion:assign', description: 'Assign opinion to lawyer', category: 'legal-opinion' },
    { name: 'opinion:manage', description: 'Full management (cost, payment, revision)', category: 'legal-opinion' },
    { name: 'opinion:delete', description: 'Delete legal opinion request', category: 'legal-opinion' },

    // Litigation Case Module
    { name: 'case:create', description: 'Create litigation case', category: 'litigation' },
    { name: 'case:read', description: 'View litigation cases', category: 'litigation' },
    { name: 'case:update', description: 'Update case details', category: 'litigation' },
    { name: 'case:assign', description: 'Assign case to provider', category: 'litigation' },
    { name: 'case:manage', description: 'Full management (payment, refund, status)', category: 'litigation' },
    { name: 'case:delete', description: 'Delete litigation case', category: 'litigation' },

    // Membership Module
    { name: 'read:memberships', description: 'View memberships', category: 'membership' },
    { name: 'create:tiers', description: 'Create membership tiers', category: 'membership' },
    { name: 'update:tiers', description: 'Update membership tiers', category: 'membership' },
    { name: 'delete:tiers', description: 'Delete membership tiers', category: 'membership' },
    { name: 'update:quotas', description: 'Consume/manage quotas', category: 'membership' },

    // Billing Module - Invoices
    { name: 'create:invoices', description: 'Create invoices', category: 'billing' },
    { name: 'read:invoices', description: 'View invoices', category: 'billing' },
    { name: 'update:invoices', description: 'Update invoices', category: 'billing' },
    { name: 'delete:invoices', description: 'Delete invoices', category: 'billing' },

    // Billing Module - Transactions
    { name: 'create:transactions', description: 'Create transactions', category: 'billing' },
    { name: 'read:transactions', description: 'View transactions', category: 'billing' },
    { name: 'update:transactions', description: 'Update transactions', category: 'billing' },

    // Billing Module - Refunds
    { name: 'read:refunds', description: 'View refunds', category: 'billing' },
    { name: 'update:refunds', description: 'Process refunds', category: 'billing' },

    // Billing Module - Disputes
    { name: 'read:disputes', description: 'View disputes', category: 'billing' },
    { name: 'update:disputes', description: 'Manage disputes', category: 'billing' },
];

// ============================================
// ROLE-PERMISSION MAPPINGS
// ============================================
const rolePermissions: Record<string, string[]> = {
    // Basic user - minimal permissions
    user: [],

    // Subscriber - can use services
    subscriber: [
        'read:payment-methods',
        'write:payment-methods',
        'delete:payment-methods',
        'consultation:create',
        'consultation:read',
        'consultation:cancel',
        'consultation:dispute',
        'consultation:upload-document',
        'consultation:send-message',
        'consultation:rate',
        'opinion:create',
        'opinion:read',
        'opinion:update',
        'case:create',
        'case:read',
        'case:update',
    ],

    // Client - legal opinion requester
    client: [
        'opinion:create',
        'opinion:read',
        'opinion:update',
    ],

    // Provider - legal service provider
    provider: [
        'consultation:read',
        'consultation:update',
        'consultation:complete',
        'consultation:upload-document',
        'consultation:send-message',
        'opinion:read',
        'opinion:update',
        'case:read',
        'case:update',
        'create:provider-service',
        'update:provider-service',
        'delete:provider-service',
        'create:provider-schedule',
        'update:provider-schedule',
        'delete:provider-schedule',
    ],

    // Provider Admin - manage provider organization
    provider_admin: [
        'consultation:read',
        'consultation:update',
        'consultation:complete',
        'consultation:upload-document',
        'consultation:send-message',
        'opinion:read',
        'opinion:update',
        'case:read',
        'case:update',
        'create:provider-profile',
        'update:provider-profile',
        'delete:provider-profile',
        'create:provider-user',
        'update:provider-user',
        'delete:provider-user',
        'create:provider-service',
        'update:provider-service',
        'delete:provider-service',
        'create:provider-schedule',
        'update:provider-schedule',
        'delete:provider-schedule',
    ],

    // Partner - business partner
    partner: [
        'read:payment-methods',
        'write:payment-methods',
        'read:invoices',
        'read:transactions',
    ],

    // Lawyer - handles legal opinions
    lawyer: [
        'opinion:read',
        'opinion:update',
        'case:read',
        'case:update',
    ],

    // Provider Manager - manages assignments
    provider_manager: [
        'consultation:read',
        'consultation:assign',
        'consultation:view-statistics',
        'opinion:read',
        'opinion:assign',
        'case:read',
        'case:assign',
    ],

    // Analytics - read-only analytics
    analytics: [
        'consultation:view-statistics',
        'read:invoices',
        'read:transactions',
        'read:refunds',
        'read:disputes',
    ],

    // Manager - department manager
    manager: [
        'consultation:read',
        'consultation:assign',
        'consultation:view-statistics',
        'opinion:read',
        'opinion:assign',
        'opinion:manage',
        'case:read',
        'case:assign',
        'read:invoices',
        'read:transactions',
        'read:refunds',
        'read:disputes',
    ],

    // Platform - platform operations
    platform: [
        'read:users',
        'read:payment-methods',
        'consultation:read',
        'consultation:assign',
        'consultation:view-statistics',
        'opinion:read',
        'opinion:assign',
        'opinion:manage',
        'case:read',
        'case:assign',
        'case:manage',
        'read:memberships',
        'update:quotas',
        'read:invoices',
        'update:invoices',
        'create:transactions',
        'read:transactions',
        'update:transactions',
        'read:refunds',
        'update:refunds',
        'read:disputes',
        'update:disputes',
    ],

    // Platform Admin - platform administrator
    platform_admin: [
        'read:users',
        'update:users',
        'read:payment-methods',
        'approve:provider-profile',
        'reject:provider-profile',
        'consultation:read',
        'consultation:assign',
        'consultation:view-statistics',
        'opinion:read',
        'opinion:assign',
        'opinion:manage',
        'case:read',
        'case:assign',
        'case:manage',
        'read:memberships',
        'update:quotas',
        'read:invoices',
        'update:invoices',
        'create:transactions',
        'read:transactions',
        'update:transactions',
        'read:refunds',
        'update:refunds',
        'read:disputes',
        'update:disputes',
    ],

    // Admin - general administrator
    admin: [
        'read:users',
        'update:users',
        'read:payment-methods',
        'write:payment-methods',
        'delete:payment-methods',
        'approve:provider-profile',
        'reject:provider-profile',
        'consultation:create',
        'consultation:read',
        'consultation:update',
        'consultation:assign',
        'consultation:complete',
        'consultation:cancel',
        'consultation:dispute',
        'consultation:upload-document',
        'consultation:send-message',
        'consultation:rate',
        'consultation:view-statistics',
        'opinion:create',
        'opinion:read',
        'opinion:update',
        'opinion:assign',
        'opinion:manage',
        'case:create',
        'case:read',
        'case:update',
        'case:assign',
        'case:manage',
        'read:memberships',
        'create:tiers',
        'update:tiers',
        'update:quotas',
        'create:invoices',
        'read:invoices',
        'update:invoices',
        'create:transactions',
        'read:transactions',
        'update:transactions',
        'read:refunds',
        'update:refunds',
        'read:disputes',
        'update:disputes',
    ],

    // System Admin - full access (will be populated with all permissions)
    system_admin: [],

    // System - background jobs
    system: [
        'consultation:update-sla',
        'update:invoices',
        'update:transactions',
    ],
};

// Populate system_admin with all permissions
rolePermissions.system_admin = permissions.map(p => p.name);

// ============================================
// SERVICES DATA (will use Currency enum from dynamic import)
// ============================================
const servicesData = [
    {
        code: 'CONSULTATION',
        name: 'Consultation',
        nameAr: 'استشارة',
        category: 'consultation',
        basePrice: 500,
        currency: 'SAR',
        isActive: true,
        sortOrder: 1,
    },
    {
        code: 'LEGAL_OPINION',
        name: 'Legal Opinion',
        nameAr: 'رأي قانوني',
        category: 'opinion',
        basePrice: 2000,
        currency: 'SAR',
        isActive: true,
        sortOrder: 2,
    },
    {
        code: 'SERVICE_REQUEST',
        name: 'Service Request',
        nameAr: 'طلب خدمة',
        category: 'service',
        basePrice: 1500,
        currency: 'SAR',
        isActive: true,
        sortOrder: 3,
    },
    {
        code: 'LITIGATION',
        name: 'Litigation Case',
        nameAr: 'قضية تقاضي',
        category: 'litigation',
        basePrice: 5000,
        currency: 'SAR',
        isActive: true,
        sortOrder: 4,
    },
    {
        code: 'CALL_REQUEST',
        name: 'Call Consultation',
        nameAr: 'استشارة هاتفية',
        category: 'call',
        basePrice: 300,
        currency: 'SAR',
        isActive: true,
        sortOrder: 5,
    },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function main() {
    console.log('🌱 Starting database seed...\n');

    // Dynamic imports to ensure dotenv is loaded first
    const { PrismaClient, Currency } = await import('@prisma/client');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { Pool } = await import('pg');

    // Initialize database connection
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // Seed Roles
        console.log('🔄 Seeding roles...');
        for (const role of roles) {
            await prisma.role.upsert({
                where: { name: role.name },
                update: { description: role.description },
                create: role,
            });
        }
        console.log(`✅ ${roles.length} roles seeded successfully`);

        // Seed Permissions
        console.log('🔄 Seeding permissions...');
        for (const permission of permissions) {
            await prisma.permission.upsert({
                where: { name: permission.name },
                update: {
                    description: permission.description,
                    category: permission.category,
                },
                create: permission,
            });
        }
        console.log(`✅ ${permissions.length} permissions seeded successfully`);

        // Seed Role-Permission Mappings
        console.log('🔄 Seeding role-permission mappings...');
        let totalMappings = 0;

        for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
            const role = await prisma.role.findUnique({
                where: { name: roleName },
            });

            if (!role) {
                console.warn(`⚠️ Role not found: ${roleName}`);
                continue;
            }

            // Clear existing mappings for this role
            await prisma.rolePermission.deleteMany({
                where: { roleId: role.id },
            });

            // Create new mappings
            for (const permissionName of permissionNames) {
                const permission = await prisma.permission.findUnique({
                    where: { name: permissionName },
                });

                if (!permission) {
                    console.warn(`⚠️ Permission not found: ${permissionName}`);
                    continue;
                }

                await prisma.rolePermission.create({
                    data: {
                        roleId: role.id,
                        permissionId: permission.id,
                    },
                });

                totalMappings++;
            }
        }
        console.log(`✅ ${totalMappings} role-permission mappings seeded successfully`);

        // Seed Services
        console.log('🔄 Seeding services...');
        for (const serviceData of servicesData) {
            const service = {
                ...serviceData,
                currency: Currency[serviceData.currency as keyof typeof Currency],
            };
            await prisma.service.upsert({
                where: { code: service.code },
                update: service,
                create: service,
            });
        }
        console.log(`✅ ${servicesData.length} services seeded successfully`);

        // Print summary
        console.log('\n🎉 Database seeding completed successfully!');

        const roleCount = await prisma.role.count();
        const permissionCount = await prisma.permission.count();
        const mappingCount = await prisma.rolePermission.count();
        const serviceCount = await prisma.service.count();

        console.log('\n📊 Summary:');
        console.log(`   - Roles: ${roleCount}`);
        console.log(`   - Permissions: ${permissionCount}`);
        console.log(`   - Role-Permission Mappings: ${mappingCount}`);
        console.log(`   - Services: ${serviceCount}`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
