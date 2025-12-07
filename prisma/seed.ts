// prisma/seed-services.ts
import { PrismaClient } from '@prisma/client/extension';

const prisma = new PrismaClient();

async function main() {
    const services = [
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

    for (const service of services) {
        await prisma.service.upsert({
            where: { code: service.code },
            update: service,
            create: service,
        });
    }

    console.log('✅ Services seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });