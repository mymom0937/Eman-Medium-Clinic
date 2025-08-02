import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth } from '@clerk/nextjs/server';
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

    // Check if user is Nurse or Super Admin
    await connectToDatabase();
    const User = (await import('@/models/user')).default;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user || (user.role !== USER_ROLES.NURSE && user.role !== USER_ROLES.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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