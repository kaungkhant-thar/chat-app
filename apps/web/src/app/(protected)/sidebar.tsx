import { useQuery } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { useTRPC } from "@web/lib/trpc";
import Link from "next/link";
import React from "react";

const Sidebar = () => {
  const trpc = useTRPC();
  const { data: users = [] } = useQuery(trpc.findOtherUsers.queryOptions());

  return (
    <aside className="border-r min-h-screen">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold">Chat App</h1>
      </div>
      <ul className="space-y-3 p-4">
        {users.map((user) => (
          <li key={user.id} className="border-b  pb-2">
            <Link href={`/chat/${user.id}`} className="w-full  block">
              {user.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
