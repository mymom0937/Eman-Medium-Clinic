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
    const isSummary = (searchParams.get('summary') || 'false') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const method = searchParams.get('method') || '';
    const orderType = searchParams.get('orderType') || '';
    const paymentType = searchParams.get('paymentType') || '';

    // Summary branch: aggregate totals across the entire collection
    if (isSummary) {
      const match: any = {};
      if (status) {
        // Case-insensitive exact match for paymentStatus
        match.paymentStatus = { $regex: `^${status}$`, $options: 'i' };
      }
      if (method) {
        // Case-insensitive exact match for paymentMethod
        match.paymentMethod = { $regex: `^${method}$`, $options: 'i' };
      }
      if (orderType) {
        // Filter by linked clinical workflow (e.g., DRUG_ORDER)
        match.orderType = { $regex: `^${orderType}$`, $options: 'i' };
      }
      if (paymentType) {
        // Filter by paymentType (e.g., DRUG_SALE, WALK_IN_SERVICE)
        match.paymentType = { $regex: `^${paymentType}$`, $options: 'i' };
      }

      // Optional date range
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      if (startDate || endDate) {
        match.createdAt = {} as any;
        if (startDate) (match.createdAt as any).$gte = new Date(startDate);
        if (endDate) (match.createdAt as any).$lte = new Date(endDate);
      }

      const cursor = db.collection('payments').aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: { $ifNull: ['$finalAmount', '$amount'] } },
            count: { $sum: 1 },
          },
        },
      ]);

      const results = await cursor.toArray();
      const summary = results[0] || { totalAmount: 0, count: 0 };

      return NextResponse.json({
        success: true,
        summary: {
          totalAmount: summary.totalAmount || 0,
          count: summary.count || 0,
        },
      });
    }

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
      // Correct field names for filtering
      query.paymentStatus = status.toUpperCase();
    }
    if (method) {
      query.paymentMethod = method.toUpperCase();
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
    const requiredFields = ['patientId', 'patientName', 'amount', 'paymentMethod', 'paymentStatus'];
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

    const payment = {
      paymentId,
      patientId: body.patientId,
      patientName: body.patientName,
      
      // Order Integration
      orderId: body.orderId || null,
      orderType: body.orderType || null,
      orderReference: body.orderReference || null,
      drugOrderId: body.drugOrderId || null, // Add drugOrderId field
      
      // Payment Details
      amount: parseFloat(body.amount),
      paymentMethod: body.paymentMethod as PaymentMethod,
      paymentStatus: body.paymentStatus as PaymentStatus,
      paymentType: body.paymentType || 'OTHER',
      
      // Drug Sale Specific
      items: body.items || [],
      discount: parseFloat(body.discount) || 0,
      finalAmount: parseFloat(body.finalAmount) || parseFloat(body.amount),
      
      // General Fields
      transactionReference: body.transactionReference || `INV-${Date.now()}`,
      notes: body.notes || '',
      recordedBy: body.recordedBy || 'System',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('payments').insertOne(payment);

    // Update order status if linked to an order
    if (body.orderId && body.orderType) {
      await updateOrderPaymentStatus(body.orderId, body.orderType, paymentId, db);
    }

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

// Helper function to update order payment status
const updateOrderPaymentStatus = async (orderId: string, orderType: string, paymentId: string, db: any) => {
  try {
    let collection = '';
    let updateField = '';
    
    switch (orderType) {
      case 'DRUG_ORDER':
        collection = 'drug_orders';
        updateField = 'paymentStatus';
        break;
      case 'LAB_TEST':
        collection = 'lab_results';
        updateField = 'paymentStatus';
        break;
      default:
        return;
    }
    
    await db.collection(collection).updateOne(
      { _id: orderId },
      { 
        $set: { 
          [updateField]: 'PAID',
          paymentId: paymentId,
          paidAt: new Date()
        } 
      }
    );
  } catch (error) {
    console.error('Error updating order payment status:', error);
  }
};

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
      paymentStatus: status as PaymentStatus,
      updatedAt: new Date(),
    };

    if (processedBy) {
      updateData.recordedBy = processedBy;
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