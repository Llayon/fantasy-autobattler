import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GuestGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-guest-token'];

    if (!token) {
      throw new UnauthorizedException('Missing guest token');
    }

    const player = await this.authService.validateGuestToken(token);
    if (!player) {
      throw new UnauthorizedException('Invalid guest token');
    }

    request.player = player;
    return true;
  }
}
