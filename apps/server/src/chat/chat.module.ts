import { Module } from '@nestjs/common';
import { ChatsService } from './chat.service';
import { PrismaModule } from '@server/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatModule {}
