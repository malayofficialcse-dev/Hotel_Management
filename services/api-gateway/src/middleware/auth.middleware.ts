import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const response = await axios.post(
        `${env.services.auth}/internal/auth/validate`,
        { token },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        },
      );

      req.user = response.data.user;
      req.headers['x-user-id'] = req.user?.id;
      req.headers['x-user-email'] = req.user?.email;
      req.headers['x-user-role'] = req.user?.role;

      next();
    } catch (error: any) {
      this.logger.warn(`Auth validation failed: ${error?.response?.data?.message || error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
