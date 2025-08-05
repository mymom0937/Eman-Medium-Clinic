import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import Drug from '@/models/drug';
import { uploadMultipleImagesToCloudinary } from '@/utils/cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    
    const drug = await Drug.findById(id);
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    
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
    if (body.quantity === undefined && body.stockQuantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: quantity or stockQuantity' },
        { status: 400 }
      );
    }

    // Validate quantity is a valid number
    const quantityValue = body.quantity !== undefined ? body.quantity : body.stockQuantity;
    console.log('Debug - body:', body);
    console.log('Debug - quantityValue:', quantityValue);
    console.log('Debug - typeof quantityValue:', typeof quantityValue);
    
    // Convert to number and validate
    const parsedQuantity = Number(quantityValue);
    console.log('Debug - parsedQuantity:', parsedQuantity);
    console.log('Debug - isNaN(parsedQuantity):', isNaN(parsedQuantity));
    
    if (isNaN(parsedQuantity)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quantity value. Must be a valid number.' },
        { status: 400 }
      );
    }

    const updatedDrug = await Drug.findByIdAndUpdate(
      id,
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
        stockQuantity: parsedQuantity,
        minimumStockLevel: parseInt(body.minimumStockLevel) || 10,
        imageUrl: imageUrl || body.imageUrl || '',
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    
    const body = await request.json();
    
    const updatedDrug = await Drug.findByIdAndUpdate(
      id,
      { $set: body },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const deletedDrug = await Drug.findByIdAndDelete(id);

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