import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CreateMetricDto } from './create-metric.dto';
import { PartialType } from '@nestjs/mapped-types';

import { CreateEventDto } from './create-event.dto';

export class UpdateMetricDto extends PartialType(CreateMetricDto) { }
export class UpdateEventDto extends PartialType(CreateEventDto) { }

export class GetHistoryDto {
    @IsOptional()
    @IsString()
    @IsEnum(['7d', '30d', 'all'])
    range?: '7d' | '30d' | 'all';

    @IsOptional()
    @IsString()
    context?: string;

    @IsOptional()
    @IsString()
    location?: string;
}
