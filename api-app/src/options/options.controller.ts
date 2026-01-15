import { Controller, Get } from '@nestjs/common';
import { OptionsService } from './options.service';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get('context')
  async getContexts() {
    return this.optionsService.getContextOptions();
  }

  @Get('location')
  async getLocations() {
    return this.optionsService.getLocationOptions();
  }
}
