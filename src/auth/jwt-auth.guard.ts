import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const handler = context.getHandler();
    const classRef = context.getClass();

    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      handler,
      classRef,
    ]);

    this.logger.debug(
      `${classRef.name}.${handler.name} - isPublic: ${isPublic}`,
    );

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
