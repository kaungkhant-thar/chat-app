import { type RouterOutput } from "@web/lib/trpc.types";

type ChatData = NonNullable<RouterOutput["getChat"]>;
type Message = ChatData["messages"][number];

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
