import { z } from "zod";

export const CreateChatSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
});

export type CreateChatInput = z.infer<typeof CreateChatSchema>;

export const GetChatSchema = z.object({
  userIds: z.array(z.string()),
});

export const GetChatByIdSchema = z.object({
  chatId: z.string(),
});

export type GetChatInput = z.infer<typeof GetChatSchema>;
export type GetChatByIdInput = z.infer<typeof GetChatByIdSchema>;

export const SendMessageSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().min(1),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  senderId: z.string().uuid(),
  sender: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  chatId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ReactToMessageSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string(),
});

export type ReactToMessageInput = z.infer<typeof ReactToMessageSchema>;
