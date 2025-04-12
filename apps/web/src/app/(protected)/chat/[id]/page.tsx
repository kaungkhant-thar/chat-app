"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { useSocket } from "@web/context/socket.context";
import { useTRPC } from "@web/lib/trpc";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { ChatMessage } from "@shared/schemas";
import Call from "./call";

const Page = () => {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const trpc = useTRPC();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

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
      console.log({ message });
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
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket]);

  return (
    <div>
      <Call userId={userId} />
      {chat ? (
        <div>
          <ul>
            {chat.messages.map((message) => (
              <li key={message.id}>{message.content}</li>
            ))}
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              sendMessageMutation.mutateAsync({
                chatId: chat.id,
                content: e.target.message.value,
              });
            }}
          >
            <Input name="message" />
          </form>
        </div>
      ) : (
        <div className="grid place-items-center my-32">
          <Button
            loading={createChatMutation.isPending}
            onClick={async () => {
              await createChatMutation.mutateAsync({
                userIds: [userId],
              });
              refetch();
            }}
          >
            Start Chat with your friend
          </Button>
        </div>
      )}
    </div>
  );
};

export default Page;
