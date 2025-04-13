import { protectedProcedure, router } from '@server/trpc/trpc';
import {
  CreateChatSchema,
  GetChatSchema,
  SendMessageSchema,
} from '@shared/schemas';

export const chatsRouter = router({
  createChat: protectedProcedure
    .input(CreateChatSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;
      const { userIds } = input;
      return ctx.appContext.getChatsService().createChat([userId, ...userIds]);
    }),

  getChat: protectedProcedure
    .input(GetChatSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.userId;
      const { userIds } = input;
      return ctx.appContext
        .getChatsService()
        .getChatByUsersIds([userId, ...userIds]);
    }),

  sendMessage: protectedProcedure
    .input(SendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId;
      return ctx.appContext.getChatsService().sendMessage(input, userId);
    }),
});
