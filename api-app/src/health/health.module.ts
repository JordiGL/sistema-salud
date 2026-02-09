import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HealthController } from './presentation/health.controller';
import { HealthService } from './business/health.service';
import { SupabaseRepository } from './persistence/supabase.repository';

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
  providers: [HealthService, SupabaseRepository],
})
export class HealthModule { }
