import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export class UserInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, handler: CallHandler<any>) {
    const request = context.switchToHttp().getRequest();
    const authorization = request?.headers?.['authorization'];

    if (authorization) {
      const tokenMatch = authorization.match(/^Bearer (.*)$/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        request.user = jwt.decode(token);
        request.token = token;
      }
    }

    return handler.handle();
  }
}
