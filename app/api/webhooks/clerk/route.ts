import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createClerkClient } from "@clerk/nextjs/server";
import connectToDatabase from "@/config/connection";
import User from "@/models/user";
import { USER_ROLES } from "@/constants/user-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("🔔 Clerk webhook received");
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error(
        "❌ CLERK_WEBHOOK_SECRET not found in environment variables"
      );
      throw new Error(
        "Please add CLERK_WEBHOOK_SECRET to your environment variables"
      );
    }

    console.log("✅ Webhook secret found");

    const svix_id = req.headers.get("svix-id");
    const svix_timestamp = req.headers.get("svix-timestamp");
    const svix_signature = req.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("❌ Missing svix headers:", {
        svix_id: !!svix_id,
        svix_timestamp: !!svix_timestamp,
        svix_signature: !!svix_signature,
      });
      return new Response("Error occurred -- no svix headers", {
        status: 400,
      });
    }

    console.log("✅ Svix headers found");

    // Use raw body for signature verification
    const body = await req.text();

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", { status: 400 });
    }

    console.log("✅ Svix signature verified");

    const { id, type, data } = evt;
    console.log(`📬 Clerk webhook - ID: ${id}, Type: ${type}`);
    console.log("📋 Webhook data:", JSON.stringify(data, null, 2));

    console.log("🔄 Connecting to database...");
    await connectToDatabase();
    console.log("✅ Database connected");

    if (type === "user.created") {
      const {
        id: clerkId,
        email_addresses,
        first_name,
        last_name,
        public_metadata,
      } = data;

      const primaryEmail = email_addresses[0]?.email_address;

      if (!primaryEmail) {
        console.error("❌ No email address found for user:", clerkId);
        return NextResponse.json(
          { error: "No email address" },
          { status: 400 }
        );
      }

      console.log(
        `👤 Processing user creation - ID: ${clerkId}, Email: ${primaryEmail}`
      );

      // Check if user already exists
      const existingUser = await User.findOne({ clerkId });
      if (existingUser) {
        console.log("⚠️ User already exists in database:", clerkId);
        return NextResponse.json({
          success: true,
          message: "User already exists",
        });
      }

      // Get role from public metadata or default to NURSE
      const userRole = (public_metadata?.role as string) || USER_ROLES.NURSE;

      // First, persist the user. If this fails, we must return 500.
      let mongoUserId: string | undefined;
      try {
        const newUser = new User({
          clerkId,
          email: primaryEmail,
          firstName: first_name || "",
          lastName: last_name || "",
          role: userRole,
          isActive: true,
        });

        await newUser.save();
        mongoUserId = String(newUser._id);
        console.log("✅ User created in MongoDB:", {
          clerkId,
          email: primaryEmail,
          role: userRole,
          mongoId: newUser._id,
        });
      } catch (error) {
        console.error("❌ Error creating user in MongoDB:", error);
        console.error("User data that failed:", {
          clerkId,
          primaryEmail,
          userRole,
        });
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      // Best-effort: update Clerk metadata, but do NOT fail the webhook if this part errors
      if (!public_metadata?.role) {
        try {
          const clerk = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY!,
          });
          await clerk.users.updateUserMetadata(clerkId, {
            publicMetadata: { role: userRole },
          });
          console.log("✅ Clerk public metadata updated with role", userRole);
        } catch (error) {
          console.warn(
            "⚠️ Failed to update Clerk public metadata. Proceeding anyway.",
            error
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: "User created successfully",
        userId: mongoUserId,
      });
    }

    if (type === "user.updated") {
      const {
        id: clerkId,
        email_addresses,
        first_name,
        last_name,
        public_metadata,
      } = data;

      const primaryEmail = email_addresses[0]?.email_address;

      try {
        const updateData: any = {};

        if (primaryEmail) updateData.email = primaryEmail;
        if (first_name !== undefined) updateData.firstName = first_name || "";
        if (last_name !== undefined) updateData.lastName = last_name || "";
        if (public_metadata?.role) updateData.role = public_metadata.role;

        const updatedUser = await User.findOneAndUpdate(
          { clerkId },
          { $set: updateData },
          { new: true }
        );

        if (updatedUser) {
          console.log("User updated in MongoDB:", clerkId);
        } else {
          console.log("User not found in MongoDB for update:", clerkId);
        }

        return NextResponse.json({
          success: true,
          message: "User updated successfully",
        });
      } catch (error) {
        console.error("Error updating user in MongoDB:", error);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }
    }

    if (type === "user.deleted") {
      const { id: clerkId } = data;

      try {
        const deletedUser = await User.findOneAndUpdate(
          { clerkId },
          { $set: { isActive: false } },
          { new: true }
        );

        if (deletedUser) {
          console.log("User deactivated in MongoDB:", clerkId);
        } else {
          console.log("User not found in MongoDB for deletion:", clerkId);
        }

        return NextResponse.json({
          success: true,
          message: "User deactivated successfully",
        });
      } catch (error) {
        console.error("Error deactivating user in MongoDB:", error);
        return NextResponse.json(
          { error: "Failed to deactivate user" },
          { status: 500 }
        );
      }
    }

    console.log(`Unhandled webhook type: ${type}`);
    return NextResponse.json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    console.error("Request details:", {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
