import { useCallback, useEffect } from "react";
import { useSocket } from "@web/context/socket.context";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@web/lib/trpc";

type ReactionEvent = {
  messageId: string;
  emoji: string;
  userId: string;
};

export const useChatReactions = (chatId: string) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const handleReaction = useCallback(
    (event: ReactionEvent) => {
      console.log("Received reaction event:", event);

      // Log current query state before invalidation
      const currentData = queryClient.getQueryData(
        trpc.getChatById.queryKey({ chatId })
      );
      console.log("Current chat data before invalidation:", currentData);

      // Invalidate the chat query to refetch with new reactions
      queryClient.invalidateQueries({
        queryKey: trpc.getChatById.queryKey({ chatId }),
      });

      // Log after invalidation
      console.log("Query invalidated for chat:", chatId);
    },
    [chatId, queryClient, trpc]
  );

  useEffect(() => {
    if (!socket) {
      // don't throw error, just return
      // console.error("Socket not available in useChatReactions");
      return;
    }

    const eventName = `chat:${chatId}:reaction`;
    console.log("Setting up reaction listener for event:", eventName);

    socket.on(eventName, handleReaction);

    return () => {
      console.log("Cleaning up reaction listener");
      socket.off(eventName, handleReaction);
    };
  }, [socket, chatId, handleReaction]);
};
