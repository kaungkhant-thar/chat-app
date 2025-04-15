import { protectedProcedure, router } from '@server/trpc/trpc';
import { z } from 'zod';

export const usersRouter = router({
  findOtherUsers: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    return ctx.appContext.getUsersService().findOtherUsers(userId);
  }),

  findUserById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      const { id } = input;

      const user = ctx.appContext.getUsersService().findUserById(id);

      return user;
    }),
});
