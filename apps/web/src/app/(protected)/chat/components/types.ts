import { type AppRouter } from "@server/trpc/trpc.router";

type ChatData = NonNullable<AppRouter["getChat"]["_def"]["$types"]["output"]>;
type Message = ChatData["messages"][number];

export type ChatMessage = Message & {
  isCurrentUser?: boolean;
  showAvatar?: boolean;
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
};

export type EmptyChatProps = {
  message?: string;
};
