import { type RouterOutput } from "@web/lib/trpc.types";

export type User = NonNullable<RouterOutput["findUserById"]>;
export type Chat = NonNullable<RouterOutput["getChatById"]>;
export type ChatList = NonNullable<RouterOutput["getChats"]>;
export type ChatItem = ChatList[number];
export type Profile = NonNullable<RouterOutput["profile"]>;
