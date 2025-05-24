"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { useTRPC } from "@web/lib/trpc";
import { useAuthStore } from "@web/store/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import UserRow from "./components/UserRow";

export default function Home() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: users = [], isLoading } = useQuery(
    trpc.findOtherUsers.queryOptions()
  );

  console.log({ users });
  if (isLoading) {
    return (
      <div className="flex min-h-dvh justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return (
    <div className="flex min-h-dvh flex-col bg-background">
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
            <div>
              <h1 className="text-lg font-medium mb-4">
                Select a user to chat with
              </h1>

              {users.map((user) => (
                <UserRow user={user} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
