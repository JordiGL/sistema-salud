import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, DailyBriefing } from '@prisma/client';
import { CreateBriefingDto } from './dtos/create-briefing.dto';

@Injectable()
export class DailyBriefingRepository extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();
    }

    async getBriefing(date: string): Promise<DailyBriefing | null> {
        return this.dailyBriefing.findUnique({
            where: { date },
        });
    }

    async getLatestBriefing(): Promise<DailyBriefing | null> {
        return this.dailyBriefing.findFirst({
            orderBy: { date: 'desc' },
        });
    }

    async upsertBriefing(data: CreateBriefingDto): Promise<DailyBriefing> {
        return this.dailyBriefing.upsert({
            where: { date: data.date },
            update: {
                status_ca: data.status_ca,
                trend_ca: data.trend_ca,
                status_es: data.status_es,
                trend_es: data.trend_es,
            },
            create: {
                date: data.date,
                status_ca: data.status_ca,
                trend_ca: data.trend_ca,
                status_es: data.status_es,
                trend_es: data.trend_es,
            },
        });
    }
}
