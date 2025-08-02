import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth } from '@clerk/nextjs/server';
import { DrugOrder } from '@/models/drug-order';
import { CreateDrugOrderRequest } from '@/types/drug-order';
import { USER_ROLES } from '@/constants/user-roles';

// GET /api/drug-orders - Get all drug orders
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    await connectToDatabase();

    let query: any = {};

    if (patientId) {
      query.patientId = patientId;
    }
    if (status) {
      query.status = status;
    }

    const drugOrders = await DrugOrder.find(query).sort({ createdAt: -1 });

    return NextResponse.json(drugOrders);
  } catch (error) {
    console.error('Error fetching drug orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/drug-orders - Create new drug order
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

    const body: CreateDrugOrderRequest = await request.json();
    const { patientId, patientName, labResultId, items, notes } = body;

    if (!patientId || !patientName || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const drugOrder = new DrugOrder({
      patientId,
      patientName,
      labResultId,
      status: 'PENDING',
      orderedBy: userId,
      orderedAt: new Date(),
      items: items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      })),
      totalAmount,
      notes,
    });

    const savedDrugOrder = await drugOrder.save();

    return NextResponse.json(savedDrugOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating drug order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 