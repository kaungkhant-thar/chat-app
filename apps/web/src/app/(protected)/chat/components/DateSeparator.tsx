import { type DateSeparatorProps } from "./types";

export const DateSeparator = ({ date }: DateSeparatorProps) => {
  const formatDate = (dateStr: string) => {
    const today = new Date();
    const messageDate = new Date(dateStr);

    // If it's today
    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }

    // If it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // For other dates
    return messageDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year:
        messageDate.getFullYear() !== today.getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  return (
    <div className="my-2 flex items-center justify-center">
      <div className="relative w-full">
        <div className="relative flex justify-center">
          <span className=" px-2 text-xs text-gray-500 dark:text-gray-400">
            {formatDate(date)}
          </span>
        </div>
      </div>
    </div>
  );
};
