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
import { format } from "date-fns";

type MessageProps = {
  message: ChatMessage;
  isOwnMessage: boolean;
};

const Message = ({ message, isOwnMessage }: MessageProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[70%] mb-4",
        isOwnMessage ? "ml-auto" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-4 py-2 break-words",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted rounded-bl-none"
        )}
      >
        {message.content}
      </div>
      <span
        className={cn(
          "text-xs text-muted-foreground",
          isOwnMessage ? "text-right" : "text-left"
        )}
      >
        {format(new Date(message.createdAt), "HH:mm")}
      </span>
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

  return (
    <div className="flex flex-col h-full">
      {chat ? (
        <div className="flex flex-col flex-1 h-full">
          <ScrollArea className="flex-1 h-[calc(100vh-10rem)]">
            <div className="space-y-4 p-4">
              {chat.messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === profile.userId}
                />
              ))}
              <div ref={messageEndRef} />
            </div>
          </ScrollArea>

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
            className="border-t p-4 bg-background"
          >
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                name="message"
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid place-items-center flex-1">
          <Button
            loading={createChatMutation.isPending}
            onClick={async () => {
              await createChatMutation.mutateAsync({
                userIds: [userId],
              });
              refetch();
            }}
            size="lg"
          >
            Start Chat with your friend
          </Button>
        </div>
      )}
    </div>
  );
};

export default Page;
