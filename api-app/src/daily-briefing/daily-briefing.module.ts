import { Module } from '@nestjs/common';
import { DailyBriefingController } from './daily-briefing.controller';
import { DailyBriefingService } from './daily-briefing.service';
import { DailyBriefingRepository } from './daily-briefing.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [DailyBriefingController],
    providers: [DailyBriefingService, DailyBriefingRepository],
    exports: [DailyBriefingService],
})
export class DailyBriefingModule { }
