"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@web/lib/trpc";

type IncomingCallDialogProps = {
  isOpen: boolean;
  fromUserId: string;
  onAccept: () => void;
  onReject: () => void;
};

export const IncomingCallDialog = ({
  isOpen,
  fromUserId,
  onAccept,
  onReject,
}: IncomingCallDialogProps) => {
  const trpc = useTRPC();
  const { data: user } = useQuery(
    trpc.findUserById.queryOptions({ id: fromUserId })
  );

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Incoming Call</DialogTitle>
          <DialogDescription>
            {user?.name} is calling you. Would you like to answer?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="destructive" onClick={onReject}>
            Reject
          </Button>
          <Button onClick={onAccept}>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
