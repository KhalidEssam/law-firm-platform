import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const handler = context.getHandler();
        const classRef = context.getClass();

        console.log('[JwtAuthGuard] Handler:', handler.name);
        console.log('[JwtAuthGuard] Class:', classRef.name);

        const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
            handler,
            classRef,
        ]);

        console.log('[JwtAuthGuard] IS_PUBLIC_KEY:', IS_PUBLIC_KEY);
        console.log('[JwtAuthGuard] isPublic:', isPublic);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }
}