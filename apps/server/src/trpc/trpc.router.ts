import { INestApplication, Injectable } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { z } from 'zod';
import { createExpressMiddleware } from '@trpc/server/adapters/express';

@Injectable()
export class TrpcRouter {
  constructor(private readonly trpcService: TrpcService) {}

  appRouter = this.trpcService.router({
    hello: this.trpcService.procedure
      .input(z.object({ name: z.string() }))
      .query(({ input }) => {
        return `Hello ${input.name}`;
      }),
  });

  async applyMiddleare(app: INestApplication) {
    app.use('/trpc', createExpressMiddleware({ router: this.appRouter }));
  }
}

export type AppRouter = TrpcRouter['appRouter'];
