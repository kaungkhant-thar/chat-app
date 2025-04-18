import { type AppRouter } from "@server/trpc/trpc.router";
import { type inferRouterOutputs } from "@trpc/server";

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type ChatType = RouterOutput["getChat"];
