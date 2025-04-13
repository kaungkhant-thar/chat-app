import { type DateSeparatorProps } from "./types";

export const DateSeparator = ({ date }: DateSeparatorProps) => {
  return (
    <div className="my-4 flex items-center justify-center">
      <div className="text-xs text-gray-500">{date}</div>
    </div>
  );
};
