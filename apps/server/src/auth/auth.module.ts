import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from '@server/prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
