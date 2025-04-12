import { protectedProcedure, router } from '@server/trpc/trpc';

export const usersRouter = router({
  findOtherUsers: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.userId;

    return ctx.usersService.findOtherUsers(userId);
  }),
});
