import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DailyBriefingService } from './daily-briefing.service';
import { CreateBriefingDto } from './dtos/create-briefing.dto';
import { AuthGuard } from '../health/common/guards/auth.guard';

@Controller('daily-briefing')
export class DailyBriefingController {
    constructor(private readonly service: DailyBriefingService) { }

    @Get('today')
    async getToday() {
        return this.service.getTodayBriefing();
    }

    @Get(':date')
    async getByDate(@Param('date') date: string) {
        return this.service.getBriefingByDate(date);
    }

    @Post()
    @UseGuards(AuthGuard)
    async save(@Body() dto: CreateBriefingDto) {
        return this.service.saveBriefing(dto);
    }
}
