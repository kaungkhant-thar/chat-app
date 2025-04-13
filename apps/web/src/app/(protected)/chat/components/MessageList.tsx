import { type MessageListProps } from "./types";

import { DateSeparator } from "./DateSeparator";
import { EmptyChat } from "./EmptyChat";
import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";

export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages.length) {
    return <EmptyChat />;
  }

  const elements: React.ReactNode[] = [];
  let lastDate = "";

  messages.forEach((message, index) => {
    const currentDate = new Date(message.createdAt).toLocaleDateString();
    const nextMessage = messages[index + 1];
    const prevMessage = messages[index - 1];

    // Add date separator if date changes
    if (currentDate !== lastDate) {
      elements.push(
        <DateSeparator key={`date-${currentDate}`} date={currentDate} />
      );
      lastDate = currentDate;
    }

    // Determine if we should show avatar based on message grouping
    const showAvatar =
      !prevMessage ||
      prevMessage.senderId !== message.senderId ||
      new Date(message.createdAt).getTime() -
        new Date(prevMessage.createdAt).getTime() >
        300000;

    elements.push(
      <ChatMessage
        key={message.id}
        {...message}
        isCurrentUser={message.senderId === currentUserId}
        showAvatar={showAvatar}
      />
    );
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      {elements}
      <div ref={messageEndRef} />
    </div>
  );
};
