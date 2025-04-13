"use client";

import { useAuthStore } from "@web/store/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Sidebar from "./sidebar";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [hasHydrated, isAuthenticated]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <section className="flex-1 grid grid-cols-[300px_1fr]">
        <Sidebar />
        {children}
      </section>
    </div>
  );
};

export default ProtectedLayout;
