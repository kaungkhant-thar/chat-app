import { useQuery } from "@tanstack/react-query";
import { useSocket } from "@web/context/socket.context";
import { useTRPC } from "@web/lib/trpc";
import React, { useEffect, useState } from "react";

const UserIsTyping = ({ userId }: { userId: string }) => {
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

    const handleTyping = () => setIsTyping(true);
    const handleStopTyping = () => setIsTyping(false);

    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
    };
  }, [socket]);

  if (!data || !isTyping) return null;

  return (
    <div className="px-4 py-1">
      <div className="flex items-center text-sm text-gray-500">
        <span className="text-gray-400">{data.name} is typing</span>
        <div className="flex ml-1">
          <div className="flex">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="animate-bounce"
                style={{
                  animationDuration: "0.8s",
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6,
                }}
              >
                •
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserIsTyping;
