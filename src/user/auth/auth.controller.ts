import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignupDto } from '../dtos/auth.dto';
import { UserType } from '@prisma/client';
import { Token, User, UserInfo } from '../decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/:userType')
  @HttpCode(HttpStatus.CREATED)
  async signUp(
    @Body() body: SignupDto,
    @Param('userType', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    return await this.authService.signUp(body, userType);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() body: SignInDto) {
    return await this.authService.signIn(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@User() user: UserInfo) {
    return this.authService.logout(user.id);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@User() user: UserInfo, @Token() refreshToken: string) {
    return this.authService.refreshTokens(user.id, refreshToken);
  }

  @Get('me')
  me(@User() user: UserInfo) {
    return user;
  }
}
