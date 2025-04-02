import { Body, Get, Controller, HttpCode, HttpStatus, Post, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { GetUser } from './decorator';
import { JwtGuard } from './guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(@Body() dto: AuthDto, @Res({ passthrough: true }) res) {
    return this.authService.signin(dto, res); 
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(JwtGuard)
  logout(@GetUser('id') userId: string, @Res({ passthrough: true }) res) {
    return this.authService.logout(userId, res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('renew')
  @UseGuards(JwtGuard)
  async renewAccessTokens(
    @Body() body: { userId: string },
    @Res({ passthrough: true }) res,
  ) {
    const accessTokens = await this.authService.renewAccessTokens(body.userId, res);

    return accessTokens;
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@GetUser() user) {
    return user;
  }
}