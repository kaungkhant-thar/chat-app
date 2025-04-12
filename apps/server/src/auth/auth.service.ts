import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@server/prisma/prisma.service';
import { comparePassword, hashPassword } from '@server/utils/password';
import { SignupInput } from '@shared/schemas';

type Payload = {
  sub: string;
  email: string;
};
@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup({ name, email, password }: SignupInput) {
    try {
      const hashedPassword = await hashPassword(password);

      const user = await this.prismaService.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      return this.generateToken(user);
    } catch (error) {
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

  async verifyToken(
    token: string,
  ): Promise<{ userId: string; email: string } | null> {
    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<Payload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      // Validate payload structure
      if (!payload?.sub || !payload?.email) {
        return null;
      }

      return {
        userId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Token verification error:', error.message);
      }
      // Token is invalid or expired
      // Handle the error as needed (e.g., log it, throw an exception, etc.)
      // For now, just return null
      return null;
    }
  }
}
