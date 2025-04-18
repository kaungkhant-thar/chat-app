"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@web/lib/trpc";
import { Button } from "@web/components/ui/button";
import { ScrollArea } from "@web/components/ui/scroll-area";
import { User } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@web/store/auth";
import { LogOut } from "lucide-react";

export default function Home() {
  const trpc = useTRPC();
  const { data: users = [] } = useQuery(trpc.findOtherUsers.queryOptions());
  const { logout } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-medium text-muted-foreground">
                No other users found
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Invite your friends to join the chat app!
              </p>
            </div>
          ) : (
            <h1 className="text-lg font-medium mb-4">
              Select a user to chat with
            </h1>
          )}
        </div>
      </main>
    </div>
  );
}
