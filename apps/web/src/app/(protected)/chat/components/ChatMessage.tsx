"use client";

import { cn } from "@web/lib/utils";
import { type ChatMessage as ChatMessageType } from "./types";
import { Avatar, AvatarFallback } from "@web/components/ui/avatar";
import { useState, useCallback } from "react";
import { Button } from "@web/components/ui/button";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@web/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@web/lib/trpc";

const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const LONG_PRESS_DURATION = 500; // 500ms for long press

type ReactionCount = {
  emoji: string;
  count: number;
  users: { id: string; name: string }[];
};

const ReactionButton = ({
  emoji,
  count,
  users,
  onReactionClick,
}: {
  emoji: string;
  count: number;
  users: { id: string; name: string }[];
  onReactionClick: (emoji: string) => void;
}) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="h-5 px-1.5 flex items-center gap-0.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => onReactionClick(emoji)}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span className="text-[11px] text-black dark:text-white font-medium">
              {count}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-white dark:bg-gray-800 px-2 py-1"
        >
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {users.map((u) => u.name).join(", ")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const MessageReactions = ({
  reactions,
  isCurrentUser,
  onReactionClick,
  setShowReactionBar,
}: {
  reactions: ChatMessageType["reactions"];
  isCurrentUser: boolean;
  onReactionClick: (emoji: string) => void;
  setShowReactionBar: (show: boolean) => void;
}) => {
  // Group reactions by emoji
  const reactionCounts = reactions.reduce<ReactionCount[]>((acc, reaction) => {
    const existing = acc.find((r) => r.emoji === reaction.emoji);
    if (existing) {
      existing.count++;
      existing.users.push(reaction.user);
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [reaction.user],
      });
    }
    return acc;
  }, []);

  if (reactionCounts.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute -bottom-4 flex flex-wrap gap-0.5 z-10",
        isCurrentUser ? "right-0" : "left-0"
      )}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setShowReactionBar(false);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        setShowReactionBar(false);
      }}
    >
      {reactionCounts.map(({ emoji, count, users }) => (
        <ReactionButton
          key={emoji}
          emoji={emoji}
          count={count}
          users={users}
          onReactionClick={onReactionClick}
        />
      ))}
    </div>
  );
};

const ReactionBar = ({
  onReactionClick,
  onMoreClick,
  isCurrentUser,
}: {
  onReactionClick: (emoji: string) => void;
  onMoreClick: () => void;
  isCurrentUser: boolean;
}) => {
  return (
    <div
      className={cn(
        "absolute -top-7 flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-full shadow-lg px-1 py-0.5 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200 z-10",
        isCurrentUser ? "right-0" : "left-0"
      )}
    >
      {COMMON_REACTIONS.map((emoji) => (
        <TooltipProvider key={emoji} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onReactionClick(emoji)}
              >
                <span className="text-base">{emoji}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <p>React with {emoji}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={onMoreClick}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
};

const getBorderRadiusClass = (
  isCurrentUser: boolean,
  messagePosition: "single" | "first" | "middle" | "last"
) => {
  const base = isCurrentUser ? "rounded-l-2xl" : "rounded-r-2xl";

  switch (messagePosition) {
    case "single":
      return "rounded-2xl";
    case "first":
      return cn(
        base,
        isCurrentUser ? "rounded-tr-2xl" : "rounded-tl-2xl",
        "rounded-b-2xl"
      );
    case "middle":
      return base;
    case "last":
      return cn(base, isCurrentUser ? "rounded-br-2xl" : "rounded-bl-2xl");
    default:
      return "rounded-2xl";
  }
};

const shouldShowTime = (
  messagePosition: "single" | "first" | "middle" | "last"
) => {
  return messagePosition === "single" || messagePosition === "last";
};

const ChatMessage = ({
  content,
  isCurrentUser = false,
  showAvatar,
  messagePosition = "single",
  createdAt,
  sender,
  id,
  reactions,
}: ChatMessageType) => {
  console.log({ reactions });
  const trpc = useTRPC();
  const reactMutation = useMutation(trpc.reactMessage.mutationOptions());
  const [showReactionBar, setShowReactionBar] = useState(false);
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
    // Prevent the context menu from showing on long press
    e.preventDefault();
  };

  const handleReactionClick = async (emoji: string) => {
    await reactMutation.mutateAsync({
      emoji,
      messageId: id,
    });
    setShowReactionBar(false);
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

export { ChatMessage };
