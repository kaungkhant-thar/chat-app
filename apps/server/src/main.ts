import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/trpc.router';
import { createContext } from './trpc/trpc.context';
import { PrismaService } from './prisma/prisma.service';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { ChatsService } from './chat/chat.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });

  const prisma = app.get(PrismaService);
  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);
  const chatsService = app.get(ChatsService);

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: (opts) =>
        createContext({
          ...opts,
          prisma,
          authService,
          usersService,
          chatsService,
        }),
    }),
  );
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
