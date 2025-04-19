"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import { SendHorizontal, SmileIcon } from "lucide-react";
import { Textarea } from "@web/components/ui/textarea";
import { Button } from "@web/components/ui/button";
import { useSocket } from "@web/context/socket.context";
import { type ChatInputProps } from "./types";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@web/components/ui/popover";

import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

export const ChatInput = ({
  onSendMessage,
  isLoading,
  chatId,
  toUserId,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { socket } = useSocket();

  const emitTyping = useCallback(() => {
    socket?.emit("typing", { chatId, toUserId });
  }, [socket, chatId, toUserId]);

  const emitStopTyping = useCallback(() => {
    socket?.emit("stop-typing", { chatId, toUserId });
  }, [socket, chatId, toUserId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage("");
    emitStopTyping();
  };

  const handleEmojiSelect = (emoji: any) => {
    inputRef.current?.focus();
    setIsEmojiPickerOpen(true);
    setMessage((prev) => prev + emoji.native);
  };

  useEffect(() => {
    let typingTimer: NodeJS.Timeout;

    if (message.trim()) {
      emitTyping();
      typingTimer = setTimeout(emitStopTyping, 1500);
    }

    return () => {
      clearTimeout(typingTimer);
    };
  }, [message, emitTyping, emitStopTyping]);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 border-t bg-background p-4"
    >
      <div className="relative flex-1">
        <Textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[60px] pr-12 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
            >
              <SmileIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[340px] p-0 border rounded-lg shadow-lg"
            side="top"
            align="end"
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
      </div>

      <Button
        type="submit"
        size="icon"
        variant="ghost"
        className="hover:bg-transparent"
        disabled={isLoading || !message.trim()}
      >
        <SendHorizontal className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      </Button>
    </form>
  );
};
