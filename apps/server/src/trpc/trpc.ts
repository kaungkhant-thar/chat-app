import { initTRPC } from '@trpc/server';
import { ContextType } from './trpc.context';

const t = initTRPC.context<ContextType>().create();

export const router = t.router;
export const procedure = t.procedure;
export const mergeRouters = t.mergeRouters;
export const middleware = t.middleware;

const isAuthenticated = middleware(async ({ ctx, next }) => {
  const token = ctx.req.headers.authorization;

  if (!token) {
    throw new Error('Unauthorized');
  }
  const tokenValue = token.split(' ')[1];

  const user = await ctx.authService.verifyToken(tokenValue);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return next({ ctx: { ...ctx, user } });
});

export const protectedProcedure = t.procedure.use(
  isAuthenticated,
) as typeof procedure;
