import { type EmptyChatProps } from "./types";

export const EmptyChat = ({ message = "No messages yet" }: EmptyChatProps) => {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
};
