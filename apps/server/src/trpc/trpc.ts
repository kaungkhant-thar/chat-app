import { initTRPC } from '@trpc/server';
import { ContextType } from './trpc.context';

const t = initTRPC.context<ContextType>().create();

export const router = t.router;
export const procedure = t.procedure;
export const mergeRouters = t.mergeRouters;
