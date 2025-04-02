import { z } from "zod";

export const CreateChatSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
});

export type CreateChatInput = z.infer<typeof CreateChatSchema>;

export const GetChatSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
});

export type GetChatInput = z.infer<typeof GetChatSchema>;
