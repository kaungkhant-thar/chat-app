import { NestFactory } from '@nestjs/core';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { AppModule } from './app.module';
import { AppContextService } from './trpc/appContext';
import { createContext } from './trpc/trpc.context';
import { appRouter } from './trpc/trpc.router';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });

  const appContext = app.get(AppContextService);

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: (opts) =>
        createContext({
          ...opts,
          appContext,
        }),
    }),
  );
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
