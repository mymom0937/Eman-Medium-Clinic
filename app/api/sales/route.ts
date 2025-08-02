import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/config/db/connection';
import { Sale, SaleItem, PaymentMethod, PaymentStatus } from '@/types/sale';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'eman_clinic');

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
        { saleId: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.paymentStatus = status;
    }
    if (method) {
      query.paymentMethod = method;
    }

    const sales = await db
      .collection('sales')
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('sales').countDocuments(query);

    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'eman_clinic');

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['patientId', 'patientName', 'items', 'totalAmount'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate items
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Generate unique sale ID
    const lastSale = await db
      .collection('sales')
      .findOne({}, { sort: { saleId: -1 } });

    const lastId = lastSale ? parseInt(lastSale.saleId.slice(4)) : 0;
    const newId = lastId + 1;
    const saleId = `SALE${newId.toString().padStart(6, '0')}`;

    // Calculate totals
    const totalAmount = parseFloat(body.totalAmount);
    const discount = parseFloat(body.discount || '0');
    const finalAmount = totalAmount - discount;

    const sale: Omit<Sale, '_id'> = {
      saleId,
      patientId: body.patientId,
      patientName: body.patientName,
      items: body.items.map((item: any) => ({
        drugId: item.drugId,
        drugName: item.drugName,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.totalPrice),
      })),
      totalAmount,
      discount,
      finalAmount,
      paymentMethod: body.paymentMethod || 'CASH' as PaymentMethod,
      paymentStatus: body.paymentStatus || 'PENDING' as PaymentStatus,
      soldBy: body.soldBy || 'System',
      soldAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('sales').insertOne(sale);

    // Update inventory quantities
    for (const item of sale.items) {
      await db.collection('drugs').updateOne(
        { _id: item.drugId },
        { $inc: { quantity: -item.quantity } }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...sale, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'eman_clinic');

    const body = await request.json();
    const { saleId, paymentStatus, soldBy } = body;

    if (!saleId || !paymentStatus) {
      return NextResponse.json(
        { success: false, error: 'Sale ID and payment status are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      paymentStatus: paymentStatus as PaymentStatus,
      updatedAt: new Date(),
    };

    if (soldBy) {
      updateData.soldBy = soldBy;
    }

    if (paymentStatus === 'COMPLETED') {
      updateData.soldAt = new Date();
    }

    const result = await db.collection('sales').updateOne(
      { saleId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Sale updated successfully' },
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sale' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'eman_clinic');

    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('saleId');

    if (!saleId) {
      return NextResponse.json(
        { success: false, error: 'Sale ID is required' },
        { status: 400 }
      );
    }

    // Get the sale to restore inventory
    const sale = await db.collection('sales').findOne({ saleId });
    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Restore inventory quantities
    for (const item of sale.items) {
      await db.collection('drugs').updateOne(
        { _id: item.drugId },
        { $inc: { quantity: item.quantity } }
      );
    }

    // Delete the sale
    const result = await db.collection('sales').deleteOne({ saleId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Sale deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete sale' },
      { status: 500 }
    );
  }
} 