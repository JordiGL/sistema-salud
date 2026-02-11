import { Global, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { OptionsModule } from './options/options.module';
import { DailyBriefingModule } from './daily-briefing/daily-briefing.module';

@Global()
@Module({
  imports: [
    AuthModule, // 1. Registra rutas de login/register
    HealthModule, // 2. Registra rutas de métricas
    OptionsModule, // 3. Registra rutas de selectores
    DailyBriefingModule,
  ],
})
export class AppModule { }
