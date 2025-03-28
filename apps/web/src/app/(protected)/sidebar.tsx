import { useQuery } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { useTRPC } from "@web/lib/trpc";
import Link from "next/link";
import React from "react";

const Sidebar = () => {
  const trpc = useTRPC();
  const { data: users = [] } = useQuery(trpc.findOtherUsers.queryOptions());

  return (
    <aside>
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
