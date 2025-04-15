"use client";

import { cn } from "@web/lib/utils";
import { type ChatMessage as ChatMessageType } from "./types";

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
}: ChatMessageType) => {
  const showTime = shouldShowTime(messagePosition);

  return (
    <div
      className={cn(
        "flex w-full gap-2 px-4",
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {showAvatar && (
        <div
          className={cn(
            "h-8 w-8 rounded-full",
            isCurrentUser ? "bg-blue-500" : "bg-gray-500"
          )}
        />
      )}
      {!showAvatar && <div className="w-8" />}
      <div
        className={cn(
          "my-0.5 max-w-[80%] px-4 py-2",
          getBorderRadiusClass(isCurrentUser, messagePosition),
          isCurrentUser
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-900",
          !showTime && "py-1.5" // Slightly reduce padding when no time is shown
        )}
      >
        <p className="break-words text-sm">{content}</p>
        {showTime && (
          <p className="mt-1 text-xs opacity-50">
            {new Date(createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export { ChatMessage };
