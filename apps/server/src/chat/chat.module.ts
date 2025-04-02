import { Module } from '@nestjs/common';
import { ChatsService } from './chat.service';
import { PrismaModule } from '@server/prisma/prisma.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [PrismaModule],
  providers: [ChatsService, ChatGateway],
  exports: [ChatsService],
})
export class ChatModule {}
