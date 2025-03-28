"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";
import { useAuthStore } from "@web/store/auth";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  return (
    <div className="flex min-h-screen flex-col bg-accent items-center justify-center">
      <h1 className="text-3xl font-boldt text-center mb-4">
        Welcome to Chat-app
      </h1>

      {isAuthenticated ? (
        <Button asChild>
          <Link href="/profile">Profile</Link>
        </Button>
      ) : (
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      )}
    </div>
  );
}
