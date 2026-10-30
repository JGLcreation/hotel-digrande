import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'grand-luxe-hotel-reservation-key-2026';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'staff' | 'guest';
  permissions: string[];
  phone?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Generate base64url string
function base64url(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Hash password with salt
export function hashPassword(password: string): string {
  const salt = 'grandluxe_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Standard JWT format (HMAC-SHA256)
export function signToken(user: AuthUser): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    phone: user.phone || '',
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  }));

  const signature = base64url(
    crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest()
  );

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = base64url(
      crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest()
    );

    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: decoded.id,
      username: decoded.username || '',
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
      phone: decoded.phone
    };
  } catch (err) {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (user) {
    req.user = user;
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in or register.' });
  }
  next();
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super Administrator privilege required' });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

export function requireStaff(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Staff access required' });
  }
  next();
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Superadmin inherently has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({ error: `Permission denied: '${permission}' privilege required` });
  };
}
