"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../utils/trpc";
import { Client } from "./components/client";

export default function Home() {
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.hello.queryOptions({ name: "Kaung Khant Thar" })
  );

  return (
    <div>
      {data}

      <Client />
    </div>
  );
}
