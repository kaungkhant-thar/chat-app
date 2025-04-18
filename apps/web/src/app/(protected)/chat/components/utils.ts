import { cn } from "@web/lib/utils";

export const getBorderRadiusClass = (
  isCurrentUser: boolean,
  messagePosition: "single" | "first" | "middle" | "last"
) => {
  const base = isCurrentUser ? "rounded-l-2xl" : "rounded-r-2xl";

  switch (messagePosition) {
    case "single":
      return "rounded-2xl";
    case "first":
      return cn(
        base,
        isCurrentUser ? "rounded-tr-2xl" : "rounded-tl-2xl",
        "rounded-b-2xl"
      );
    case "middle":
      return base;
    case "last":
      return cn(base, isCurrentUser ? "rounded-br-2xl" : "rounded-bl-2xl");
    default:
      return "rounded-2xl";
  }
};

export const shouldShowTime = (
  messagePosition: "single" | "first" | "middle" | "last"
) => {
  return messagePosition === "single" || messagePosition === "last";
};

// Function to check if a character is an emoji
const isEmoji = (str: string) => {
  const emojiRanges = [
    /[\u{1F300}-\u{1F9FF}]/u, // Miscellaneous Symbols and Pictographs
    /[\u{1F600}-\u{1F64F}]/u, // Emoticons
    /[\u{2600}-\u{26FF}]/u, // Miscellaneous Symbols
    /[\u{2700}-\u{27BF}]/u, // Dingbats
    /[\u{1F900}-\u{1F9FF}]/u, // Supplemental Symbols and Pictographs
    /[\u{1F1E6}-\u{1F1FF}]/u, // Regional Indicator Symbols
  ];
  return emojiRanges.some((range) => range.test(str));
};

export const isEmojiOnlyMessage = (message: string) => {
  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) return false;

  // Split the message into characters and check if all are emojis
  const chars = Array.from(trimmedMessage);
  return (
    chars.every((char) => isEmoji(char) || char === " ") &&
    chars.some((char) => isEmoji(char))
  );
};
