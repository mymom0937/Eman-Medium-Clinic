import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/config/database";
import { WalkInService } from "@/models/walk-in-service";

export async function GET() {
  try {
    await connectToDatabase();
    
    const services = await WalkInService.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Error fetching walk-in services:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch walk-in services",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    console.log("Received data in API:", body);
    
    // Generate service ID
    const lastService = await WalkInService.findOne({})
      .sort({ serviceId: -1 })
      .lean();
    
    const lastNumber = lastService
      ? parseInt(lastService.serviceId.replace("WIS", ""))
      : 0;
    const serviceId = `WIS${String(lastNumber + 1).padStart(6, "0")}`;

    const serviceData = {
      ...body,
      serviceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Service data to save:", serviceData);
    const service = new WalkInService(serviceData);
    await service.save();

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Error creating walk-in service:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create walk-in service",
      },
      { status: 500 }
    );
  }
}
