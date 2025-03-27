import { authRouter } from '@server/auth/auth.router';
import { mergeRouters, router } from './trpc';

export const appRouter = mergeRouters(authRouter);

export type AppRouter = typeof appRouter;
