import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth } from '@clerk/nextjs/server';
import { LabResult } from '@/models/lab-result';
import { generateLabResultId } from '@/utils/utils';

// POST /api/lab-results/migrate - Add lab result IDs to existing records
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find all lab results that don't have a labResultId
    const labResultsWithoutId = await LabResult.find({ labResultId: { $exists: false } });

    if (labResultsWithoutId.length === 0) {
      return NextResponse.json({ 
        message: 'No lab results need migration',
        migratedCount: 0 
      });
    }

    let migratedCount = 0;

    // Update each lab result with a new lab result ID
    for (const labResult of labResultsWithoutId) {
      try {
        const labResultId = await generateLabResultId();
        
        await LabResult.findByIdAndUpdate(labResult._id, {
          $set: { labResultId }
        });

        migratedCount++;
      } catch (error) {
        console.error(`Error migrating lab result ${labResult._id}:`, error);
      }
    }

    return NextResponse.json({ 
      message: `Successfully migrated ${migratedCount} lab results`,
      migratedCount 
    });
  } catch (error) {
    console.error('Error migrating lab results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 