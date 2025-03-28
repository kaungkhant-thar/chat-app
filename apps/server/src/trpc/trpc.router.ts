import { authRouter } from '@server/auth/auth.router';
import { mergeRouters, router } from './trpc';
import { usersRouter } from '@server/users/users.router';

export const appRouter = mergeRouters(authRouter, usersRouter);

export type AppRouter = typeof appRouter;
