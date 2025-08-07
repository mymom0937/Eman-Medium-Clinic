import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { Feedback } from '@/models/feedback';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const feedback = await Feedback.findById(params.id).select('-__v');

    if (!feedback) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Feedback not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('Feedback retrieval error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while retrieving feedback.' 
      },
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
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'read', 'replied', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid status value' 
        },
        { status: 400 }
      );
    }

    const feedback = await Feedback.findByIdAndUpdate(
      params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!feedback) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Feedback not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback
    });

  } catch (error) {
    console.error('Feedback update error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while updating feedback.' 
      },
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

    const feedback = await Feedback.findByIdAndDelete(params.id);

    if (!feedback) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Feedback not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Feedback deletion error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while deleting feedback.' 
      },
      { status: 500 }
    );
  }
}
