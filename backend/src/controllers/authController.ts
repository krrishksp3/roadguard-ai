import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { registerSchema, loginSchema } from '../validators/schemas';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AuthController {
  // Idempotently ensure default demo accounts exist
  public static async ensureDefaultAccounts(): Promise<void> {
    try {
      const citizen = await prisma.user.findUnique({ where: { email: 'citizen@roadguard.demo' } });
      if (!citizen) {
        const hash = await bcrypt.hash('citizen123', 10);
        await prisma.user.create({
          data: {
            id: 'user-citizen-01',
            email: 'citizen@roadguard.demo',
            passwordHash: hash,
            name: 'Arun Kumar (Citizen)',
            role: 'CITIZEN',
            phone: '+91 98765 43210',
          },
        });
      }

      const authority = await prisma.user.findUnique({ where: { email: 'authority@roadguard.demo' } });
      if (!authority) {
        const pwdDept = await prisma.department.findFirst({ where: { code: 'PWD_MRT' } });
        const hash = await bcrypt.hash('authority123', 10);
        await prisma.user.create({
          data: {
            id: 'user-authority-01',
            email: 'authority@roadguard.demo',
            passwordHash: hash,
            name: 'Er. Rajesh Bansal (Executive Engineer, PWD)',
            role: 'AUTHORITY',
            departmentId: pwdDept?.id,
            phone: '+91 94120 12345',
          },
        });
      }

      const admin = await prisma.user.findUnique({ where: { email: 'admin@roadguard.demo' } });
      if (!admin) {
        const hash = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
          data: {
            id: 'user-admin-01',
            email: 'admin@roadguard.demo',
            passwordHash: hash,
            name: 'System Administrator (RoadGuard Admin)',
            role: 'ADMIN',
            phone: '+91 94100 00000',
          },
        });
      }
    } catch (err) {
      console.warn('[AuthController] Notice during ensureDefaultAccounts:', err);
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        res.status(409).json({ success: false, message: 'A user with this email already exists' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(data.password, salt);

      // Public registration is restricted to CITIZEN role
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role: 'CITIZEN',
          phone: data.phone,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
          createdAt: true,
        },
      });

      const secret = process.env.JWT_SECRET || 'roadguard-secret';
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, departmentId: user.departmentId },
        secret,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Citizen account registered successfully',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);

      let user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        include: { department: true },
      });

      // If demo user is missing on a fresh database, provision idempotently
      if (!user && (data.email === 'citizen@roadguard.demo' || data.email === 'authority@roadguard.demo' || data.email === 'admin@roadguard.demo')) {
        await AuthController.ensureDefaultAccounts();
        user = await prisma.user.findUnique({
          where: { email: data.email.toLowerCase() },
          include: { department: true },
        });
      }

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const isMatch = await bcrypt.compare(data.password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const secret = process.env.JWT_SECRET || 'roadguard-secret';
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, departmentId: user.departmentId },
        secret,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
            departmentName: user.department?.name,
            jurisdiction: user.department?.jurisdiction,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
          phone: true,
          createdAt: true,
          department: true,
        },
      });

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}
