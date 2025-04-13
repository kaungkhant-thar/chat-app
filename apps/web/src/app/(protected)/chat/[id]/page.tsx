"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { useSocket } from "@web/context/socket.context";
import { useTRPC } from "@web/lib/trpc";
import { useParams } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@shared/schemas";
import Call from "./call";
import { cn } from "@web/lib/utils";
import { Send } from "lucide-react";
import { ScrollArea } from "@web/components/ui/scroll-area";
import { format, isSameDay, isToday, isYesterday } from "date-fns";

type MessageProps = {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

const Message = ({
  message,
  isOwnMessage,
  showTimestamp,
  isFirstInGroup,
  isLastInGroup,
}: MessageProps) => {
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
          !isLastInGroup && (isOwnMessage ? "rounded-br-md" : "rounded-bl-md")
        )}
      >
        {message.content}
      </div>
      {showTimestamp && (
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
  const sendMessageMutation = useMutation(trpc.sendMessage.mutationOptions());

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: ChatMessage) => {
      queryClient.setQueryData(
        trpc.getChat.queryKey({
          userIds: [userId],
        }),
        (oldData) =>
          oldData
            ? {
                ...oldData,
                messages: [...oldData.messages, message],
              }
            : null
      );
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

              sendMessageMutation.mutateAsync({
                chatId: chat.id,
                content: input.value,
              });

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
