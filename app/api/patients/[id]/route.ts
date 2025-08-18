import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/config/database";
import Patient from "@/models/patient";
import { auth, currentUser } from "@clerk/nextjs/server";
import { USER_ROLES } from "@/constants/user-roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const patient = await Patient.findById(id);

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    const user = await currentUser();
    const role = (user?.publicMetadata as any)?.role as string | undefined;
    if (role !== USER_ROLES.NURSE && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    const { id } = await params;
    await connectToDatabase();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["firstName", "lastName", "medicalHistory"];
    for (const field of requiredFields) {
      if (
        !body[field] ||
        (typeof body[field] === "string" && !body[field].trim())
      ) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone || "",
        email: body.email || "",
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        address: body.address,
        bloodType: body.bloodType || "",
        age: body.age ? parseInt(body.age) : null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        medicalHistory: body.medicalHistory,
        emergencyContact: body.emergencyContact,
        allergies: body.allergies,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedPatient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPatient,
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update patient" },
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

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updatedPatient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPatient,
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    const user = await currentUser();
    const role = (user?.publicMetadata as any)?.role as string | undefined;
    if (role !== USER_ROLES.NURSE && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    const { id } = await params;
    await connectToDatabase();

    const deletedPatient = await Patient.findByIdAndDelete(id);

    if (!deletedPatient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
