import { cn } from "@web/lib/utils";

export const getBorderRadiusClass = (
  isCurrentUser: boolean,
  messagePosition: "single" | "first" | "middle" | "last"
) => {
  switch (messagePosition) {
    case "single":
      return "rounded-2xl";
    case "first":
      if (isCurrentUser) {
        return "rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"; // Right side sender, first message
      } else {
        return "rounded-tl-2xl rounded-tr-2xl rounded-br-2xl"; // Left side sender, first message
      }
    case "middle":
      if (isCurrentUser) {
        return "rounded-l-2xl"; // Right side sender, middle message
      } else {
        return "rounded-r-2xl"; // Left side sender, middle message
      }
    case "last":
      if (isCurrentUser) {
        return "rounded-bl-2xl rounded-br-2xl rounded-tl-2xl"; // Right side sender, last message
      } else {
        return "rounded-bl-2xl rounded-br-2xl rounded-tr-2xl"; // Left side sender, last message
      }
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
