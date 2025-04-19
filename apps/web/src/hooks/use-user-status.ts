import { useSocket } from "@web/context/socket.context";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@web/lib/trpc";

type UserStatusEvent = {
  userId: string;
  status: string;
};

export const useUserStatus = () => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  useEffect(() => {
    if (!socket) return;

    const handleUserStatus = (event: UserStatusEvent) => {
      // Update the user status in all relevant queries
      queryClient.invalidateQueries({
        queryKey: trpc.getChats.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.getChatById.queryKey(),
      });
    };

    socket.on("user-status", handleUserStatus);

    return () => {
      socket.off("user-status", handleUserStatus);
    };
  }, [socket, queryClient, trpc]);
};
