import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth } from '@clerk/nextjs/server';
import { DrugOrder } from '@/models/drug-order';
import { UpdateDrugOrderRequest } from '@/types/drug-order';
import { USER_ROLES } from '@/constants/user-roles';

// GET /api/drug-orders/[id] - Get specific drug order
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
    const drugOrder = await DrugOrder.findById(params.id);

    if (!drugOrder) {
      return NextResponse.json({ error: 'Drug order not found' }, { status: 404 });
    }

    return NextResponse.json(drugOrder);
  } catch (error) {
    console.error('Error fetching drug order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/drug-orders/[id] - Update drug order (full update)
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
    const { patientId, patientName, labResultId, items, notes } = body;

    // Validate required fields
    if (!patientId || !patientName || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

    const updateData = {
      patientId,
      patientName,
      labResultId,
      items: items.map((item: any) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      })),
      totalAmount,
      notes,
      updatedAt: new Date(),
    };

    const drugOrder = await DrugOrder.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    if (!drugOrder) {
      return NextResponse.json({ error: 'Drug order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Drug order updated successfully' });
  } catch (error) {
    console.error('Error updating drug order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/drug-orders/[id] - Update drug order (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Pharmacist or Super Admin
    await connectToDatabase();
    const User = (await import('@/models/user')).default;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user || (user.role !== USER_ROLES.PHARMACIST && user.role !== USER_ROLES.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: UpdateDrugOrderRequest = await request.json();
    const { status, items, notes } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'APPROVED') {
        updateData.approvedBy = userId;
        updateData.approvedAt = new Date();
      } else if (status === 'DISPENSED') {
        updateData.dispensedBy = userId;
        updateData.dispensedAt = new Date();
      }
    }

    if (items) {
      // Recalculate total amount
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      updateData.items = items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      }));
      updateData.totalAmount = totalAmount;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const drugOrder = await DrugOrder.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    if (!drugOrder) {
      return NextResponse.json({ error: 'Drug order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Drug order updated successfully' });
  } catch (error) {
    console.error('Error updating drug order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/drug-orders/[id] - Delete drug order
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

    const drugOrder = await DrugOrder.findByIdAndDelete(params.id);

    if (!drugOrder) {
      return NextResponse.json({ error: 'Drug order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Drug order deleted successfully' });
  } catch (error) {
    console.error('Error deleting drug order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 