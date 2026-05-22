import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middlewares/error.middleware';
import type { RegisterDto, LoginDto } from './auth.schema';

class AuthService {
  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) {
      throw new AppError(
        exists.email === dto.email ? 'Email already in use' : 'Username already taken',
        409
      );
    }

    const password = await hashPassword(dto.password);
    const user = await prisma.user.create({
      data: { email: dto.email, username: dto.username, password },
      select: { id: true, email: true, username: true, isAdmin: true },
    });

    return this.issueTokens(user, ipAddress, userAgent);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, username: true, password: true, isAdmin: true, isBanned: true },
    });

    if (!user || !(await verifyPassword(dto.password, user.password))) {
      throw new AppError('Invalid email or password', 401);
    }
    if (user.isBanned) {
      throw new AppError('Your account has been suspended', 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(
      { id: user.id, email: user.email, username: user.username, isAdmin: user.isAdmin },
      ipAddress,
      userAgent
    );
  }

  async refresh(token: string) {
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken: token },
      include: { user: { select: { id: true, email: true, isAdmin: true, isBanned: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError('Session expired, please login again', 401);
    }
    if (session.user.isBanned) {
      throw new AppError('Account suspended', 403);
    }

    const accessToken = signAccessToken({
      userId: session.user.id,
      email: session.user.email,
      isAdmin: session.user.isAdmin,
    });

    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  private async issueTokens(
    user: { id: string; email: string; isAdmin: boolean },
    ipAddress?: string,
    userAgent?: string
  ) {
    const accessToken = signAccessToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
    const refreshToken = signRefreshToken({ userId: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await prisma.session.create({
      data: { userId: user.id, refreshToken, expiresAt, ipAddress, userAgent },
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
