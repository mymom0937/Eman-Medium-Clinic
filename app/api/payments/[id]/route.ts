import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/config/connection';
import { PaymentStatus } from '@/types/payment';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const { id } = await params;
    const payment = await db
      .collection('payments')
      .findOne({ _id: new ObjectId(id) });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const body = await request.json();
  // If this is a status-only update (e.g., dropdown in table), allow minimal payload
  if (
    body &&
    (body.status || body.paymentStatus) &&
    !body.patientId &&
    !body.patientName &&
    !body.amount &&
    !body.paymentMethod
  ) {
    const newStatus = (body.paymentStatus || body.status).toString().toUpperCase();
    const { id } = await params;
    const result = await db.collection('payments').updateOne(
      { _id: new ObjectId(id) },
      { $set: { paymentStatus: newStatus, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: { message: 'Payment status updated' } });
  }

    // Validate required fields
    const requiredFields = ['patientId', 'patientName', 'amount', 'paymentMethod', 'paymentStatus'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const updateData = {
      patientId: body.patientId,
      patientName: body.patientName,
      
      // Order Integration
      orderId: body.orderId || null,
      orderType: body.orderType || null,
      orderReference: body.orderReference || null,
      drugOrderId: body.drugOrderId || null,
      
      // Payment Details
      amount: parseFloat(body.amount),
      paymentMethod: body.paymentMethod,
      paymentStatus: body.paymentStatus,
      paymentType: body.paymentType || 'OTHER',
      
      // Drug Sale Specific
      items: body.items || [],
      discount: parseFloat(body.discount) || 0,
      finalAmount: parseFloat(body.finalAmount) || parseFloat(body.amount),
      
      // General Fields
      transactionReference: body.transactionReference || '',
      notes: body.notes || '',
      recordedBy: body.recordedBy || 'System',
      updatedAt: new Date(),
    };

    const { id } = await params;
    const result = await db.collection('payments').updateOne(
      { _id: new ObjectId(id) },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const { id } = await params;
    const result = await db
      .collection('payments')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Payment deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete payment' },
      { status: 500 }
    );
  }
} 