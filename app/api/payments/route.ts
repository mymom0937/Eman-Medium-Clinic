import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/config/connection';
import { Payment, PaymentMethod, PaymentStatus } from '@/types/payment';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const method = searchParams.get('method') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }
    if (method) {
      query.method = method;
    }

    const payments = await db
      .collection('payments')
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('payments').countDocuments(query);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['amount', 'method', 'patientId', 'patientName'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate unique payment ID
    const lastPayment = await db
      .collection('payments')
      .findOne({}, { sort: { paymentId: -1 } });

    const lastId = lastPayment ? parseInt(lastPayment.paymentId.slice(3)) : 0;
    const newId = lastId + 1;
    const paymentId = `PAY${newId.toString().padStart(6, '0')}`;

    const payment: Omit<Payment, '_id'> = {
      paymentId,
      amount: parseFloat(body.amount),
      method: body.method as PaymentMethod,
      status: body.status || 'PENDING' as PaymentStatus,
      description: body.description || '',
      patientId: body.patientId,
      patientName: body.patientName,
      reference: body.reference || `INV-${Date.now()}`,
      processedBy: body.processedBy || 'System',
      processedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('payments').insertOne(payment);

    return NextResponse.json({
      success: true,
      data: { ...payment, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const body = await request.json();
    const { paymentId, status, processedBy } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, error: 'Payment ID and status are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: status as PaymentStatus,
      updatedAt: new Date(),
    };

    if (processedBy) {
      updateData.processedBy = processedBy;
    }

    if (status === 'COMPLETED') {
      updateData.processedAt = new Date();
    }

    const result = await db.collection('payments').updateOne(
      { paymentId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Payment updated successfully' },
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
} 