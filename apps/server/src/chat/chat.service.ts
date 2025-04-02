import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getChatByUsersIds(userIds: string[]) {
    const chat = await this.prismaService.chat.findFirst({
      where: {
        users: {
          every: {
            userId: {
              in: userIds,
            },
          },
        },
      },
    });
    return chat;
  }

  async createChat(userIds: string[]) {
    const chat = await this.prismaService.chat.create({
      data: {},
    });

    await this.prismaService.chatUser.createMany({
      data: userIds.map((userId) => ({
        chatId: chat.id,
        userId,
      })),
    });

    return chat;
  }
}
