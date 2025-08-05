import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { uploadMultipleImagesToCloudinary } from '@/utils/cloudinary';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (category && category !== 'all') {
      query.category = { $regex: category, $options: 'i' };
    }
    
    if (status && status !== 'all') {
      if (status === 'out_of_stock') {
        query.stockQuantity = 0;
      } else if (status === 'low_stock') {
        query.stockQuantity = { $lte: 10, $gt: 0 };
      } else if (status === 'in_stock') {
        query.stockQuantity = { $gt: 10 };
      }
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
    await connectToDatabase();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    let imageUrl = '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (for image uploads)
      const formData = await request.formData();
      
      // Extract text fields
      body = {
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        description: formData.get('description') as string || '',
        manufacturer: formData.get('manufacturer') as string || '',
        expiryDate: formData.get('expiryDate') as string,
        price: formData.get('price') as string,
        unitPrice: formData.get('price') as string, // Map price to unitPrice
        sellingPrice: formData.get('price') as string, // Map price to sellingPrice
        quantity: formData.get('quantity') as string,
        stockQuantity: formData.get('quantity') as string, // Map quantity to stockQuantity
      };
      
      // Handle image uploads to Cloudinary
      const images = formData.getAll('images') as File[];
      const validImages = images.filter(img => img instanceof File && img.size > 0);
      
      if (validImages.length > 0) {
        try {
          const uploadResults = await uploadMultipleImagesToCloudinary(validImages);
          // Use the first image URL as the main image
          imageUrl = uploadResults[0].secure_url;
        } catch (uploadError) {
          console.error('Error uploading images to Cloudinary:', uploadError);
          return NextResponse.json(
            { success: false, error: 'Failed to upload images' },
            { status: 500 }
          );
        }
      }
    } else {
      // Handle JSON request
      body = await request.json();
    }
    
    // Validate required fields - accept price, unitPrice, or sellingPrice
    const requiredFields = ['name', 'category'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check for price, unitPrice, or sellingPrice
    if (!body.price && !body.unitPrice && !body.sellingPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: price, unitPrice, or sellingPrice' },
        { status: 400 }
      );
    }
    
    // Check for quantity or stockQuantity
    if (!body.quantity && !body.stockQuantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: quantity or stockQuantity' },
        { status: 400 }
      );
    }
    
    const drug = {
      name: body.name,
      genericName: body.genericName || '',
      category: body.category,
      description: body.description || '',
      dosageForm: body.dosageForm || 'tablet',
      strength: body.strength || '500mg',
      manufacturer: body.manufacturer || '',
      batchNumber: body.batchNumber || `BATCH-${Date.now()}`,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      purchasePrice: parseFloat(body.purchasePrice) || parseFloat(body.price || body.unitPrice || body.sellingPrice),
      sellingPrice: parseFloat(body.price || body.unitPrice || body.sellingPrice),
      stockQuantity: parseInt(body.quantity || body.stockQuantity),
      minimumStockLevel: parseInt(body.minimumStockLevel) || 10,
      imageUrl: imageUrl || body.imageUrl || '',
      isActive: true,
      createdBy: body.createdBy || 'system', // This should be the actual user ID in a real app
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