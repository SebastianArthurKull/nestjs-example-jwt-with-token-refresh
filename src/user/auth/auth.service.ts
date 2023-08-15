import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UserType } from '@prisma/client';
import * as process from 'process';

if (
  !process.env.ACCESS_TOKEN_EXPIRY ||
  !process.env.REFRESH_TOKEN_EXPIRY ||
  !process.env.PEPPER_SECRET ||
  !process.env.JWT_SECRET ||
  !process.env.JWT_REFRESH_SECRET ||
  !process.env.SALT_ROUNDS
) {
  throw new Error('Environment variables not set properly');
}

const ACCESS_TOKEN_EXPIRY = parseInt(process.env.ACCESS_TOKEN_EXPIRY);
const REFRESH_TOKEN_EXPIRY = parseInt(process.env.REFRESH_TOKEN_EXPIRY);
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);
const PEPPER = process.env.PEPPER_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

interface SignUpParams {
  email: string;
  password: string;
  name: string;
}

interface SignInParams {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signUp({ email, password, name }: SignUpParams, userType: UserType) {
    const userExists = await this.prismaService.user.findFirst({
      where: {
        email,
      },
    });
    if (userExists) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await this.hash(password);

    const user = await this.prismaService.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        user_type: userType,
        refresh_token: null,
      },
    });

    const tokens = await this.generateTokens(user.name, user.id);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async signIn({ email, password }: SignInParams) {
    const user = await this.prismaService.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new HttpException('Invalid credentials', 400);
    }

    const isValidPassword = await this.compare(password, user.password);

    if (!isValidPassword) {
      throw new HttpException('Invalid credentials', 400);
    }

    return await this.generateTokens(user.name, user.id);
  }

  async logout(userId: number) {
    await this.prismaService.user.updateMany({
      where: {
        id: userId,
        refresh_token: {
          not: null,
        },
      },
      data: {
        refresh_token: null,
      },
    });
    return true;
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return new ForbiddenException();
    }

    const isValidRefreshToken = await this.compareRefreshToken(
      refreshToken,
      user.refresh_token,
    );

    if (!isValidRefreshToken) {
      throw new HttpException('Invalid refresh token', 400);
    }

    // If the refresh token is valid, generate new tokens
    const tokens = await this.generateTokens(user.name, user.id);

    // Update the refresh token in the database immediately
    await this.updateRefreshToken(userId, tokens.refresh_token);

    return tokens;
  }

  private async generateTokens(name: string, id: number) {
    const payload = { name, id };
    const [at, rt] = await Promise.all([
      (async () => {
        return jwt.sign(payload, JWT_SECRET, {
          expiresIn: ACCESS_TOKEN_EXPIRY,
        });
      })(),
      (async () => {
        return jwt.sign(payload, JWT_REFRESH_SECRET, {
          expiresIn: REFRESH_TOKEN_EXPIRY,
        });
      })(),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hash = await this.hash(refreshToken);
    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        refresh_token: hash,
      },
    });
  }

  private async hash(sequence: string) {
    const pepperedPassword = `${sequence}${PEPPER}`;
    return await bcrypt.hash(pepperedPassword, SALT_ROUNDS);
  }

  private async compare(sequence: string, hash: string) {
    const pepperedPassword = `${sequence}${PEPPER}`;
    return await bcrypt.compare(pepperedPassword, hash);
  }

  private async compareRefreshToken(
    refreshToken: string,
    refreshTokenInDb: string,
  ) {
    const pepperedToken = `${refreshToken}${PEPPER}`;
    return await bcrypt.compare(pepperedToken, refreshTokenInDb);
  }
}
