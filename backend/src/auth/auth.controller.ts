import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, REFRESH_TOKEN_TTL_MS } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

const isProd = process.env.NODE_ENV === 'production';

// In prod the frontend and API live on different domains, so the refresh cookie
// is cross-site: the browser only sends it with SameSite=None + Secure (HTTPS).
// Locally we keep Strict over http. clearCookie must reuse these same
// attributes, or some browsers won't match the cookie to clear it.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.register(dto);

    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_TTL_MS,
    });

    return { user, accessToken };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.login(dto);

    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_TTL_MS,
    });

    return { user, accessToken };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const rawToken = cookies?.refreshToken;
    if (typeof rawToken !== 'string' || !rawToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const { user, accessToken, refreshToken } =
      await this.auth.refresh(rawToken);

    res.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_TTL_MS,
    });

    return { user, accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const rawToken = cookies?.refreshToken;

    if (typeof rawToken === 'string' && rawToken) {
      await this.auth.logout(rawToken);
    }

    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    return { message: 'Logged out' };
  }
}
