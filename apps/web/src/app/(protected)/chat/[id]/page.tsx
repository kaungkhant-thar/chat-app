"use client";
import { ChatMessage } from "@shared/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { useSocket } from "@web/context/socket.context";
import { useTRPC } from "@web/lib/trpc";
import { ChatType } from "@web/lib/trpc.types";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ChatInput } from "../components/ChatInput";
import { MessageList } from "../components/MessageList";
import UserIsTyping from "../components/UserIsTyping";
import { useChatReactions } from "@web/hooks/use-chat-reactions";
import { Loader } from "lucide-react";

const ChatPage = () => {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const trpc = useTRPC();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery(trpc.profile.queryOptions());
  const {
    data: chat,
    refetch,
    isLoading,
  } = useQuery(trpc.getChatById.queryOptions({ chatId }));

  useChatReactions(chat?.id || "");

  const createChatMutation = useMutation(trpc.createChat.mutationOptions());
  const sendMessageMutation = useMutation({
    ...trpc.sendMessage.mutationOptions(),
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({
        queryKey: trpc.getChatById.queryKey({ chatId: newMessage.chatId }),
      });

      const previousChat = queryClient.getQueryData<ChatType>(
        trpc.getChatById.queryKey({ chatId: newMessage.chatId })
      );

      queryClient.setQueryData(
        trpc.getChatById.queryKey({ chatId: newMessage.chatId }),
        (old) => {
          if (!old) return null;
          return {
            ...old,
            messages: [
              ...old.messages,
              {
                id: `temp-${Date.now()}`,
                content: newMessage.content,
                senderId: profile?.id || "",
                sender: {
                  id: profile?.id || "",
                  email: profile?.email || "",
                  name: profile?.name || "",
                  password: "",
                  createdAt: new Date().toISOString(),
                },
                reactions: [],
                chatId: newMessage.chatId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        }
      );

      queryClient.setQueryData(["previousChat"], previousChat);
      return undefined;
    },
    onError: () => {
      const previousChat = queryClient.getQueryData<ChatType>(["previousChat"]);
      if (previousChat) {
        queryClient.setQueryData<ChatType | null>(
          trpc.getChatById.queryKey({ chatId: previousChat.id }),
          previousChat
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.getChatById.queryKey({ chatId: chat?.id || "" }),
      });
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!chat?.id) return;
    await sendMessageMutation.mutateAsync({
      chatId: chat.id,
      content,
    });
    queryClient.invalidateQueries({
      queryKey: trpc.getChats.queryKey(),
    });
    refetch();
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: ChatMessage) => {
      console.log("received message", message);
      queryClient.setQueryData(
        trpc.getChatById.queryKey({ chatId: message.chatId }),
        (oldData) => {
          if (!oldData) return null;

          const messageWithSender = {
            ...message,
            sender: {
              id: message.senderId,
              name: message.sender?.name || "Unknown",
              email: "",
              password: "",
              createdAt: new Date().toISOString(),
            },
            reactions: [],
          };

          const messageExists = oldData.messages.some(
            (existingMsg) =>
              existingMsg.id === message.id ||
              (existingMsg.id.startsWith("temp-") &&
                existingMsg.content === message.content &&
                existingMsg.senderId === message.senderId)
          );

          if (messageExists) {
            return {
              ...oldData,
              messages: oldData.messages.map((existingMsg) =>
                existingMsg.id.startsWith("temp-") &&
                existingMsg.content === message.content &&
                existingMsg.senderId === message.senderId
                  ? messageWithSender
                  : existingMsg
              ),
            };
          }

          return {
            ...oldData,
            messages: [...oldData.messages, messageWithSender],
          };
        }
      );
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket]);

  if (!profile) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="grid place-items-center place-content-center flex-1 px-4">
          <div className="flex gap-2 items-center text-center ">
            <p className="text-muted-foreground">Loading...</p>
            <Loader className="animate-spin" />
          </div>
        </div>
      </div>
    );
  }
  const otherUserId = chat?.users.find((user) => user.user.id !== profile.id)
    ?.user.id;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-80px)]">
      {chat ? (
        <>
          <MessageList
            messages={chat.messages}
            currentUserId={profile.id}
            chatId={chat.id}
          />
          <UserIsTyping userId={otherUserId || ""} chatId={chat.id} />

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={sendMessageMutation.isPending}
            chatId={chat.id}
            toUserId={otherUserId || ""}
          />
        </>
      ) : (
        <div className="grid place-items-center flex-1 px-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">No messages yet</p>
            <Button
              loading={createChatMutation.isPending}
              onClick={async () => {
                await createChatMutation.mutateAsync({
                  userIds: [otherUserId || ""],
                });
                refetch();
              }}
              size="lg"
              className="shadow-sm"
            >
              Start Chat with your friend
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
