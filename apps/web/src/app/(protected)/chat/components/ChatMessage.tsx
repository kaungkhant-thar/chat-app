"use client";

import { cn } from "@web/lib/utils";
import { type ChatMessage as ChatMessageType } from "./types";
import { Avatar, AvatarFallback } from "@web/components/ui/avatar";
import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@web/lib/trpc";
import { LONG_PRESS_DURATION } from "./constants";
import { ReactionBar } from "./ReactionBar";
import { MessageReactions } from "./MessageReactions";
import { getBorderRadiusClass, shouldShowTime } from "./utils";
import { useSocket } from "@web/context/socket.context";

type ChatMessageProps = ChatMessageType & {
  chatId: string;
};

export const ChatMessage = ({
  content,
  isCurrentUser = false,
  showAvatar,
  messagePosition = "single",
  createdAt,
  sender,
  id,
  reactions,
  chatId,
}: ChatMessageProps) => {
  const trpc = useTRPC();
  const { socket } = useSocket();
  const reactMutation = useMutation(trpc.reactMessage.mutationOptions());
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Debug socket connection
  useEffect(() => {
    console.log("Socket connection status:", socket?.connected);
    if (socket) {
      console.log("Socket ID:", socket.id);
    }
  }, [socket]);

  const handleTouchStart = useCallback(() => {
    const timer = setTimeout(() => {
      setShowReactionBar(true);
    }, LONG_PRESS_DURATION);
    setLongPressTimer(timer);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleReactionClick = async (emoji: string) => {
    try {
      console.log("Adding reaction:", { emoji, messageId: id, chatId });

      await reactMutation.mutateAsync({
        emoji,
        messageId: id,
      });

      // Emit socket event for real-time updates
      if (socket?.connected) {
        console.log("Emitting reaction event");
        socket.emit("reaction", {
          messageId: id,
          emoji,
          chatId,
        });
      } else {
        console.error("Socket not connected");
      }

      setShowReactionBar(false);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleMoreClick = () => {
    console.log("More reactions clicked");
  };

  const showTime = shouldShowTime(messagePosition);

  return (
    <div
      className={cn(
        "flex w-full gap-2 px-4",
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {showAvatar && (
        <Avatar className={cn("h-8 w-8 rounded-full")}>
          <AvatarFallback
            className={cn(
              "text-white",
              isCurrentUser ? " bg-blue-500" : "bg-gray-500"
            )}
          >
            {sender.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {!showAvatar && <div className="w-8" />}
      <div
        className={cn(
          "relative my-0.5 max-w-[80%] px-4 py-2 select-none touch-none",
          getBorderRadiusClass(isCurrentUser, messagePosition),
          isCurrentUser
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-900",
          !showTime && "py-1.5",
          reactions.length > 0 && "mb-5"
        )}
        onMouseEnter={() => setShowReactionBar(true)}
        onMouseLeave={() => setShowReactionBar(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        {showReactionBar && (
          <ReactionBar
            onReactionClick={handleReactionClick}
            onMoreClick={handleMoreClick}
            isCurrentUser={isCurrentUser}
          />
        )}
        <p className="break-words text-sm">{content}</p>
        {showTime && (
          <p className="mt-1 text-xs opacity-50">
            {new Date(createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        <MessageReactions
          reactions={reactions}
          isCurrentUser={isCurrentUser}
          onReactionClick={handleReactionClick}
          setShowReactionBar={setShowReactionBar}
        />
      </div>
    </div>
  );
};
