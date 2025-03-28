"use client";

import { useAuthStore } from "@web/store/auth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const OnboardingLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated");
      router.push("/");
    }
  }, [isAuthenticated]);
  return children;
};

export default OnboardingLayout;
