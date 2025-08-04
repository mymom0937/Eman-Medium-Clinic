import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth } from '@clerk/nextjs/server';
import { DrugOrder } from '@/models/drug-order';
import { generateDrugOrderId } from '@/utils/utils';

// GET /api/drug-orders/test-migration - Get migration info
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const totalDrugOrders = await DrugOrder.countDocuments();
    const drugOrdersWithoutId = await DrugOrder.countDocuments({ drugOrderId: { $exists: false } });
    const sampleDrugOrders = await DrugOrder.find({ drugOrderId: { $exists: false } }).limit(3);

    return NextResponse.json({
      totalDrugOrders,
      drugOrdersWithoutId,
      sampleDrugOrders: sampleDrugOrders.map(order => ({
        _id: order._id,
        patientId: order.patientId,
        patientName: order.patientName,
        status: order.status,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error getting migration info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/drug-orders/test-migration - Run migration
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const drugOrdersWithoutId = await DrugOrder.find({ drugOrderId: { $exists: false } });
    
    if (drugOrdersWithoutId.length === 0) {
      return NextResponse.json({ 
        message: 'No drug orders found without drug order ID',
        updatedCount: 0 
      });
    }

    let updatedCount = 0;
    for (const drugOrder of drugOrdersWithoutId) {
      try {
        const drugOrderId = await generateDrugOrderId();
        await DrugOrder.findByIdAndUpdate(drugOrder._id, { drugOrderId });
        updatedCount++;
      } catch (error) {
        console.error(`Error updating drug order ${drugOrder._id}:`, error);
      }
    }

    return NextResponse.json({ 
      message: `Successfully updated ${updatedCount} drug orders with drug order IDs`,
      updatedCount 
    });
  } catch (error) {
    console.error('Error running migration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 