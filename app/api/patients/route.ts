import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/config/connection';
import { Patient } from '@/types/patient';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const { searchParams } = new URL(request.url);
    const isSummary = (searchParams.get('summary') || 'false') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { patientId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {} as any;
      if (startDate) (query.createdAt as any).$gte = new Date(startDate);
      if (endDate) (query.createdAt as any).$lte = new Date(endDate);
    }

    if (isSummary) {
      const cursor = db.collection('patients').aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalPatients: { $sum: 1 },
            activePatients: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            averageAge: { $avg: { $ifNull: ['$age', 0] } },
          },
        },
      ]);
      const res = await cursor.toArray();
      const s = res[0] || { totalPatients: 0, activePatients: 0, averageAge: 0 };
      return NextResponse.json({ success: true, summary: { totalPatients: s.totalPatients || 0, activePatients: s.activePatients || 0, averageAge: Math.round(s.averageAge || 0) } });
    }
    
    const patients = await db
      .collection('patients')
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('patients').countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'medicalHistory'];
    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Generate unique patient ID
    const lastPatient = await db
      .collection('patients')
      .findOne({}, { sort: { patientId: -1 } });
    
    const lastId = lastPatient ? parseInt(lastPatient.patientId.slice(3)) : 0;
    const newId = lastId + 1;
    const patientId = `PAT${newId.toString().padStart(6, '0')}`;
    
    const patient = {
      id: patientId, // Add the required id field
      patientId,
      firstName: body.firstName,
      lastName: body.lastName,
      age: body.age ? parseInt(body.age) : null,
      bloodType: body.bloodType || '',
      phone: body.phone || '',
      email: body.email || '',
      dateOfBirth: body.dateOfBirth || null,
      gender: body.gender || '',
      address: body.address || '',
      emergencyContact: body.emergencyContact || '',
      medicalHistory: body.medicalHistory,
      allergies: body.allergies || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('patients').insertOne(patient);
    
    return NextResponse.json({
      success: true,
      data: { ...patient, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create patient' },
      { status: 500 }
    );
  }
} 