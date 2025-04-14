"use client";

import React, { useState } from "react";
import CallControls from "@web/app/(protected)/chat/[id]/call-controls";
import { useTRPC } from "@web/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@web/components/ui/skeleton";
import { useParams } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@web/components/ui/button";
import { useAuthStore } from "@web/store/auth";
import Link from "next/link";
import { cn } from "@web/lib/utils";

type ChatLayoutProps = {
  children: React.ReactNode;
};

const ChatLayout = ({ children }: ChatLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const params = useParams();
  const trpc = useTRPC();
  const { data: profile } = useQuery(trpc.profile.queryOptions());
  const { data: user, isLoading } = useQuery(
    trpc.findUserById.queryOptions({ id: params.id as string })
  );
  const { data: users = [] } = useQuery(trpc.findOtherUsers.queryOptions());

  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleUserSelect = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="grid lg:grid-cols-[280px_1fr] h-screen overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r lg:static",
          "transform transition-transform duration-200 ease-in-out lg:transform-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex-shrink-0">
            <h1 className="text-xl font-semibold">Chat App</h1>

            <p>Logged in as {profile?.email}</p>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <ul className="p-4 space-y-2">
              {users.map((user) => (
                <li key={user.id}>
                  <Link
                    href={`/chat/${user.id}`}
                    className={cn(
                      "block px-4 py-2 rounded-lg hover:bg-muted transition-colors",
                      params.id === user.id && "bg-muted"
                    )}
                    onClick={handleUserSelect}
                  >
                    <span className="font-medium">
                      {user.name || user.email}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col h-full overflow-hidden">
        <header className="h-16 shrink-0 border-b flex items-center px-4 md:px-6 justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <h2 className="text-lg font-medium truncate max-w-[200px] md:max-w-none">
                {user?.name || user?.email || "Chat"}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <CallControls userId={params.id as string} />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className="hover:bg-muted"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};

export default ChatLayout;
