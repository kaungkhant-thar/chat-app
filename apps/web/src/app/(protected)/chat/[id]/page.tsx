"use client";
import { ChatMessage } from "@shared/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { useSocket } from "@web/context/socket.context";
import { useTRPC } from "@web/lib/trpc";
import { ChatType } from "@web/lib/trpc.types";
import { cn } from "@web/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ChatInput } from "../components/ChatInput";
import { MessageList } from "../components/MessageList";
import UserIsTyping from "../components/UserIsTyping";

type MessageStatus = "sending" | "sent" | "error";

type OptimisticMessage = Omit<ChatMessage, "updatedAt"> & {
  status: MessageStatus;
  tempId: string;
};

type MessageProps = {
  message: ChatMessage | OptimisticMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onRetry?: () => void;
};

type SendMessageVariables = {
  chatId: string;
  content: string;
};

const Page = () => {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const trpc = useTRPC();

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery(trpc.profile.queryOptions());
  const { data: chat, refetch } = useQuery(
    trpc.getChat.queryOptions({
      userIds: [userId],
    })
  );

  const createChatMutation = useMutation(trpc.createChat.mutationOptions());
  const sendMessageMutation = useMutation({
    ...trpc.sendMessage.mutationOptions(),
    onMutate: async (newMessage: SendMessageVariables) => {
      await queryClient.cancelQueries({
        queryKey: trpc.getChat.queryKey({
          userIds: [userId],
        }),
      });

      const previousChat = queryClient.getQueryData<ChatType>(
        trpc.getChat.queryKey({ userIds: [userId] })
      );

      queryClient.setQueryData(
        trpc.getChat.queryKey({ userIds: [userId] }),
        (old) => {
          if (!old) return null;
          return {
            ...old,
            messages: [
              ...old.messages,
              {
                id: `temp-${Date.now()}`,
                content: newMessage.content,
                senderId: profile?.userId || "",
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
          trpc.getChat.queryKey({ userIds: [userId] }),
          previousChat
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.getChat.queryKey({ userIds: [userId] }),
      });
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!chat?.id) return;
    await sendMessageMutation.mutateAsync({
      chatId: chat.id,
      content,
    });
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: ChatMessage) => {
      queryClient.setQueryData(
        trpc.getChat.queryKey({
          userIds: [userId],
        }),
        (oldData) => {
          if (!oldData) return null;

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
              messages: oldData.messages.map((existingMsg) => {
                if (
                  existingMsg.id.startsWith("temp-") &&
                  existingMsg.content === message.content &&
                  existingMsg.senderId === message.senderId
                ) {
                  return message;
                }
                return existingMsg;
              }),
            };
          }

          return {
            ...oldData,
            messages: [...oldData.messages, message],
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

  return (
    <div className="flex flex-col h-full">
      {chat ? (
        <>
          <MessageList
            messages={chat.messages}
            currentUserId={profile.userId}
          />
          <UserIsTyping userId={userId} chatId={chat.id} />
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={sendMessageMutation.isPending}
            chatId={chat.id}
            toUserId={userId}
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
                  userIds: [userId],
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

export default Page;
