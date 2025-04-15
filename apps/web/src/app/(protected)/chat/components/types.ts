import { type AppRouter } from "@server/trpc/trpc.router";
import { type ChatMessage as APIChatMessage } from "@shared/schemas";

type ChatData = NonNullable<AppRouter["getChat"]["_def"]["$types"]["output"]>;
type Message = APIChatMessage;

export type ChatMessage = Message & {
  isCurrentUser?: boolean;
  showAvatar?: boolean;
  messagePosition?: "single" | "first" | "middle" | "last";
};

export type DateSeparatorProps = {
  date: string;
};

export type MessageListProps = {
  messages: Message[];
  currentUserId: string;
};

export type ChatInputProps = {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  chatId: string;
  toUserId: string;
};

export type EmptyChatProps = {
  message?: string;
};
