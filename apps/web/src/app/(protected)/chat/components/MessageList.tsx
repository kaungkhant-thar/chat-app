import { type MessageListProps } from "./types";

import { DateSeparator } from "./DateSeparator";
import { EmptyChat } from "./EmptyChat";
import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";

export const MessageList = ({
  messages,
  currentUserId,
  chatId,
}: MessageListProps) => {
  const messageStartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageStartRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages.length) {
    return <EmptyChat />;
  }

  const elements: React.ReactNode[] = [];
  let lastDate = "";

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedMessages.forEach((message, index) => {
    const messageDate = new Date(message.createdAt);
    const currentDate = messageDate.toLocaleDateString();

    const nextMessage = sortedMessages[index + 1] || null;
    const prevMessage = index > 0 ? sortedMessages[index - 1] : null;

    if (currentDate !== lastDate) {
      elements.push(
        <DateSeparator
          key={`date-${currentDate}-${index}`}
          date={messageDate.toISOString()}
        />
      );
      lastDate = currentDate;
    }

    const showAvatar =
      !prevMessage || prevMessage.senderId !== message.senderId;
    const nextMessageFromSameSender =
      nextMessage?.senderId === message.senderId;
    const prevMessageFromSameSender =
      prevMessage?.senderId === message.senderId;

    let messagePosition: "single" | "first" | "middle" | "last" = "single";

    if (prevMessageFromSameSender && nextMessageFromSameSender) {
      messagePosition = "middle";
    } else if (prevMessageFromSameSender) {
      messagePosition = "last";
    } else if (nextMessageFromSameSender) {
      messagePosition = "first";
    }

    elements.push(
      <ChatMessage
        key={message.id}
        {...message}
        isCurrentUser={message.senderId === currentUserId}
        showAvatar={showAvatar}
        messagePosition={messagePosition}
        chatId={chatId}
      />
    );
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      {elements}
      <div ref={messageStartRef} />
    </div>
  );
};
