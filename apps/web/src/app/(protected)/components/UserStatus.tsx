import { type User } from "../types";

type UserStatusProps = {
  userPresence?: User["userPresence"];
  size?: "sm" | "md";
};

export const UserStatus = ({ userPresence, size = "sm" }: UserStatusProps) => {
  const isOnline = userPresence?.status === "online";

  return (
    <div className="flex items-center gap-1.5">
      {isOnline && (
        <div
          className={
            size === "sm"
              ? "w-2 h-2 bg-green-500 rounded-full"
              : "w-3 h-3 bg-green-500 rounded-full"
          }
        />
      )}
      <p className="text-xs text-gray-500">
        {isOnline
          ? "Active now"
          : userPresence?.updatedAt
          ? `Last seen at ${new Date(userPresence.updatedAt).toLocaleString(
              "en-US",
              {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }
            )}`
          : "Offline"}
      </p>
    </div>
  );
};
