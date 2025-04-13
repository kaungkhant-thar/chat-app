"use client";

import { useAuthStore } from "@web/store/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

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

  return <div className="min-h-screen">{children}</div>;
};

export default ProtectedLayout;
