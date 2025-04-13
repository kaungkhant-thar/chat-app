import { protectedProcedure, router } from '@server/trpc/trpc';
import { z } from 'zod';

export const usersRouter = router({
  findOtherUsers: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.userId;

    return ctx.usersService.findOtherUsers(userId);
  }),

  findUserById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      const { id } = input;

      const user = ctx.usersService.findUserById(id);

      return user;
    }),
});
