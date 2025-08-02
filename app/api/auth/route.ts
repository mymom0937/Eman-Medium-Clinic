import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/config/db/connection';
import { User, UserRole } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'eman_clinic');

    const body = await request.json();
    const { action, email, password, firstName, lastName, role } = body;

    if (action === 'login') {
      // Login logic
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required' },
          { status: 400 }
        );
      }

      // In a real app, you would hash the password and verify it
      const user = await db.collection('users').findOne({ email });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // For demo purposes, we'll accept any password
      // In production, you should verify the password hash
      if (password !== 'password') {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          token: 'demo-token-' + Date.now(), // In real app, generate JWT
        },
      });
    }

    if (action === 'register') {
      // Registration logic
      if (!email || !password || !firstName || !lastName || !role) {
        return NextResponse.json(
          { success: false, error: 'All fields are required' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'User already exists' },
          { status: 409 }
        );
      }

      const newUser: Omit<User, '_id'> = {
        email,
        firstName,
        lastName,
        role: role as UserRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('users').insertOne(newUser);

      return NextResponse.json({
        success: true,
        data: {
          user: { ...newUser, _id: result.insertedId },
          token: 'demo-token-' + Date.now(),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'eman_clinic');

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 401 }
      );
    }

    // In a real app, you would verify the JWT token
    // For demo purposes, we'll return a mock user
    const mockUser = {
      _id: '1',
      email: 'admin@emanclinic.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN' as UserRole,
      isActive: true,
    };

    return NextResponse.json({
      success: true,
      data: { user: mockUser },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Token verification failed' },
      { status: 500 }
    );
  }
} 