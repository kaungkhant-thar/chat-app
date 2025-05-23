"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { useTRPC } from "@web/lib/trpc";
import { useAuthStore } from "@web/store/auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: users = [] } = useQuery(trpc.findOtherUsers.queryOptions());
  const createChatMutation = useMutation(trpc.createChat.mutationOptions());

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
            <div>
              <h1 className="text-lg font-medium mb-4">
                Select a user to chat with
              </h1>

              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border-b"
                >
                  <div className="flex items-center">
                    <div>
                      <h2 className="text-lg font-medium">{user.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    loading={createChatMutation.isPending}
                    onClick={async () => {
                      const { id } = await createChatMutation.mutateAsync({
                        userIds: [user.id || ""],
                      });
                      router.push(`/chat/${id}`);
                    }}
                  >
                    Start Chat
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
