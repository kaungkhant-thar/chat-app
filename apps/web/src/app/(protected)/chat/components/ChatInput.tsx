import { SendHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { type ChatInputProps } from "./types";
import { Textarea } from "@web/components/ui/textarea";
import { Button } from "@web/components/ui/button";

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage("");
  };

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
