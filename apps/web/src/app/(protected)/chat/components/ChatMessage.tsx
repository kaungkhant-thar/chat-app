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
import {
  getBorderRadiusClass,
  shouldShowTime,
  isEmojiOnlyMessage,
} from "./utils";
import { useSocket } from "@web/context/socket.context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@web/components/ui/popover";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );

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
      await reactMutation.mutateAsync({
        emoji,
        messageId: id,
      });

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
    setIsEmojiPickerOpen(true);
  };

  const handleEmojiSelect = (emoji: any) => {
    handleReactionClick(emoji.native);
    setIsEmojiPickerOpen(false);
  };

  const showTime = shouldShowTime(messagePosition);
  const isEmojiOnly = isEmojiOnlyMessage(content);

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
      <div className="flex flex-col max-w-[80%] relative">
        <div
          className={cn(
            "relative px-4 py-2 select-none touch-none",
            getBorderRadiusClass(isCurrentUser, messagePosition),
            isEmojiOnly
              ? "bg-transparent"
              : isCurrentUser
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-900",
            !showTime && "py-1.5",
            isEmojiOnly && "!px-3 !py-1"
          )}
          onMouseEnter={() => setShowReactionBar(true)}
          onMouseLeave={() => {
            setShowReactionBar(false);
            setIsEmojiPickerOpen(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
          onContextMenu={handleContextMenu}
        >
          {showReactionBar && (
            <Popover open={isEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <div
                  className={cn(
                    "absolute -top-0",
                    isCurrentUser ? "right-0" : "left-0"
                  )}
                >
                  <ReactionBar
                    onReactionClick={handleReactionClick}
                    onMoreClick={handleMoreClick}
                    isCurrentUser={isCurrentUser}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-[340px] p-0 border rounded-lg shadow-lg"
                side="top"
                align={isCurrentUser ? "end" : "start"}
                sideOffset={5}
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                  previewPosition="none"
                  maxFrequentRows={1}
                />
              </PopoverContent>
            </Popover>
          )}

          <p
            className={cn(
              "break-words",
              isEmojiOnly ? "text-4xl leading-none" : "text-sm",
              isCurrentUser ? "text-right" : "text-left"
            )}
          >
            {content}
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 -mt-1 relative z-10 mb-1",
            isCurrentUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          {reactions.length > 0 && (
            <div className="flex items-center">
              <MessageReactions
                reactions={reactions}
                isCurrentUser={isCurrentUser}
                onReactionClick={handleReactionClick}
                setShowReactionBar={setShowReactionBar}
              />
            </div>
          )}
          {showTime && (
            <p className="text-xs mt-1 text-gray-500 flex-shrink-0">
              {new Date(createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
