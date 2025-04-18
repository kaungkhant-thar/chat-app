import { type RouterOutput } from "@web/lib/trpc.types";

type ChatData = NonNullable<RouterOutput["getChatById"]>;
type Message = ChatData["messages"][number];

export type User = {
  id: string;
  name: string;
};

export type Reaction = {
  emoji: string;
  user: User;
};

export type ChatMessage = {
  id: string;
  content: string;
  isCurrentUser?: boolean;
  showAvatar: boolean;
  messagePosition: "single" | "first" | "middle" | "last";
  createdAt: string;
  sender: User;
  reactions: Reaction[];
};

export type ReactionCount = {
  emoji: string;
  count: number;
  users: User[];
};

export type DateSeparatorProps = {
  date: string;
};

export type MessageListProps = {
  messages: Message[];
  currentUserId: string;
  chatId: string;
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
