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

    // Merge with existing doc to allow partial updates from the client
    const { id } = await params;
    const existing = await db.collection('payments').findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    const updateData = {
      patientId: body.patientId ?? existing.patientId,
      patientName: body.patientName ?? existing.patientName,

      // Order Integration
      orderId: body.orderId ?? existing.orderId ?? null,
      orderType: body.orderType ?? existing.orderType ?? null,
      orderReference: body.orderReference ?? existing.orderReference ?? null,
      drugOrderId: body.drugOrderId ?? existing.drugOrderId ?? null,

      // Payment Details
      amount:
        body.amount !== undefined && body.amount !== null
          ? parseFloat(body.amount)
          : existing.amount,
      paymentMethod: body.paymentMethod ?? existing.paymentMethod,
      paymentStatus: body.paymentStatus ?? existing.paymentStatus,
      paymentType: body.paymentType ?? existing.paymentType ?? 'OTHER',

      // Drug Sale Specific
      items: body.items !== undefined ? body.items : existing.items || [],
      discount:
        body.discount !== undefined && body.discount !== null
          ? parseFloat(body.discount)
          : existing.discount || 0,
      finalAmount:
        body.finalAmount !== undefined && body.finalAmount !== null
          ? parseFloat(body.finalAmount)
          : existing.finalAmount ?? existing.amount,

      // General Fields
      transactionReference:
        body.transactionReference !== undefined
          ? body.transactionReference
          : existing.transactionReference || '',
      notes: body.notes !== undefined ? body.notes : existing.notes || '',
      recordedBy: body.recordedBy ?? existing.recordedBy ?? 'System',
      updatedAt: new Date(),
    } as any;

    // If patientName is missing/empty but we have patientId, try to backfill from patients collection
    if (
      (!updateData.patientName ||
        (typeof updateData.patientName === 'string' && updateData.patientName.trim() === '')) &&
      updateData.patientId
    ) {
      try {
        const patient = await db.collection('patients').findOne({ patientId: updateData.patientId });
        if (patient) {
          const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(' ').trim();
          if (fullName) {
            updateData.patientName = fullName;
          }
        }
      } catch (e) {
        // ignore lookup failure; validation below will handle if still missing
      }
    }

    // Validate required fields after merge
    const requiredFields = ['patientId', 'patientName', 'amount', 'paymentMethod', 'paymentStatus'];
    for (const field of requiredFields) {
      if (
        updateData[field] === undefined ||
        updateData[field] === null ||
        (typeof updateData[field] === 'string' && updateData[field].trim() === '')
      ) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

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