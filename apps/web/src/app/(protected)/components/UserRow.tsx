import { useMutation } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { useTRPC } from "@web/lib/trpc";
import { RouterOutput } from "@web/lib/trpc.types";
import { useRouter } from "next/navigation";
import React from "react";

type Props = {
  user: NonNullable<RouterOutput["findOtherUsers"]>[number];
};
const UserRow = ({ user }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const createChatMutation = useMutation(trpc.createChat.mutationOptions());
  return (
    <div>
      <div
        key={user.id}
        className="flex items-center justify-between p-4 border-b"
      >
        <div className="flex items-center">
          <div>
            <h2 className="text-lg font-medium">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {user.chatId && (
          <Button
            onClick={() => {
              router.push(`/chat/${user.chatId}`);
            }}
          >
            Continue
          </Button>
        )}

        {!user.chatId && (
          <Button
            loading={createChatMutation.isPending}
            onClick={async () => {
              const { id } = await createChatMutation.mutateAsync({
                userIds: [user.id || ""],
              });
              router.push(`/chat/${id}`);
            }}
          >
            {createChatMutation.isPending ? "Starting..." : "Start"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserRow;
