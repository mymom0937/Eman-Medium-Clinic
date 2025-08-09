import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/config/database";
import { WalkInService } from "../../../../models/walk-in-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const service = await WalkInService.findById(params.id).lean();
    
    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: "Walk-in service not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Error fetching walk-in service:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch walk-in service",
      },
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
    
    const service = await WalkInService.findByIdAndUpdate(
      params.id,
      {
        ...body,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: "Walk-in service not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Error updating walk-in service:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update walk-in service",
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
    
    const service = await WalkInService.findByIdAndDelete(params.id);

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: "Walk-in service not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Walk-in service deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting walk-in service:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete walk-in service",
      },
      { status: 500 }
    );
  }
}
