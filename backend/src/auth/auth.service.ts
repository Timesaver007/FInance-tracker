import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { User, Prisma } from '../../generated/prisma/client';
import { LoginDto } from './dto/login.dto';

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Precomputed at module load so login() always has a well-formed hash to
// compare against when no user is found — keeps bcrypt doing real work on
// both the "no such user" and "wrong password" paths so they take the same
// time and don't let a caller distinguish the two by response latency.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('no-such-user-placeholder', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Opaque high-entropy token: hashed with sha256 (not bcrypt) so we can
  // look it up by exact match on refresh, instead of needing the row first.
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createRefreshToken(
    userId: string,
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const refreshToken = randomBytes(32).toString('hex');

    await db.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return refreshToken;
  }

  async register(dto: RegisterDto): Promise<{
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
  }> {
    const existing = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const { user, refreshToken } = await this.prisma.$transaction(
        async (tx) => {
          const created = await tx.user.create({
            data: {
              name: dto.name,
              email: dto.email,
              passwordHash,
            },
          });

          const refreshToken = await this.createRefreshToken(created.id, tx);

          return { user: created, refreshToken };
        },
      );
      const accessToken = await this.jwt.signAsync({
        sub: user.id,
        email: user.email,
      });

      const { passwordHash: _passwordHash, ...safeUser } = user;
      return { user: safeUser, accessToken, refreshToken };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already exists');
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<{
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always run bcrypt.compare, even when no user was found, comparing
    // against a fixed dummy hash — otherwise "no such email" returns faster
    // than "wrong password", and that timing gap leaks which emails exist.
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const refreshToken = await this.createRefreshToken(user.id);

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return { user: safeUser, accessToken, refreshToken };
  }

  async refresh(rawToken: string): Promise<{
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
  }> {
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
      include: { user: true },
    });

    if (
      !existingToken ||
      existingToken.revoked ||
      existingToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { user } = existingToken;

    // Rotate: revoke the token just used and issue a new one atomically, so
    // a stolen-and-replayed token can never mint a second valid refresh token.
    const refreshToken = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: { revoked: true },
      });

      return this.createRefreshToken(user.id, tx);
    });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return { user: safeUser, accessToken, refreshToken };
  }

  // updateMany, not update: if the token doesn't match any row (already
  // logged out, garbage cookie), this silently no-ops instead of throwing —
  // the caller's goal ("no longer logged in") is already true either way,
  // and not throwing avoids telling a caller whether their token was ever real.
  async logout(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(rawToken) },
      data: { revoked: true },
    });
  }
}
