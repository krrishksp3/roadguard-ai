import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { registerSchema, loginSchema } from '../validators/schemas';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AuthController {
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

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role: data.role,
          departmentId: data.departmentId,
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
        message: 'User registered successfully',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        include: { department: true },
      });

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
