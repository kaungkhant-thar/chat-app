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
