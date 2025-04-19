import { Menu, LogOut } from "lucide-react";
import { Button } from "@web/components/ui/button";
import { Skeleton } from "@web/components/ui/skeleton";
import { type User } from "../types";
import { UserStatus } from "./UserStatus";
import CallControls from "../chat/[id]/call-controls";

type ChatHeaderProps = {
  isLoading: boolean;
  otherUser?: User;
  onLogout: () => void;
  onToggleSidebar: () => void;
};

export const ChatHeader = ({
  isLoading,
  otherUser,
  onLogout,
  onToggleSidebar,
}: ChatHeaderProps) => {
  return (
    <header className="h-16 shrink-0 border-b flex items-center px-4 md:px-6 justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {isLoading ? (
          <Skeleton className="h-6 w-32" />
        ) : otherUser ? (
          <div className="flex flex-col">
            <h2 className="text-lg font-medium truncate max-w-[200px] md:max-w-none">
              {otherUser.name}
            </h2>
            <UserStatus userPresence={otherUser.userPresence} />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {otherUser && <CallControls userId={otherUser.id} />}
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          title="Logout"
          className="hover:bg-muted"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
