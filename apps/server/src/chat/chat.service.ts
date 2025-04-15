import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageInput } from '@shared/schemas';

@Injectable()
export class ChatsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

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
      include: {
        messages: {
          include: {
            sender: {
              select: {
                name: true,
                id: true,
              },
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

  async sendMessage({ chatId, content }: SendMessageInput, userId: string) {
    const message = await this.prismaService.message.create({
      data: {
        content,
        senderId: userId,
        chatId,
      },
    });

    const chatUsers = await this.prismaService.chatUser.findMany({
      where: { chatId },
      select: { userId: true },
    });
    console.log({ chatUsers });

    chatUsers.forEach(({ userId }) => {
      const socketId = this.chatGateway.getSocketId(userId);
      if (socketId) {
        this.chatGateway.server.to(socketId).emit('message', message);
      }
    });
  }
}
