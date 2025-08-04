import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth } from '@clerk/nextjs/server';
import { LabResult } from '@/models/lab-result';
import { generateLabResultId } from '@/utils/utils';

// GET /api/lab-results/debug - Debug endpoint
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check the model schema
    const schema = LabResult.schema.obj;
    
    // Check existing lab results
    const allLabResults = await LabResult.find({});
    const labResultsWithoutId = await LabResult.find({ labResultId: { $exists: false } });

    // Test creating a lab result ID
    const testLabResultId = await generateLabResultId();

    return NextResponse.json({
      schema: schema,
      totalLabResults: allLabResults.length,
      labResultsWithoutId: labResultsWithoutId.length,
      sampleLabResult: allLabResults[0] || null,
      testLabResultId: testLabResultId,
      schemaKeys: Object.keys(schema)
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/lab-results/debug - Test lab result creation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Generate lab result ID
    const labResultId = await generateLabResultId();
    console.log('Generated lab result ID:', labResultId);

    // Create test lab result data
    const testLabResultData = {
      labResultId,
      patientId: 'TEST000001',
      patientName: 'Test Patient',
      testType: 'HEMOGLOBIN',
      testName: 'Test Lab Result',
      status: 'PENDING',
      requestedBy: userId,
      requestedAt: new Date(),
      notes: 'Test lab result for debugging',
    };

    console.log('Test lab result data:', testLabResultData);

    // Create the lab result
    const labResult = new LabResult(testLabResultData);
    console.log('Lab result instance:', labResult);

    // Save the lab result
    const savedLabResult = await labResult.save();
    console.log('Saved lab result:', savedLabResult);

    return NextResponse.json({
      message: 'Test lab result created',
      labResultId: labResultId,
      savedLabResult: savedLabResult
    });
  } catch (error) {
    console.error('Error creating test lab result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 