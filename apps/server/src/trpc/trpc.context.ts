// src/trpc/trpc.context.ts
import type { Request, Response } from 'express';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { PrismaService } from '@server/prisma/prisma.service';
import { AuthService } from '@server/auth/auth.service';

export interface User {
  id: string;
  email: string;
}

export interface Context {
  req: Request;
  res: Response;
  prisma: PrismaService;
  authService: AuthService;
  user?: User; // Make user optional in base context
}

export const createContext = ({
  req,
  res,
  prisma,
  authService,
}: CreateExpressContextOptions & {
  prisma: PrismaService;
  authService: AuthService;
}): Context => ({
  req,
  res,
  prisma,
  authService,
});

export type ContextType = Awaited<ReturnType<typeof createContext>>;
