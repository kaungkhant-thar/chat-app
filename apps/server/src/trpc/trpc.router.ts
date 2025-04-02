import { authRouter } from '@server/auth/auth.router';
import { mergeRouters } from './trpc';

import { usersRouter } from '@server/users/users.router';
import { chatsRouter } from '@server/chat/chat.router';

export const appRouter = mergeRouters(authRouter, usersRouter, chatsRouter);

export type AppRouter = typeof appRouter;
