import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { ReactToMessageInput, SendMessageInput } from '@shared/schemas';

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
          take: 20,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            sender: {
              select: {
                name: true,
                id: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return chat;
  }

  async getChats(userId: string) {
    const chats = await this.prismaService.chat.findMany({
      where: {
        users: {
          some: { userId },
        },
      },
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
        users: {
          select: {
            user: true,
          },
        },
      },
    });
    return chats;
  }

  async getChatById(chatId: string) {
    const chat = await this.prismaService.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        messages: {
          take: 20,
          include: {
            sender: true,
            reactions: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        users: {
          select: {
            user: true,
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
      include: {
        sender: true,
      },
    });

    const chatUsers = await this.prismaService.chatUser.findMany({
      where: { chatId },
      select: { userId: true },
    });

    chatUsers.forEach(({ userId }) => {
      const socketId = this.chatGateway.getSocketId(userId);
      if (socketId) {
        this.chatGateway.server.to(socketId).emit('message', message);
      }
    });
  }

  async reactToMessage(
    { messageId, emoji }: ReactToMessageInput,
    userId: string,
  ) {
    const existingReaction = await this.prismaService.reaction.findFirst({
      where: {
        messageId,
        userId,
        emoji,
      },
    });

    if (existingReaction) {
      await this.prismaService.reaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
      return;
    }

    await this.prismaService.reaction.create({
      data: {
        emoji,
        messageId,
        userId,
      },
    });
  }
}
