import { Module } from '@nestjs/common';
import { OptionsController } from './presentation/options.controller';
import { OptionsService } from './business/options.service';

@Module({
  controllers: [OptionsController],
  providers: [OptionsService],
})
export class OptionsModule { }
