import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/config/connection';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const body = await request.json();
    const { type, data, source } = body;

    // Validate webhook
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Log webhook
    await db.collection('webhooks').insertOne({
      type,
      source,
      data,
      receivedAt: new Date(),
      processed: false,
    });

    // Process different webhook types
    switch (type) {
      case 'payment_completed':
        await handlePaymentCompleted(data);
        break;
      
      case 'inventory_low':
        await handleInventoryLow(data);
        break;
      
      case 'appointment_reminder':
        await handleAppointmentReminder(data);
        break;
      
      case 'drug_expiry':
        await handleDrugExpiry(data);
        break;
      
      default:
        console.log(`Unknown webhook type: ${type}`);
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Webhook processed successfully' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handlePaymentCompleted(data: any) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Update payment status
    await db.collection('payments').updateOne(
      { paymentId: data.paymentId },
      { 
        $set: { 
          status: 'COMPLETED',
          processedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    // Update related sale if exists
    if (data.saleId) {
      await db.collection('sales').updateOne(
        { saleId: data.saleId },
        { 
          $set: { 
            paymentStatus: 'COMPLETED',
            updatedAt: new Date()
          } 
        }
      );
    }

    console.log(`Payment ${data.paymentId} marked as completed`);
  } catch (error) {
    console.error('Error handling payment completed webhook:', error);
  }
}

async function handleInventoryLow(data: any) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Create notification
    await db.collection('notifications').insertOne({
      type: 'INVENTORY_LOW',
      title: 'Low Stock Alert',
      message: `Drug ${data.drugName} is running low (${data.quantity} units remaining)`,
      drugId: data.drugId,
      priority: 'HIGH',
      createdAt: new Date(),
      read: false,
    });

    console.log(`Low stock alert created for ${data.drugName}`);
  } catch (error) {
    console.error('Error handling inventory low webhook:', error);
  }
}

async function handleAppointmentReminder(data: any) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Create notification
    await db.collection('notifications').insertOne({
      type: 'APPOINTMENT_REMINDER',
      title: 'Appointment Reminder',
      message: `Reminder: ${data.patientName} has an appointment for ${data.serviceName} at ${data.scheduledTime}`,
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      priority: 'MEDIUM',
      createdAt: new Date(),
      read: false,
    });

    console.log(`Appointment reminder created for ${data.patientName}`);
  } catch (error) {
    console.error('Error handling appointment reminder webhook:', error);
  }
}

async function handleDrugExpiry(data: any) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Create notification
    await db.collection('notifications').insertOne({
      type: 'DRUG_EXPIRY',
      title: 'Drug Expiry Alert',
      message: `Drug ${data.drugName} will expire on ${data.expiryDate}`,
      drugId: data.drugId,
      priority: 'HIGH',
      createdAt: new Date(),
      read: false,
    });

    console.log(`Drug expiry alert created for ${data.drugName}`);
  } catch (error) {
    console.error('Error handling drug expiry webhook:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    const query: any = {};
    if (type) {
      query.type = type;
    }

    const webhooks = await db
      .collection('webhooks')
      .find(query)
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('webhooks').countDocuments(query);

    return NextResponse.json({
      success: true,
      data: webhooks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
} 