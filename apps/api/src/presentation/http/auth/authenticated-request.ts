import type { Request } from 'express';
import type { UserRole } from '../../../application/auth/session.port';

export interface AuthenticatedRequest extends Request {
  currentUser?: {
    id: string;
    role: UserRole;
  };
}
