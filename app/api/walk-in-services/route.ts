import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/config/database";
import { WalkInService } from "../../../models/walk-in-service";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const isSummary = (searchParams.get('summary') || 'false') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {} as any;
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    if (isSummary) {
      const cursor = WalkInService.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalServices: { $sum: 1 },
            totalRevenue: { $sum: { $toDouble: { $ifNull: ['$amount', 0] } } },
            pendingPayments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PENDING'] }, 1, 0] } },
            completedServices: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'COMPLETED'] }, 1, 0] } },
          },
        },
      ]);
      const agg = await cursor.exec();
      const s = agg[0] || { totalServices: 0, totalRevenue: 0, pendingPayments: 0, completedServices: 0 };
      return NextResponse.json({ success: true, summary: s });
    }

    const services = await WalkInService.find(match)
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
      .lean() as any;
    
    const lastNumber = lastService && lastService.serviceId
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
