import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { Trpc } from './trpc/trpc.module';

@Module({
  imports: [ConfigModule.forRoot(), Trpc],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
