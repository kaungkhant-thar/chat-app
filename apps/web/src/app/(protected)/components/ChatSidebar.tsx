import Link from "next/link";
import { cn } from "@web/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { type ChatList } from "../types";

type ChatSidebarProps = {
  chats: ChatList;
  currentUserId?: string;
  currentChatId?: string;
  userName?: string;
  onChatSelect: () => void;
  className?: string;
};

export const ChatSidebar = ({
  chats,
  currentUserId,
  currentChatId,
  userName,
  onChatSelect,
  className,
}: ChatSidebarProps) => {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r lg:static",
        "transform transition-transform duration-200 ease-in-out lg:transform-none",
        className
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex-shrink-0">
          <h1 className="text-2xl font-semibold text-gray-900">Ease Chat</h1>
          <p className="text-sm text-gray-500">Logged in as {userName}</p>
        </div>
        <nav className="flex-1 overflow-y-auto bg-white">
          <ul className="py-1">
            {chats.map((chat) => {
              const otherUser = chat.users.find(
                (u) => u.user.id !== currentUserId
              )?.user;
              if (!otherUser) return null;
              const latestMessage = chat.messages[0];
              const isOnline = otherUser.userPresence?.status === "online";

              return (
                <li key={chat.id}>
                  <Link
                    href={`/chat/${chat.id}`}
                    className={cn(
                      "block px-4 py-2 transition-colors",
                      currentChatId === chat.id
                        ? "bg-[#f5f5f5]"
                        : "hover:bg-[#f5f5f5]"
                    )}
                    onClick={onChatSelect}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar name={otherUser.name} isOnline={isOnline} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[15px] text-gray-900">
                            {otherUser.name}
                          </span>
                          {latestMessage && (
                            <span className="text-xs text-gray-400">
                              {new Date(
                                latestMessage.createdAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        {latestMessage && (
                          <p className="text-sm text-gray-400 truncate">
                            {latestMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};
