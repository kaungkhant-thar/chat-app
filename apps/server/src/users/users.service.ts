import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOtherUsers(userId: string) {
    const users = await this.prismaService.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
    });

    return users;
  }

  async findUserById(userId: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
      },
    });
    return user;
  }
}
