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
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    messageStartRef.current?.scrollIntoView({
      behavior: isInitialLoadRef.current ? "auto" : "smooth",
    });
    isInitialLoadRef.current = false;
  }, [messages.length]);

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

    // Check if messages are from the same sender AND within a reasonable time window
    const isWithinTimeThreshold = (msg1: any, msg2: any) => {
      if (!msg1 || !msg2) return false;
      const time1 = new Date(msg1.createdAt).getTime();
      const time2 = new Date(msg2.createdAt).getTime();
      // Messages sent within 5 minutes are considered part of the same group
      return Math.abs(time1 - time2) < 1000 * 60 * 5;
    };

    // Determine if this message is part of a sequence
    const nextMessageFromSameSender =
      nextMessage &&
      nextMessage.senderId === message.senderId &&
      isWithinTimeThreshold(message, nextMessage);

    const prevMessageFromSameSender =
      prevMessage &&
      prevMessage.senderId === message.senderId &&
      isWithinTimeThreshold(message, prevMessage);

    // Show avatar for the first message in a sequence
    const showAvatar = !prevMessageFromSameSender;

    // Determine message position in the sequence
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
    <div className="flex flex-1 gap-1 flex-col overflow-y-auto p-4">
      {elements}
      <div ref={messageStartRef} />
    </div>
  );
};
