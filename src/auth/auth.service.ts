import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ForbiddenException, Injectable, UnauthorizedException} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    const password = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          password,
        },
      });

      const tokens = await this.generateTokens(user.id, user.username);
      await this.updateRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ForbiddenException('Credentials taken');
      }
      throw error;
    }
  }

  async signin(dto: AuthDto, res) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user) throw new ForbiddenException('Credentials incorrect');

    const pwMatches = await argon.verify(user.password, dto.password);
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');
    
    const tokens = await this.generateTokens(user.id, user.username);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return tokens;
  }

  async logout(userId: string, res) {
    res.cookie('access_token', '', { expires: new Date(Date.now()) });
    await this.prisma.user.updateMany({
      where: { id: userId, refreshToken: { not: null } },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async renewAccessTokens(userId: string, res) {
    if (!userId) {
      throw new ForbiddenException('User ID not provided');
    }

    const user = await this.getUserById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('User/Refresh token not found');
    }

    const refresh = user.refreshToken;

    let decodedToken: { sub: string; exp: number };
    try {
      decodedToken = this.jwt.verify(refresh, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch (err) {
      throw new ForbiddenException('Invalid refresh token');
    }
  
  
    // Check if the refresh token is expired
    const currentTime = Math.floor(Date.now() / 1000); 
    if (decodedToken.exp < currentTime) {
      throw new UnauthorizedException('Refresh token has expired');
    }
  

    const payload = { sub: userId, username: user.username };

    const accessToken = await this.generateAccess(payload);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  
    return accessToken;
  }


  private async generateAccess(payload: { sub: string; username: string }) {
    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });
    console.log('Access Token:', access_token);
    return access_token;
  }

  private async generateRefresh(payload: { sub: string; username: string }) {
    const refresh_token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });
    return refresh_token;
  }

  private async generateTokens(userId: string, username: string) {
    const payload = { sub: userId, username };
    const access_token = await this.generateAccess(payload);
    const refresh_token = await this.generateRefresh(payload);
    return { access_token, refresh_token };
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: refreshToken },
    });
  }
}