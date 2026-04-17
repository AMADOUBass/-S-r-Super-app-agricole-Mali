import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const authentifier: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const autoriser: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map