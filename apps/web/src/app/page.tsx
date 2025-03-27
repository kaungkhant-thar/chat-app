"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-accent items-center justify-center">
      <h1 className="text-3xl font-boldt text-center mb-4">
        Welcome to Chat-app
      </h1>

      <Button asChild>
        <Link href="/signup">Sign up</Link>
      </Button>
    </div>
  );
}
