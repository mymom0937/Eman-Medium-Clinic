import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/config/db/connection';
import { Drug } from '@/types/drug';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'eman_clinic');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      query.category = category;
    }
    
    const drugs = await db
      .collection('drugs')
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('drugs').countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: drugs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drugs' },
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
    const requiredFields = ['name', 'category', 'price', 'quantity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const drug: Omit<Drug, '_id'> = {
      name: body.name,
      description: body.description || '',
      category: body.category,
      price: parseFloat(body.price),
      quantity: parseInt(body.quantity),
      imageUrl: body.imageUrl || '',
      manufacturer: body.manufacturer || '',
      expiryDate: body.expiryDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('drugs').insertOne(drug);
    
    return NextResponse.json({
      success: true,
      data: { ...drug, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Error creating drug:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create drug' },
      { status: 500 }
    );
  }
} 