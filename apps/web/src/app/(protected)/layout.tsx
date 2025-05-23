"use client";

import { useAuthStore } from "@web/store/auth";
import { Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTRPC } from "@web/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@web/lib/utils";
import { useUserStatus } from "@web/hooks/use-user-status";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatHeader } from "./components/ChatHeader";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const trpc = useTRPC();

  useUserStatus();

  const { data: profile } = useQuery(trpc.profile.queryOptions());
  const { data: chats = [] } = useQuery(trpc.getChats.queryOptions());
  console.log({ chats });
  const { data: chat, isLoading } = useQuery(
    trpc.getChatById.queryOptions({ chatId: params.id as string })
  );

  const otherUser = chat?.users.find((u) => u.user.id !== profile?.id)?.user;

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
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <ChatSidebar
        chats={chats}
        currentUserId={profile?.id}
        currentChatId={params.id as string}
        userName={profile?.name}
        onChatSelect={handleUserSelect}
        className={cn(
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      />

      <div className="flex flex-col h-full overflow-hidden">
        <ChatHeader
          isLoading={isLoading}
          otherUser={otherUser}
          onLogout={handleLogout}
          onToggleSidebar={toggleSidebar}
        />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
