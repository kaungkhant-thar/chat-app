"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { useTRPC } from "@web/lib/trpc";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";

const Page = () => {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const trpc = useTRPC();

  const { data: chat, refetch } = useQuery(
    trpc.getChat.queryOptions({
      userIds: [userId],
    })
  );

  console.log({ chat });

  const createChatMutation = useMutation(trpc.createChat.mutationOptions());

  return (
    <div>
      {chat ? (
        <div>
          <h1> message your friend</h1>
        </div>
      ) : (
        <div className="grid place-items-center my-32">
          <Button
            loading={createChatMutation.isPending}
            onClick={async () => {
              await createChatMutation.mutateAsync({
                userIds: [userId],
              });
              refetch();
            }}
          >
            Start Chat with your friend
          </Button>
        </div>
      )}
    </div>
  );
};

export default Page;
