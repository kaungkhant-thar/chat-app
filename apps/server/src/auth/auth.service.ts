import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@server/prisma/prisma.service';
import { comparePassword, hashPassword } from '@server/utils/password';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(email: string, password: string) {
    try {
      const hashedPassword = await hashPassword(password);

      const user = await this.prismaService.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      return this.generateToken(user);
    } catch (error) {
      console.log(error, 'from signup');
    }
  }

  async login(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private generateToken(user: { id: string; email: string }) {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}
