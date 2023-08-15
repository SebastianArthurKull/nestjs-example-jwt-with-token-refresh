import { UserType } from '@prisma/client';
import { SetMetadata } from '@nestjs/common';

// This is a custom decorator used to set roles metadata on route handlers or classes.

export const Roles = (...roles: UserType[]) =>
  // `SetMetadata` is a helper function provided by NestJS
  // that allows us to attach custom metadata to the context.
  SetMetadata('roles', roles);
