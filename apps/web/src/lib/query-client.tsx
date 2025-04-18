"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { TRPCProvider, useTRPC } from "./trpc";
import type { AppRouter } from "@server/trpc/trpc.router";
import { useAuthStore } from "@web/store/auth";
import { SocketProvider } from "@web/context/socket.context";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { WebRTCProvider } from "@web/context/webrtc.context";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}
let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

function useTrpcClient() {
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
          headers() {
            const token = useAuthStore.getState().token;
            return {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            };
          },
        }),
      ],
    })
  );
  return trpcClient;
}
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const trpcClient = useTrpcClient();
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <SocketProvider>
          <WebRTCProvider>{children}</WebRTCProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </SocketProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
