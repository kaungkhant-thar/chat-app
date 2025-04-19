import { Module } from '@nestjs/common';
import { ChatsService } from './chat.service';
import { PrismaModule } from '@server/prisma/prisma.module';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '@server/auth/auth.module';
import { UsersModule } from '@server/users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  providers: [ChatsService, ChatGateway],
  exports: [ChatsService],
})
export class ChatModule {}
