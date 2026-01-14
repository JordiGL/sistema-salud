import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseRepository } from '../health/persistence/supabase.repository'; // O donde tengas PrismaClient
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: SupabaseRepository,
  ) {}

  // MODIFICADO: Ahora acepta email y password
  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    // 1. Buscamos el usuario por el email que nos llega del frontend
    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // 2. Comparamos contraseña
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const payload = { sub: user.id, email: user.email, role: 'admin' };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
