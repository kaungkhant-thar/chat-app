"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@web/components/ui/card";
import { useTRPC } from "@web/lib/trpc";
import React from "react";

const Page = () => {
  const trpc = useTRPC();

  const { data } = useQuery(trpc.profile.queryOptions());
  console.log({ data });

  return (
    <Card className="max-w-lg mx-auto my-16 p-8">
      <CardTitle>Profile</CardTitle>
      <CardContent>
        <p>Email: {data?.email}</p>
      </CardContent>
    </Card>
  );
};

export default Page;
