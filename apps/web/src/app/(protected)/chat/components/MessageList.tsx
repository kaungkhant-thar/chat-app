import { type MessageListProps } from "./types";

import { DateSeparator } from "./DateSeparator";
import { EmptyChat } from "./EmptyChat";
import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";

export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const messageStartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // For flex-col-reverse, we scroll to top for new messages
    messageStartRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages.length) {
    return <EmptyChat />;
  }
  console.log({ messages });
  const elements: React.ReactNode[] = [];
  let lastDate = "";

  [...messages].reverse().forEach((message, index) => {
    const messageDate = new Date(message.createdAt);
    const currentDate = messageDate.toLocaleDateString();

    const nextMessage = index > 0 ? messages[messages.length - index] : null;
    const prevMessage =
      index < messages.length - 1
        ? messages[messages.length - index - 2]
        : null;

    if (currentDate !== lastDate) {
      elements.push(
        <DateSeparator
          key={`date-${currentDate}-${messages.length - index - 1}`}
          date={messageDate.toISOString()}
        />
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
      <div ref={messageStartRef} />
    </div>
  );
};
