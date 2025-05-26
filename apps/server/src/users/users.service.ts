import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOtherUsers(userId: string) {
    const otherUsers = await this.prismaService.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
      include: {
        userPresence: {
          select: {
            status: true,
            updatedAt: true,
          },
        },
        chats: {
          include: {
            chat: {
              select: {
                id: true,
                users: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return otherUsers.map((user) => {
      const sharedChat = user.chats.find((chatUser) =>
        chatUser.chat.users.some((u) => u.userId === userId),
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.userPresence?.status,
        lastSeen: user.userPresence?.updatedAt,
        chatId: sharedChat?.chat.id ?? null,
      };
    });
  }

  async findUserById(userId: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
      include: {
        userPresence: {
          select: {
            status: true,
            updatedAt: true,
          },
        },
      },
    });
    return user;
  }

  async updateUserStatus(userId: string, status: string) {
    await this.prismaService.userPresence.upsert({
      where: {
        userId,
      },
      update: {
        status,
      },
      create: {
        userId,
        status,
      },
    });
  }
}
