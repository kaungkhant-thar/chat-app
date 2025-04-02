import { protectedProcedure, router } from '@server/trpc/trpc';
import { CreateChatSchema, GetChatSchema } from '@shared/schemas';

export const chatsRouter = router({
  createChat: protectedProcedure
    .input(CreateChatSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;
      const { userIds } = input;
      return ctx.chatsService.createChat([userId, ...userIds]);
    }),

  getChat: protectedProcedure
    .input(GetChatSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.userId;
      const { userIds } = input;
      return ctx.chatsService.getChatByUsersIds([userId, ...userIds]);
    }),
});
