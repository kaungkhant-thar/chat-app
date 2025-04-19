import { cn } from "@web/lib/utils";

type UserAvatarProps = {
  name: string;
  isOnline?: boolean;
  size?: "sm" | "md";
};

export const UserAvatar = ({
  name,
  isOnline,
  size = "md",
}: UserAvatarProps) => {
  return (
    <div className="relative flex-shrink-0">
      <div
        className={cn(
          "rounded-full bg-gray-200 flex items-center justify-center",
          size === "md" ? "w-9 h-9" : "w-8 h-8"
        )}
      >
        <span
          className={cn(
            "font-medium text-gray-600",
            size === "md" ? "text-sm" : "text-xs"
          )}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
      {isOnline && (
        <div
          className={cn(
            "bg-green-500 rounded-full absolute border-2 border-white",
            size === "md"
              ? "w-3 h-3 -right-0.5 -bottom-0.5"
              : "w-2 h-2 -right-0.5 -bottom-0.5"
          )}
        />
      )}
    </div>
  );
};
