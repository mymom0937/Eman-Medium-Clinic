import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth } from '@clerk/nextjs/server';
import { LabResult } from '@/models/lab-result';
import { UpdateLabResultRequest } from '@/types/lab-result';
import { USER_ROLES } from '@/constants/user-roles';

// GET /api/lab-results/[id] - Get specific lab result
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const labResult = await LabResult.findById(params.id);

    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    return NextResponse.json(labResult);
  } catch (error) {
    console.error('Error fetching lab result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/lab-results/[id] - Update lab result (full update)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { patientId, patientName, testType, testName, notes } = body;

    // Validate required fields
    if (!patientId || !patientName || !testType || !testName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData = {
      patientId,
      patientName,
      testType,
      testName,
      notes,
      updatedAt: new Date(),
    };

    const labResult = await LabResult.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lab result updated successfully' });
  } catch (error) {
    console.error('Error updating lab result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/lab-results/[id] - Update lab result (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Laboratorist or Super Admin
    await connectToDatabase();
    const User = (await import('@/models/user')).default;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user || (user.role !== USER_ROLES.LABORATORIST && user.role !== USER_ROLES.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: UpdateLabResultRequest = await request.json();
    const { status, results, notes } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedBy = userId;
        updateData.completedAt = new Date();
      } else if (status === 'IN_PROGRESS') {
        updateData.completedBy = userId;
      }
    }

    if (results) {
      updateData.results = results;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const labResult = await LabResult.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lab result updated successfully' });
  } catch (error) {
    console.error('Error updating lab result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/lab-results/[id] - Delete lab result
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    await connectToDatabase();
    const User = (await import('@/models/user')).default;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const labResult = await LabResult.findByIdAndDelete(params.id);

    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lab result deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 