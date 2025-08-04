import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth, currentUser } from '@clerk/nextjs/server';
import { DrugOrder } from '@/models/drug-order';
import { CreateDrugOrderRequest } from '@/types/drug-order';
import { USER_ROLES } from '@/constants/user-roles';
import { generateDrugOrderId } from '@/utils/utils';

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

    // Check if user has permission to create drug orders
    if (userRole !== USER_ROLES.NURSE && userRole !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const body: CreateDrugOrderRequest = await request.json();
    const { patientId, patientName, labResultId, items, notes } = body;

    if (!patientId || !patientName || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate each drug item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.drugId?.trim()) {
        return NextResponse.json({ 
          error: `Drug item ${i + 1} is missing drug ID` 
        }, { status: 400 });
      }
      if (!item.drugName?.trim()) {
        return NextResponse.json({ 
          error: `Drug item ${i + 1} is missing drug name` 
        }, { status: 400 });
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json({ 
          error: `Drug item ${i + 1} must have a quantity greater than 0` 
        }, { status: 400 });
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        return NextResponse.json({ 
          error: `Drug item ${i + 1} must have a unit price greater than 0` 
        }, { status: 400 });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Generate drug order ID
    const drugOrderId = await generateDrugOrderId();
    console.log('Generated drug order ID:', drugOrderId);

    const drugOrderData = {
      drugOrderId,
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
    };

    console.log('Drug order data to save:', drugOrderData);
    const savedDrugOrder = await DrugOrder.create(drugOrderData);
    console.log('Saved drug order:', savedDrugOrder);

    return NextResponse.json(savedDrugOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating drug order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 