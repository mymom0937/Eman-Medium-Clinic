import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import Drug from '@/models/drug';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const drug = await Drug.findById(params.id);
    
    if (!drug) {
      return NextResponse.json(
        { success: false, error: 'Drug not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: drug,
    });
  } catch (error) {
    console.error('Error fetching drug:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drug' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate required fields
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

    const updatedDrug = await Drug.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        genericName: body.genericName || '',
        category: body.category,
        description: body.description || '',
        dosageForm: body.dosageForm || 'tablet',
        strength: body.strength || '500mg',
        manufacturer: body.manufacturer || '',
        batchNumber: body.batchNumber || `BATCH-${Date.now()}`,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        purchasePrice: parseFloat(body.purchasePrice) || parseFloat(body.price || body.unitPrice || body.sellingPrice),
        sellingPrice: parseFloat(body.price || body.unitPrice || body.sellingPrice),
        stockQuantity: parseInt(body.quantity || body.stockQuantity),
        minimumStockLevel: parseInt(body.minimumStockLevel) || 10,
        imageUrl: body.imageUrl || '',
        isActive: true,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedDrug) {
      return NextResponse.json(
        { success: false, error: 'Drug not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDrug,
    });
  } catch (error) {
    console.error('Error updating drug:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update drug' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    const updatedDrug = await Drug.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedDrug) {
      return NextResponse.json(
        { success: false, error: 'Drug not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDrug,
    });
  } catch (error) {
    console.error('Error updating drug:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update drug' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const deletedDrug = await Drug.findByIdAndDelete(params.id);
    
    if (!deletedDrug) {
      return NextResponse.json(
        { success: false, error: 'Drug not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Drug deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting drug:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete drug' },
      { status: 500 }
    );
  }
} 