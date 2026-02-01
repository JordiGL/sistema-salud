import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../business/auth.service';

// Creamos una clase simple para tipar la entrada
export class SignInDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    // Pasamos ambos datos al servicio
    return this.authService.signIn(signInDto.email, signInDto.password);
  }
}
