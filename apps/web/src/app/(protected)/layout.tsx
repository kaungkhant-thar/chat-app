"use client";

import { useAuthStore } from "@web/store/auth";
import { Loader2, LogOut, Menu } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTRPC } from "@web/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { Skeleton } from "@web/components/ui/skeleton";
import { cn } from "@web/lib/utils";
import Link from "next/link";
import CallControls from "@web/app/(protected)/chat/[id]/call-controls";
import { type RouterOutput } from "@web/lib/trpc.types";

type ChatType = NonNullable<RouterOutput["getChats"]>[number];

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const trpc = useTRPC();

  const { data: profile } = useQuery(trpc.profile.queryOptions());
  const { data: chats = [] } = useQuery(trpc.getChats.queryOptions());
  console.log(chats);

  const { data: user, isLoading } = useQuery(
    trpc.findUserById.queryOptions({ id: params.id as string })
  );

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [hasHydrated, isAuthenticated]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

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
              {chats.map((chat: ChatType) => {
                const otherUser = chat.users.find(
                  (u) => u.user.id !== profile?.id
                )?.user;
                if (!otherUser) return null;
                return (
                  <li key={chat.id}>
                    <Link
                      href={`/chat/${chat.id}`}
                      className={cn(
                        "block px-4 py-2 rounded-lg hover:bg-muted transition-colors",
                        params.id === chat.id && "bg-muted"
                      )}
                      onClick={handleUserSelect}
                    >
                      <span className="font-medium">
                        {otherUser.name || otherUser.email}
                      </span>
                    </Link>
                  </li>
                );
              })}
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
            {params.id && <CallControls userId={params.id as string} />}

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

export default ProtectedLayout;
