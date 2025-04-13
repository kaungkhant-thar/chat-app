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
      <header className="h-16 shrink-0 border-b flex items-center px-4 md:px-6 justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <h1 className="text-xl font-semibold">Chat App</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          title="Logout"
          className="hover:bg-muted"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

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
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <h1 className="text-lg font-medium mb-4">
                Select a user to chat with
              </h1>
              <div className="space-y-2">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/chat/${user.id}`}
                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted transition-colors border"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {user.name || "Unnamed User"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
}
