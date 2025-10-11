// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ✅ Optional: makes PrismaService available everywhere without importing
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // ✅ CRITICAL: must export it
})
export class PrismaModule {}