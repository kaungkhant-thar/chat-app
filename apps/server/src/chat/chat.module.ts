import { Module } from '@nestjs/common';
import { ChatsService } from './chat.service';
import { PrismaModule } from '@server/prisma/prisma.module';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '@server/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ChatsService, ChatGateway],
  exports: [ChatsService],
})
export class ChatModule {}
