import { Request, Response } from 'express';

import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { PrismaService } from '@server/prisma/prisma.service';
import { AuthService } from '@server/auth/auth.service';

export interface Context {
  req: Request;
  res: Response;
  prisma: PrismaService;
  authService: AuthService;
}

export const createContext = ({
  req,
  res,
  prisma,
  authService,
}: CreateExpressContextOptions & {
  prisma: PrismaService;
  authService: AuthService;
}): Context => {
  return {
    req,
    res,
    prisma,
    authService,
  };
};

export type ContextType = Awaited<ReturnType<typeof createContext>>;
