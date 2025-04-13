import * as trpcExpress from '@trpc/server/adapters/express';
import type { Request, Response } from 'express';
import { AppContextService } from './appContext';

export interface User {
  id: string;
  email: string;
}

export interface Context {
  req: Request;
  res: Response;
  user?: User;
  appContext: AppContextService;
}

export const createContext = ({
  req,
  res,
  appContext,
}: trpcExpress.CreateExpressContextOptions & {
  appContext: AppContextService;
}): Context => ({
  req,
  res,
  appContext,
});

export type ContextType = Awaited<ReturnType<typeof createContext>>;
