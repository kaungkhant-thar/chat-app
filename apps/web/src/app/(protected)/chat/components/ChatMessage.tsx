"use client";

import { cn } from "@web/lib/utils";
import { type ChatMessage as ChatMessageType } from "./types";

const ChatMessage = ({
  content,
  isCurrentUser,
  showAvatar,
  createdAt,
}: ChatMessageType) => {
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
          "my-1 max-w-[80%] rounded-2xl px-4 py-2",
          isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
        )}
      >
        <p className="break-words text-sm">{content}</p>
        <p className="mt-1 text-xs opacity-50">
          {new Date(createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

export { ChatMessage };
