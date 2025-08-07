import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { Feedback } from '@/models/feedback';
import { rateLimit } from '@/utils/rate-limit';

// Rate limiting: 5 submissions per IP per hour
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const { success } = await limiter.check(5, ip);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many submissions. Please try again later.' 
        },
        { status: 429 }
      );
    }

    // Connect to database
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database connection failed. Please try again later.' 
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { firstName, lastName, email, phone, company, message } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !message) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'All required fields must be provided' 
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please enter a valid email address' 
        },
        { status: 400 }
      );
    }

    // Phone validation (basic)
    if (phone.length < 10) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please enter a valid phone number' 
        },
        { status: 400 }
      );
    }

    // Message length validation
    if (message.length < 10) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Message must be at least 10 characters long' 
        },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Message cannot exceed 2000 characters' 
        },
        { status: 400 }
      );
    }

    // Check for duplicate submissions (same email within 24 hours)
    const existingFeedback = await Feedback.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (existingFeedback) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'You have already submitted feedback recently. Please wait 24 hours before submitting again.' 
        },
        { status: 400 }
      );
    }

    // Create new feedback entry
    const feedback = new Feedback({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      company: company ? company.trim() : '',
      message: message.trim(),
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || '',
      status: 'pending'
    });

    await feedback.save();

    // Log the submission for monitoring
    console.log(`New feedback submitted: ${email} from ${ip}`);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! We will get back to you soon.',
      data: {
        id: feedback._id,
        submittedAt: feedback.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Feedback submission error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while submitting your feedback. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database connection failed. Please try again later.' 
        },
        { status: 500 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const email = searchParams.get('email');

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (email) query.email = { $regex: email, $options: 'i' };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get feedback with pagination
    const feedback = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    // Get total count
    const total = await Feedback.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: feedback,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
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
