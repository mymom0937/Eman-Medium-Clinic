import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth, currentUser } from '@clerk/nextjs/server';
import { LabResult } from '@/models/lab-result';
import { CreateLabResultRequest } from '@/types/lab-result';
import { USER_ROLES } from '@/constants/user-roles';

// GET /api/lab-results - Get all lab results
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const testType = searchParams.get('testType');

    await connectToDatabase();

    let query: any = {};

    if (patientId) {
      query.patientId = patientId;
    }
    if (status) {
      query.status = status;
    }
    if (testType) {
      query.testType = testType;
    }

    const labResults = await LabResult.find(query).sort({ createdAt: -1 });

    return NextResponse.json(labResults);
  } catch (error) {
    console.error('Error fetching lab results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/lab-results - Create new lab result
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check user role from Clerk's public metadata or database
    let userRole = user.publicMetadata?.role as string;
    
    // If role is not in metadata, check database
    if (!userRole) {
      await connectToDatabase();
      const User = (await import('@/models/user')).default;
      const dbUser = await User.findOne({ clerkId: userId });
      
      if (dbUser) {
        userRole = dbUser.role;
      } else {
        // Create user in database if they don't exist
        const newUser = new User({
          clerkId: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: USER_ROLES.SUPER_ADMIN, // Default to super admin for now
        });
        await newUser.save();
        userRole = USER_ROLES.SUPER_ADMIN;
      }
    }

    // Check if user has permission to create lab results
    if (userRole !== USER_ROLES.NURSE && userRole !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const body: CreateLabResultRequest = await request.json();
    const { patientId, patientName, testType, testName, notes } = body;

    if (!patientId || !patientName || !testType || !testName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const labResult = new LabResult({
      patientId,
      patientName,
      testType,
      testName,
      status: 'PENDING',
      requestedBy: userId,
      requestedAt: new Date(),
      notes,
    });

    const savedLabResult = await labResult.save();

    return NextResponse.json(savedLabResult, { status: 201 });
  } catch (error) {
    console.error('Error creating lab result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 