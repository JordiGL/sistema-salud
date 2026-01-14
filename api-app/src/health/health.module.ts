import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health.controller';
import { HealthService } from './business/health.service';
import { SupabaseRepository } from './persistence/supabase.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
  providers: [HealthService, SupabaseRepository],
})
export class HealthModule {}
