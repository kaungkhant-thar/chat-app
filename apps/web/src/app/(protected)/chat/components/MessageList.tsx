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
    const messageDate = new Date(message.createdAt);
    const currentDate = messageDate.toLocaleDateString();
    const nextMessage = messages[index + 1];
    const prevMessage = messages[index - 1];

    if (currentDate !== lastDate) {
      elements.push(
        <DateSeparator key={`date-${currentDate}`} date={currentDate} />
      );
      lastDate = currentDate;
    }

    const showAvatar =
      !prevMessage ||
      prevMessage.senderId !== message.senderId ||
      new Date(message.createdAt).getTime() -
        new Date(prevMessage.createdAt).getTime() >
        300000;

    const nextMessageFromSameSender =
      nextMessage &&
      nextMessage.senderId === message.senderId &&
      new Date(nextMessage.createdAt).getTime() -
        new Date(message.createdAt).getTime() <=
        300000;

    const prevMessageFromSameSender =
      prevMessage &&
      prevMessage.senderId === message.senderId &&
      new Date(message.createdAt).getTime() -
        new Date(prevMessage.createdAt).getTime() <=
        300000;

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
