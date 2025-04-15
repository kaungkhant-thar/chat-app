import { AppRouter } from "@server/trpc/trpc.router";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;

export type ChatType = RouterOutput["getChat"];
