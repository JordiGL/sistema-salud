import { Module } from '@nestjs/common';
import { DailyBriefingController } from './daily-briefing.controller';
import { DailyBriefingService } from './daily-briefing.service';
import { DailyBriefingRepository } from './daily-briefing.repository';

@Module({
    controllers: [DailyBriefingController],
    providers: [DailyBriefingService, DailyBriefingRepository],
    exports: [DailyBriefingService],
})
export class DailyBriefingModule { }
