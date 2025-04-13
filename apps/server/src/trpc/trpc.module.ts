import { Module } from '@nestjs/common';
import { AppContextService } from './appContext';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ChatModule],
  providers: [AppContextService],
  exports: [AppContextService],
})
export class TrpcModule {}
