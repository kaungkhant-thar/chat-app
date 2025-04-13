"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { useSocket } from "@web/context/socket.context";
import { useTRPC } from "@web/lib/trpc";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@shared/schemas";
import { cn } from "@web/lib/utils";
import { Send } from "lucide-react";
import { ScrollArea } from "@web/components/ui/scroll-area";
import { format, isSameDay, isToday, isYesterday } from "date-fns";

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

const Message = ({
  message,
  isOwnMessage,
  showTimestamp,
  isFirstInGroup,
  isLastInGroup,
  onRetry,
}: MessageProps) => {
  const isOptimistic = "status" in message;
  const status = isOptimistic ? message.status : "sent";

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isOwnMessage ? "items-end" : "items-start",
        isLastInGroup ? "mb-4" : "mb-1"
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-4 py-2 break-words shadow-sm max-w-[85%] sm:max-w-[70%] animate-in slide-in-from-bottom-1 duration-200",
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80 transition-colors",
          isFirstInGroup &&
            (isOwnMessage ? "rounded-tr-2xl" : "rounded-tl-2xl"),
          !isFirstInGroup && (isOwnMessage ? "rounded-tr-md" : "rounded-tl-md"),
          isLastInGroup &&
            (isOwnMessage ? "rounded-br-none" : "rounded-bl-none"),
          !isLastInGroup && (isOwnMessage ? "rounded-br-md" : "rounded-bl-md"),
          status === "sending" && "opacity-70",
          status === "error" && "bg-destructive/20"
        )}
      >
        <div className="flex items-center gap-2">
          {message.content}
          {status === "sending" && (
            <span className="text-xs opacity-70">Sending...</span>
          )}
          {status === "error" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 text-xs"
            >
              Retry
            </Button>
          )}
        </div>
      </div>
      {showTimestamp && status === "sent" && (
        <span className="text-[11px] text-muted-foreground px-1">
          {format(new Date(message.createdAt), "HH:mm")}
        </span>
      )}
    </div>
  );
};

const DateSeparator = ({ date }: { date: Date }) => {
  let label = "";
  if (isToday(date)) {
    label = "Today";
  } else if (isYesterday(date)) {
    label = "Yesterday";
  } else {
    label = format(date, "MMMM d, yyyy");
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-muted px-3 py-1 rounded-full">
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};

type ChatData = {
  id: string;
  messages: ChatMessage[];
  updatedAt: string;
  createdAt: string;
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
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

      const previousChat = queryClient.getQueryData<ChatData | null>(
        trpc.getChat.queryKey({ userIds: [userId] })
      );

      // Optimistically update to the new value
      queryClient.setQueryData<ChatData | null>(
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

      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });

      queryClient.setQueryData(["previousChat"], previousChat);
      return undefined;
    },
    onError: () => {
      const previousChat = queryClient.getQueryData<ChatData | null>([
        "previousChat",
      ]);
      if (previousChat) {
        queryClient.setQueryData<ChatData | null>(
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
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [chat?.messages]);

  if (!profile) return null;

  const renderMessages = () => {
    if (!chat?.messages.length) return null;

    let currentDate: Date | null = null;
    let currentSenderId: string | null = null;
    const elements: React.ReactElement[] = [];

    chat.messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt);
      const isOwnMessage = message.senderId === profile.userId;

      // Check if we need to add a date separator
      if (!currentDate || !isSameDay(currentDate, messageDate)) {
        currentDate = messageDate;
        elements.push(
          <DateSeparator key={`date-${message.id}`} date={messageDate} />
        );
      }

      const isFirstInGroup = currentSenderId !== message.senderId;
      const isLastInGroup =
        index === chat.messages.length - 1 ||
        chat.messages[index + 1].senderId !== message.senderId;

      currentSenderId = message.senderId;

      elements.push(
        <Message
          key={message.id}
          message={message}
          isOwnMessage={isOwnMessage}
          showAvatar={isLastInGroup}
          showTimestamp={isLastInGroup}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
        />
      );
    });

    return elements;
  };

  return (
    <div className="flex flex-col h-full">
      {chat ? (
        <>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4 md:p-6 space-y-2">
                {renderMessages()}
                <div ref={messageEndRef} />
              </div>
            </ScrollArea>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = inputRef.current;
              if (!input?.value.trim()) return;

              handleSendMessage(input.value);

              input.value = "";
            }}
            className="border-t p-4 md:p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0"
          >
            <div className="flex gap-2 max-w-4xl mx-auto">
              <Input
                ref={inputRef}
                name="message"
                placeholder="Type a message..."
                className="flex-1 shadow-sm"
              />
              <Button type="submit" size="icon" className="shrink-0 shadow-sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
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
