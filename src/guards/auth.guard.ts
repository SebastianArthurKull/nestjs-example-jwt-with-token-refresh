import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import * as process from 'process';
import { PrismaService } from '../prisma/prisma.service';

interface JWTPayload {
  name: string;
  id: number;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const tokenMatch =
      request?.headers?.['authorization']?.match(/^Bearer (.*)$/);
    if (!tokenMatch) {
      return false;
    }

    const token = tokenMatch[1];

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      const user = await this.prismaService.user.findUnique({
        where: {
          id: payload.id,
        },
      });

      return !(!user || !roles.includes(user.user_type));
    } catch (error) {
      return false;
    }
  }
}
