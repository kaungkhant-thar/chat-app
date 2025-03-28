import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@server/prisma/prisma.service';
import { comparePassword, hashPassword } from '@server/utils/password';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      throw new Error('User already exists');
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

  async profile(userId: string) {
    return this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  private generateToken(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '7d',
    });
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch (error) {
      console.log({ error });
    }
  }
}
