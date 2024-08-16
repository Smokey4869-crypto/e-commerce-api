// import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";
// import { JwtService } from "@nestjs/jwt";
// import { Observable } from "rxjs";
// import { ROLES_KEY } from "../decorators/roles.decorator";

// @Injectable()
// export class RolesGuard implements CanActivate {
//     constructor(private reflector: Reflector, private jwtService: JwtService) {}

//     canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
//         const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
//             context.getHandler(),
//             context.getClass()
//         ]);

//         if (!requiredRoles) {
//             return true;
//         }

//         const request = context.switchToHttp().getRequest();
//         const token = request.headers.authorization?.split(' ')[1];

//         if (!token) {
//             throw new ForbiddenException('No token found');
//         }

//         const payload = this.jwtService.decode(token);

//         if (typeof payload !== 'object' || !payload) {
//             throw new ForbiddenException('Invalid token');
//         }

//         const roles = payload.roles as string[] || undefined;

//         if (roles && requiredRoles.some(role => roles.includes(role))) {
//             return true;
//         }

//         if (!roles) {
//             return requiredRoles.includes('user');
//         }

//         throw new ForbiddenException('You do not have permission to access this resources');
//     }
// }

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user; // Accessing user information set by the middleware

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const roles = user.roles || [];

    // If roles exist and match required roles, allow access
    if (roles.some((role) => requiredRoles.includes(role))) {
      return true;
    }

    // If no roles, assume it's a normal user if the required role is 'user'
    if (roles.length === 0) {
      return requiredRoles.includes('user');
    }

    throw new ForbiddenException(
      'You do not have permission to access this resource',
    );
  }
}
