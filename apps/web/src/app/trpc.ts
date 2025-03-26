import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@server/trpc/trpc.router";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
    }),
  ],
});
