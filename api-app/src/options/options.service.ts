import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class OptionsService {
  private prisma = new PrismaClient();

  async getContextOptions() {
    return this.prisma.contextOption.findMany({ orderBy: { value: 'asc' } });
  }

  async getLocationOptions() {
    return this.prisma.locationOption.findMany({ orderBy: { value: 'asc' } });
  }
}
