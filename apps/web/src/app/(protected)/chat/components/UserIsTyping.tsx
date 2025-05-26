import { useQuery } from "@tanstack/react-query";
import { useSocket } from "@web/context/socket.context";
import { useTRPC } from "@web/lib/trpc";
import React, { useEffect, useState } from "react";

type TypingEvent = {
  fromUserId: string;
  chatId: string;
};

const UserIsTyping = ({
  userId,
  chatId,
}: {
  userId: string;
  chatId: string;
}) => {
  const { socket } = useSocket();
  const trpc = useTRPC();
  const [isTyping, setIsTyping] = useState(false);

  const { data } = useQuery(
    trpc.findUserById.queryOptions({
      id: userId,
    })
  );

  useEffect(() => {
    if (!socket) return;

    const handleTyping = (event: TypingEvent) => {
      console.log("received typing event", event);
      if (event.chatId === chatId && event.fromUserId === userId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (event: TypingEvent) => {
      if (event.chatId === chatId && event.fromUserId === userId) {
        setIsTyping(false);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
    };
  }, [socket, chatId, userId]);

  if (!data || !isTyping) return null;

  return (
    <div className="px-6 inline bg-transparent absolute bottom-18">
      <div className="flex  text-sm items-center text-gray-500 ">
        <span className="">{data?.name} is typing</span>
        <div className="flex ml-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="animate-bounce text-2xl"
              style={{
                animationDuration: "0.8s",
                animationDelay: `${i * 0.2}s`,
                opacity: 0.6,
              }}
            >
              .
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserIsTyping;
