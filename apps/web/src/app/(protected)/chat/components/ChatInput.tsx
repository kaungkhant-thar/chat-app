import { SendHorizontal } from "lucide-react";
import {
  useState,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useCallback,
} from "react";
import { type ChatInputProps } from "./types";
import { Textarea } from "@web/components/ui/textarea";
import { Button } from "@web/components/ui/button";
import { useSocket } from "@web/context/socket.context";

export const ChatInput = ({
  onSendMessage,
  isLoading,
  chatId,
  toUserId,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { socket } = useSocket();

  const emitTyping = useCallback(() => {
    if (!socket) return;
    socket.emit("typing", { chatId, toUserId });
  }, [socket, chatId, toUserId]);

  const emitStopTyping = useCallback(() => {
    if (!socket) return;
    socket.emit("stop-typing", { chatId, toUserId });
  }, [socket, chatId, toUserId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage("");
    emitStopTyping();
  };

  // Debounced typing effect
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
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="min-h-[40px] max-h-[120px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <Button type="submit" size="icon" disabled={isLoading || !message.trim()}>
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </form>
  );
};
