import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { Role, ApprovalStatus } from '@prisma/client';
import { getAdminCredentials } from '../lib/adminConfig';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const adminCreds = getAdminCredentials();
const ADMIN_EMAIL = adminCreds?.email;
const ADMIN_PASSWORD = adminCreds?.password;

interface AuthTokenPayload {
  userId?: string;
  role?: Role;
  isAdmin?: boolean;
}

function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, email, password, role = Role.USER, mobile, city, age, businessCategory, contactPerson, phone, address, website, gstNumber, socialLinks, interests, brandName } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        mobile,
        city,
        age,
      },
    });

    if (role === Role.AFFILIATE) {
      await prisma.affiliate.create({
        data: {
          userId: user.id,
          status: ApprovalStatus.PENDING,
          socialLinks: socialLinks || undefined,
          interests: Array.isArray(interests) ? interests : [],
        },
      });
    }

    if (role === Role.BRAND) {
      await prisma.brand.create({
        data: {
          userId: user.id,
          name: brandName || 'Health Brand',
          businessCategory: businessCategory || 'Unspecified',
          contactPerson: contactPerson || fullName,
          phone: phone || mobile || '',
          address: address || '',
          website: website || socialLinks || '',
          gstNumber,
          status: ApprovalStatus.PENDING,
        },
      });
    }

    const token = generateToken({ userId: user.id, role: user.role });

    // Include status for Affiliate/Brand
    let status = undefined;
    if (role === Role.AFFILIATE) {
      const affiliate = await prisma.affiliate.findUnique({ where: { userId: user.id } });
      status = affiliate?.status;
    } else if (role === Role.BRAND) {
      const brand = await prisma.brand.findUnique({ where: { userId: user.id } });
      status = brand?.status;
    }

    res.status(201).json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        blocked: user.blocked,
        createdAt: user.createdAt,
        role: user.role,
        status,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.blocked) {
      res.status(403).json({ error: 'Your account has been blocked' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ userId: user.id, role: user.role });

    // Include status for Affiliate/Brand
    let status = undefined;
    if (user.role === Role.AFFILIATE) {
      const affiliate = await prisma.affiliate.findUnique({ where: { userId: user.id } });
      status = affiliate?.status;
    } else if (user.role === Role.BRAND) {
      const brand = await prisma.brand.findUnique({ where: { userId: user.id } });
      status = brand?.status;
    }

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        blocked: user.blocked,
        createdAt: user.createdAt,
        role: user.role,
        status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!adminCreds) {
      res.status(500).json({ error: 'Admin credentials are not configured' });
      return;
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = generateToken({ isAdmin: true, role: Role.ADMIN });
      res.json({ 
        token, 
        user: {
          id: 'admin-id',
          fullName: 'Platform Administrator',
          email: ADMIN_EMAIL,
          role: Role.ADMIN,
          blocked: false,
          createdAt: new Date().toISOString()
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const isAdmin = (req as any).isAdmin;
    const userId = (req as any).userId;

    if (isAdmin && !userId) {
      if (!adminCreds) {
        res.status(500).json({ error: 'Admin credentials are not configured' });
        return;
      }
      res.json({
        id: 'admin-id',
        fullName: 'Platform Administrator',
        email: ADMIN_EMAIL,
        role: Role.ADMIN,
        blocked: false,
        createdAt: new Date().toISOString()
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Include status for Affiliate/Brand
    let status = undefined;
    if (user.role === Role.AFFILIATE) {
      const affiliate = await prisma.affiliate.findUnique({ where: { userId: user.id } });
      status = affiliate?.status;
    } else if (user.role === Role.BRAND) {
      const brand = await prisma.brand.findUnique({ where: { userId: user.id } });
      status = brand?.status;
    }

    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      blocked: user.blocked,
      createdAt: user.createdAt,
      role: user.role,
      status,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
