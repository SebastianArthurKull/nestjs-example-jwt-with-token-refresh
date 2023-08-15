import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { UserInterceptor } from './user/interceptors/user.interceptor';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [UserModule, PrismaModule],
  controllers: [AppController],

  // The providers that will be instantiated by the Nest injector and that can be shared at least across this module.
  providers: [
    AppService,

    // Intercept incoming requests with the `UserInterceptor`. Interceptors are used to transform the data returned
    // from your route handler, or to handle an outgoing exception in some specific way.
    {
      provide: APP_INTERCEPTOR,
      useClass: UserInterceptor,
    },

    // Use the `AuthGuard` globally. Guards are responsible for determining whether a request will be handled by the route handler or not.
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
