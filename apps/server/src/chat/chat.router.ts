import { protectedProcedure, router } from '@server/trpc/trpc';
import {
  CreateChatSchema,
  GetChatSchema,
  GetChatByIdSchema,
  SendMessageSchema,
  ReactToMessageSchema,
} from '@shared/schemas';

export const chatsRouter = router({
  createChat: protectedProcedure
    .input(CreateChatSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      const { userIds } = input;
      return ctx.appContext.getChatsService().createChat([userId, ...userIds]);
    }),

  getChats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    return ctx.appContext.getChatsService().getChats(userId);
  }),

  getChat: protectedProcedure
    .input(GetChatSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { userIds } = input;
      return ctx.appContext
        .getChatsService()
        .getChatByUsersIds([userId, ...userIds]);
    }),

  getChatById: protectedProcedure
    .input(GetChatByIdSchema)
    .query(async ({ ctx, input }) => {
      const { chatId } = input;
      return ctx.appContext.getChatsService().getChatById(chatId);
    }),

  sendMessage: protectedProcedure
    .input(SendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      return ctx.appContext.getChatsService().sendMessage(input, userId);
    }),

  reactMessage: protectedProcedure
    .input(ReactToMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      return ctx.appContext.getChatsService().reactToMessage(input, userId);
    }),

  reactToMessage: protectedProcedure
    .input(ReactToMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      return ctx.appContext.getChatsService().reactToMessage(input, userId);
    }),
});
