"use client";

import React from "react";
import CallControls from "@web/app/(protected)/chat/[id]/call-controls";
import { useTRPC } from "@web/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@web/components/ui/skeleton";
import { useParams, useSearchParams } from "next/navigation";

type ChatLayoutProps = {
  children: React.ReactNode;
};

const ChatLayout = ({ children }: ChatLayoutProps) => {
  const params = useParams();
  const trpc = useTRPC();
  const { data: users = [], isLoading } = useQuery(
    trpc.findOtherUsers.queryOptions()
  );

  const currentUser = users.find((user) => user.id === params.id);

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 shrink-0 border-b flex items-center px-4 justify-between bg-background">
        <div className="flex items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <h2 className="text-lg font-medium">
              {currentUser?.name || currentUser?.email || "Chat"}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          <CallControls userId={params.id as string} />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

export default ChatLayout;
