// // prisma/seed.ts
// import { PrismaClient, User as PrismaUser } from '@prisma/client';
// // import { faker } from '@faker-js/faker';

// const prisma = new PrismaClient();

// export async function main() {
//   const { faker } = await import("@faker-js/faker"); // ✅ inside function

//   try {
//     console.log("🌱 Starting database seeding...");

//     // --------------------------
//     // ROLES
//     // --------------------------
//     await prisma.role.createMany({
//       data: [
//         { name: 'Admin', description: 'System Administrator' },
//         { name: 'User', description: 'Regular User' },
//         { name: 'Moderator', description: 'Can moderate content' },
//       ],
//       skipDuplicates: true,
//     });

//     // --------------------------
//     // USERS
//     // --------------------------
//     const users: PrismaUser[] = [];
//     for (let i = 0; i < 10; i++) {
//       const user = await prisma.user.create({
//         data: {
//           id: faker.string.uuid(),
//           email: faker.internet.email(),
//           auth0Id: faker.string.uuid(),
//           username: faker.internet.username(),
//           phone: faker.phone.number({ style: 'international' }),
//           fullName: faker.person.fullName(),
//           loyaltyTier: faker.helpers.arrayElement(['Bronze', 'Silver', 'Gold']),
//           subscriptionTier: faker.helpers.arrayElement(['None', 'Plus', 'Pro']),
//           profileStatus: faker.helpers.arrayElement([
//             'pending',
//             'verified',
//             'flagged',
//           ]),
//         },
//       });
//       users.push(user);
//     }

//     // Assign roles randomly
//     for (const user of users) {
//       const roleId = faker.helpers.arrayElement([1, 2, 3]);
//       await prisma.userRole.create({
//         data: {
//           userId: user.id,
//           roleId,
//           assignedAt: faker.date.past(),
//         },
//       });
//     }

//     // --------------------------
//     // SECTORS
//     // --------------------------
//     const telecom = await prisma.sector.create({
//       data: {
//         name: 'Telecom',
//         description: 'Telecommunication companies',
//         createdAt: new Date(),
//       },
//     });

//     const airline = await prisma.sector.create({
//       data: {
//         name: 'Airlines',
//         description: 'Airline companies',
//         createdAt: new Date(),
//       },
//     });

//     // --------------------------
//     // SERVICE PROVIDERS
//     // --------------------------
//     const stc = await prisma.serviceProvider.create({
//       data: {
//         name: 'STC',
//         sectorId: telecom.id,
//         description: 'STC Telecom',
//         isActive: true,
//         createdAt: new Date(),
//       },
//     });

//     const flynas = await prisma.serviceProvider.create({
//       data: {
//         name: 'FlyNas',
//         sectorId: airline.id,
//         description: 'Budget Airline',
//         isActive: true,
//         createdAt: new Date(),
//       },
//     });

//     // --------------------------
//     // EVALUATION TEMPLATES
//     // --------------------------
//     const telecomTemplate = await prisma.evaluationTemplate.create({
//       data: {
//         sectorId: telecom.id,
//         version: 1,
//         effectiveFrom: new Date(),
//         isActive: true,
//         createdAt: new Date(),
//       },
//     });

//     const airlineTemplate = await prisma.evaluationTemplate.create({
//       data: {
//         sectorId: airline.id,
//         version: 1,
//         effectiveFrom: new Date(),
//         isActive: true,
//         createdAt: new Date(),
//       },
//     });

//     // --------------------------
//     // EVALUATION CATEGORIES
//     // --------------------------
//     const telecomCategory = await prisma.evaluationCategory.create({
//       data: {
//         templateId: telecomTemplate.id,
//         title: 'Customer Service',
//         weight: 0.5,
//         orderIndex: 1,
//       },
//     });

//     const airlineCategory = await prisma.evaluationCategory.create({
//       data: {
//         templateId: airlineTemplate.id,
//         title: 'Technical Support',
//         weight: 0.6,
//         orderIndex: 1,
//       },
//     });

//     // --------------------------
//     // EVALUATION CRITERIA
//     // --------------------------
//     await prisma.evaluationCriterion.createMany({
//       data: [
//         {
//           categoryId: telecomCategory.id,
//           description: 'Was the staff helpful?',
//           inputType: 'rating_1_5',
//           orderIndex: 1,
//         },
//         {
//           categoryId: airlineCategory.id,
//           description: 'Was check-in smooth?',
//           inputType: 'rating_1_5',
//           orderIndex: 1,
//         },
//       ],
//       skipDuplicates: true,
//     });

//     // --------------------------
//     // EVALUATIONS & ANSWERS
//     // --------------------------
//     for (const user of users.slice(0, 5)) {
//       const eval1 = await prisma.evaluation.create({
//         data: {
//           userId: user.id,
//           providerId: stc.id,
//           templateId: telecomTemplate.id,
//           submittedAt: new Date(),
//           scorePercentage: faker.number.int({ min: 50, max: 100 }),
//           isFlagged: false,
//           isEdited: false,
//           createdAt: new Date(),
//         },
//       });

//       const criteria = await prisma.evaluationCriterion.findMany({
//         where: { categoryId: telecomCategory.id },
//       });

//       for (const criterion of criteria) {
//         await prisma.evaluationAnswer.create({
//           data: {
//             evaluationId: eval1.id,
//             criterionId: criterion.id,
//             score: faker.number.int({ min: 1, max: 5 }),
//             createdAt: new Date(),
//           },
//         });
//       }
//     }

//     // --------------------------
//     // PROVIDER REQUESTS & VOTES
//     // --------------------------
//     const request = await prisma.providerRequest.create({
//       data: {
//         sectorId: telecom.id,
//         providerName: 'NewTelCo',
//         submittedBy: users[0].id,
//         status: 'pending',
//         requestType: 'user',
//         description: 'Request for a new telecom provider',
//         votingLinkSlug: faker.string.alphanumeric(8),
//         createdAt: new Date(),
//       },
//     });

//     // for (const user of users.slice(1, 5)) {
//     //   await prisma.providerVote.create({
//     //     data: {
//     //       requestId: request.id,
//     //       userId: user.id,
//     //       votedAt: new Date(),
//     //     },
//     //   });
//     // }

//     console.log("✅ Database seeding completed!");
//   } finally {
//     await prisma.$disconnect();
//   }
// }
// // Prisma will handle calling main(), but you should disconnect at the end
// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
