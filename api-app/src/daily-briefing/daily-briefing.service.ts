import { Injectable } from '@nestjs/common';
import { DailyBriefingRepository } from './daily-briefing.repository';
import { CreateBriefingDto } from './dtos/create-briefing.dto';

@Injectable()
export class DailyBriefingService {
    constructor(private readonly repository: DailyBriefingRepository) { }

    async getTodayBriefing() {
        const today = new Date().toISOString().split('T')[0];
        return this.repository.getBriefing(today);
    }

    async getLatestBriefing() {
        return this.repository.getLatestBriefing();
    }

    async getBriefingByDate(date: string) {
        return this.repository.getBriefing(date);
    }

    async saveBriefing(data: CreateBriefingDto) {
        return this.repository.upsertBriefing(data);
    }
}
