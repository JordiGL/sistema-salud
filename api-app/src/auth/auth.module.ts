import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './business/auth.service';
import { AuthController } from './presentation/auth.controller';
import { SupabaseRepository } from '../health/persistence/supabase.repository';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'SECRETO_SUPER_SEGURO_CAMBIALO_EN_PROD',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseRepository],
  exports: [JwtModule, AuthService],
})
export class AuthModule { }
