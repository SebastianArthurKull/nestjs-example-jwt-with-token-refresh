import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Define an interface for the expected user information structure, which seems to be coming from a decoded JWT.
export interface UserInfo {
  name: string;
  id: number;
  iat: number;
  exp: number;
}

// Create a custom parameter decorator called `User`.
// Parameter decorators allow you to extract specific portions of the request object and inject them directly into your route handler's method signature.
export const User = createParamDecorator((data, context: ExecutionContext) => {
  // Get the HTTP request object.
  const request = context.switchToHttp().getRequest();

  // Return the `user` property from the request object (which was potentially populated by a previous interceptor or middleware).
  return request.user;
});

export const Token = createParamDecorator((data, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  return request.token;
});
