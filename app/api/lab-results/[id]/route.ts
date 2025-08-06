import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth, currentUser } from '@clerk/nextjs/server';
import { LabResult } from '@/models/lab-result';
import { UpdateLabResultRequest } from '@/types/lab-result';
import { USER_ROLES } from '@/constants/user-roles';

// GET /api/lab-results/[id] - Get specific lab result
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const labResult = await LabResult.findById(id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const body = await request.json();
    const { patientId, patientName, testType, testName, notes, selectedTestTypes } = body;

    // Validate required fields
    if (!patientId || !patientName || !testType) {
      return NextResponse.json({ error: 'Missing required fields: patientId, patientName, testType' }, { status: 400 });
    }
    
    if (!notes || !notes.trim()) {
      return NextResponse.json({ error: 'Lab test description is required' }, { status: 400 });
    }

    const updateData = {
      patientId,
      patientName,
      testType,
      testName: testName || '',
      additionalTestTypes: selectedTestTypes || [],
      notes,
      updatedAt: new Date(),
    };

    const labResult = await LabResult.findByIdAndUpdate(
      id,
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
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if user has permission to update lab results
    if (userRole !== USER_ROLES.LABORATORIST && userRole !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
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
      id,
      { $set: updateData },
      { new: true }
    );

    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lab result updated successfully', labResult });
  } catch (error) {
    console.error('Error updating lab result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/lab-results/[id] - Delete lab result
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if user has permission to delete lab results
    if (userRole !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const labResult = await LabResult.findByIdAndDelete(id);

    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lab result deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 