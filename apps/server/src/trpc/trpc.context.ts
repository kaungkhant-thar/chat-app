import type { Request, Response } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { PrismaService } from '@server/prisma/prisma.service';
import { AuthService } from '@server/auth/auth.service';
import { UsersService } from '@server/users/users.service';

export interface User {
  id: string;
  email: string;
}

export interface Context {
  req: Request;
  res: Response;
  prisma: PrismaService;
  authService: AuthService;
  user?: User;
  usersService: UsersService;
}

export const createContext = ({
  req,
  res,
  prisma,
  authService,
  usersService,
}: trpcExpress.CreateExpressContextOptions & {
  prisma: PrismaService;
  authService: AuthService;
  usersService: UsersService;
}): Context => ({
  req,
  res,
  prisma,
  authService,
  usersService,
});

export type ContextType = Awaited<ReturnType<typeof createContext>>;
