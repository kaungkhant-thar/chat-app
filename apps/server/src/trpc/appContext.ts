import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { AuthService } from '@server/auth/auth.service';
import { UsersService } from '@server/users/users.service';
import { ChatsService } from '@server/chat/chat.service';

export type User = {
  id: string;
  email: string;
};

@Injectable()
export class AppContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly chatsService: ChatsService,
  ) {}

  getPrisma() {
    return this.prisma;
  }

  getAuthService() {
    return this.authService;
  }

  getUsersService() {
    return this.usersService;
  }

  getChatsService() {
    return this.chatsService;
  }
}
