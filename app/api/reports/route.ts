import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/config/connection';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'sales';
    const dateRange = searchParams.get('range') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let queryStartDate: Date;
    let queryEndDate: Date;

    // Calculate date range
    const now = new Date();
    switch (dateRange) {
      case 'today':
        queryStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        queryEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        queryStartDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        queryEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'month':
        queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        queryEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        queryStartDate = new Date(now.getFullYear(), quarter * 3, 1);
        queryEndDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
        break;
      case 'year':
        queryStartDate = new Date(now.getFullYear(), 0, 1);
        queryEndDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'custom':
        queryStartDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
        queryEndDate = endDate ? new Date(endDate) : new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        queryEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    let reportData: any = {};

    switch (reportType) {
      case 'patients':
        reportData = await generatePatientReport(db, queryStartDate, queryEndDate);
        break;
      case 'lab-results':
        reportData = await generateLabResultsReport(db, queryStartDate, queryEndDate);
        break;
      case 'drug-orders':
        reportData = await generateDrugOrdersReport(db, queryStartDate, queryEndDate);
        break;
      case 'inventories':
        reportData = await generateInventoryReport(db, queryStartDate, queryEndDate);
        break;
      case 'sales':
        reportData = await generateSalesReport(db, queryStartDate, queryEndDate);
        break;
      case 'payments':
        reportData = await generatePaymentsReport(db, queryStartDate, queryEndDate);
        break;
      case 'walk-in-services':
        reportData = await generateWalkInServicesReport(db, queryStartDate, queryEndDate);
        break;
      case 'comprehensive':
        reportData = await generateComprehensiveReport(db, queryStartDate, queryEndDate);
        break;
      default:
        reportData = await generateSalesReport(db, queryStartDate, queryEndDate);
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      meta: {
        reportType,
        dateRange,
        startDate: queryStartDate,
        endDate: queryEndDate,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Sales Report
async function generateSalesReport(db: any, startDate: Date, endDate: Date) {
  const sales = await db.collection('sales').find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).toArray();

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
  const itemsCount = sales.reduce((sum: number, s: any) => sum + (Array.isArray(s.items) ? s.items.reduce((a: number, it: any) => a + Number(it.quantity || 0), 0) : 0), 0);

  const paymentMethodDistribution = sales.reduce((acc: any, s: any) => {
    const method = s.paymentMethod || 'UNKNOWN';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalSales,
      totalRevenue,
      averageSale: totalSales > 0 ? totalRevenue / totalSales : 0,
      totalItems: itemsCount,
    },
    paymentMethodDistribution,
    sales: sales.map((s: any) => ({
      saleId: s.saleId,
      patientName: s.patientName,
      total: Number(s.total || 0),
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      createdAt: s.createdAt,
      items: (s.items || []).map((i: any) => ({ drugName: i.drugName, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice }))
    }))
  };
}

async function generatePatientReport(db: any, startDate: Date, endDate: Date) {
  const patients = await db.collection('patients').find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).toArray();

  const totalPatients = patients.length;
  const activePatients = patients.filter((p: any) => p.isActive).length;
  const newPatients = patients.filter((p: any) => {
    const created = new Date(p.createdAt);
    return created >= startDate && created <= endDate;
  }).length;

  const genderDistribution = patients.reduce((acc: any, patient: any) => {
    const gender = patient.gender?.toUpperCase() || 'UNKNOWN';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

  const ageGroups = patients.reduce((acc: any, patient: any) => {
    const age = patient.age || 0;
    if (age < 18) acc['Under 18'] = (acc['Under 18'] || 0) + 1;
    else if (age < 30) acc['18-29'] = (acc['18-29'] || 0) + 1;
    else if (age < 50) acc['30-49'] = (acc['30-49'] || 0) + 1;
    else if (age < 65) acc['50-64'] = (acc['50-64'] || 0) + 1;
    else acc['65+'] = (acc['65+'] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalPatients,
      activePatients,
      newPatients,
      inactivePatients: totalPatients - activePatients
    },
    demographics: {
      genderDistribution,
      ageGroups
    },
    patients: patients.map((p: any) => ({
      patientId: p.patientId,
      name: `${p.firstName} ${p.lastName}`,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      isActive: p.isActive,
      createdAt: p.createdAt
    }))
  };
}

async function generateLabResultsReport(db: any, startDate: Date, endDate: Date) {
  const labResults = await db.collection('labresults').find({
    requestedAt: { $gte: startDate, $lte: endDate }
  }).toArray();

  const totalTests = labResults.length;
  const completedTests = labResults.filter((lr: any) => lr.status === 'COMPLETED').length;
  const pendingTests = labResults.filter((lr: any) => lr.status === 'PENDING').length;
  const inProgressTests = labResults.filter((lr: any) => lr.status === 'IN_PROGRESS').length;
  const cancelledTests = labResults.filter((lr: any) => lr.status === 'CANCELLED').length;

  const testTypeDistribution = labResults.reduce((acc: any, lr: any) => {
    const testType = lr.testType || 'UNKNOWN';
    acc[testType] = (acc[testType] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalTests,
      completedTests,
      pendingTests,
      inProgressTests,
      cancelledTests,
      completionRate: totalTests > 0 ? (completedTests / totalTests) * 100 : 0
    },
    testTypeDistribution,
    labResults: labResults.map((lr: any) => ({
      testId: lr.testId,
      patientName: lr.patientName,
      testType: lr.testType,
      testName: lr.testName,
      status: lr.status,
      requestedAt: lr.requestedAt,
      completedAt: lr.completedAt
    }))
  };
}

async function generateDrugOrdersReport(db: any, startDate: Date, endDate: Date) {
  const drugOrders = await db.collection('drugorders').find({
    orderedAt: { $gte: startDate, $lte: endDate }
  }).toArray();

  const totalOrders = drugOrders.length;
  const dispensedOrders = drugOrders.filter((order: any) => order.status === 'DISPENSED').length;
  const approvedOrders = drugOrders.filter((order: any) => order.status === 'APPROVED').length;
  const pendingOrders = drugOrders.filter((order: any) => order.status === 'PENDING').length;

  const totalValue = drugOrders.reduce((sum: number, order: any) => {
    return sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.totalPrice, 0);
  }, 0);

  return {
    summary: {
      totalOrders,
      dispensedOrders,
      approvedOrders,
      pendingOrders,
      totalValue,
      averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0
    },
    drugOrders: drugOrders.map((order: any) => ({
      orderId: order.orderId,
      patientName: order.patientName,
      status: order.status,
      totalAmount: order.totalAmount,
      orderedAt: order.orderedAt,
      itemsCount: order.items.length
    }))
  };
}

async function generateInventoryReport(db: any, startDate: Date, endDate: Date) {
  const drugs = await db.collection('drugs').find({}).toArray();

  const totalDrugs = drugs.length;
  const inStockDrugs = drugs.filter((d: any) => d.stockQuantity > 10).length;
  const lowStockDrugs = drugs.filter((d: any) => d.stockQuantity <= 10 && d.stockQuantity > 0).length;
  const outOfStockDrugs = drugs.filter((d: any) => d.stockQuantity === 0).length;

  const totalValue = drugs.reduce((sum: number, drug: any) => {
    return sum + (drug.sellingPrice * drug.stockQuantity);
  }, 0);

  const categoryDistribution = drugs.reduce((acc: any, drug: any) => {
    const category = drug.category || 'UNKNOWN';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalDrugs,
      inStockDrugs,
      lowStockDrugs,
      outOfStockDrugs,
      totalValue
    },
    categoryDistribution,
    drugs: drugs.map((d: any) => ({
      drugId: d.drugId,
      name: d.name,
      category: d.category,
      stockQuantity: d.stockQuantity,
      sellingPrice: d.sellingPrice,
      expiryDate: d.expiryDate,
      manufacturer: d.manufacturer
    }))
  };
}



async function generatePaymentsReport(db: any, startDate: Date, endDate: Date) {
  const payments = await db.collection('payments').find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).toArray();

  const totalPayments = payments.length;
  const totalRevenue = payments.reduce((sum: number, payment: any) => {
    return payment.paymentStatus === 'COMPLETED' ? sum + payment.amount : sum;
  }, 0);

  const statusDistribution = payments.reduce((acc: any, payment: any) => {
    const status = payment.paymentStatus || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const methodDistribution = payments.reduce((acc: any, payment: any) => {
    const method = payment.paymentMethod || 'UNKNOWN';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalPayments,
      totalRevenue,
      completedPayments: statusDistribution.COMPLETED || 0,
      pendingPayments: statusDistribution.PENDING || 0,
      failedPayments: statusDistribution.FAILED || 0
    },
    statusDistribution,
    methodDistribution,
    payments: payments.map((p: any) => ({
      paymentId: p.paymentId,
      patientId: p.patientId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentStatus: p.paymentStatus,
      createdAt: p.createdAt
    }))
  };
}

async function generateWalkInServicesReport(db: any, startDate: Date, endDate: Date) {
  const walkInServices = await db.collection('walkinservices').find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).toArray();

  const totalServices = walkInServices.length;
  const totalRevenue = walkInServices.reduce((sum: number, service: any) => {
    return service.paymentStatus === 'COMPLETED' ? sum + service.amount : sum;
  }, 0);

  const serviceTypeDistribution = walkInServices.reduce((acc: any, service: any) => {
    const serviceType = service.serviceType || 'UNKNOWN';
    acc[serviceType] = (acc[serviceType] || 0) + 1;
    return acc;
  }, {});

  const paymentMethodDistribution = walkInServices.reduce((acc: any, service: any) => {
    const method = service.paymentMethod || 'UNKNOWN';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalServices,
      totalRevenue,
      averageServicePrice: totalServices > 0 ? totalRevenue / totalServices : 0,
      completedServices: walkInServices.filter((s: any) => s.paymentStatus === 'COMPLETED').length,
      pendingServices: walkInServices.filter((s: any) => s.paymentStatus === 'PENDING').length
    },
    serviceTypeDistribution,
    paymentMethodDistribution,
    services: walkInServices.map((s: any) => ({
      serviceId: s.serviceId,
      patientName: s.patientName,
      serviceType: s.serviceType,
      amount: s.amount,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      createdAt: s.createdAt
    }))
  };
}

async function generateComprehensiveReport(db: any, startDate: Date, endDate: Date) {
  // Apply date range filters consistently across collections
  const [patients, labResults, drugOrders, drugs, sales, payments, walkInServices] = await Promise.all([
    db.collection('patients').find({ createdAt: { $gte: startDate, $lte: endDate } }).toArray(),
    db.collection('labresults').find({ requestedAt: { $gte: startDate, $lte: endDate } }).toArray(),
    db.collection('drugorders').find({ orderedAt: { $gte: startDate, $lte: endDate } }).toArray(),
    // Inventory is a snapshot; do not date filter
    db.collection('drugs').find({}).toArray(),
    db.collection('sales').find({ createdAt: { $gte: startDate, $lte: endDate } }).toArray(),
    db.collection('payments').find({ createdAt: { $gte: startDate, $lte: endDate } }).toArray(),
    db.collection('walkinservices').find({ createdAt: { $gte: startDate, $lte: endDate } }).toArray()
  ]);

  const paymentsRevenue = payments.reduce((sum: number, p: any) => {
    const status = (p.paymentStatus || '').toString().toUpperCase();
    const amt = Number((p.finalAmount ?? p.amount) || 0);
    return status === 'COMPLETED' ? sum + amt : sum;
  }, 0);
  const salesRevenue = sales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
  const walkInRevenue = walkInServices.reduce((sum: number, s: any) => {
    const status = (s.paymentStatus || '').toString().toUpperCase();
    return status === 'COMPLETED' ? sum + Number(s.amount || 0) : sum;
  }, 0);

  const reportData = {
    overview: {
      totalPatients: patients.length,
      totalLabTests: labResults.length,
      totalDrugOrders: drugOrders.length,
      totalDrugs: drugs.length,
      totalSales: sales.length,
      totalPayments: payments.length,
      totalWalkInServices: walkInServices.length
    },
    financial: {
      // Overall revenue equals completed payments within range
      totalRevenue: paymentsRevenue,
      // Breakdowns
      salesRevenue,
      paymentsRevenue,
      walkInServicesRevenue: walkInRevenue,
      inventoryValue: drugs.reduce((sum: number, d: any) => sum + (Number(d.sellingPrice || 0) * Number(d.stockQuantity || 0)), 0)
    },
    performance: {
      labCompletionRate: labResults.length > 0 ?
        (labResults.filter((lr: any) => lr.status === 'COMPLETED').length / labResults.length) * 100 : 0,
      orderDispenseRate: drugOrders.length > 0 ?
        (drugOrders.filter((order: any) => order.status === 'DISPENSED').length / drugOrders.length) * 100 : 0,
      paymentSuccessRate: payments.length > 0 ?
        (payments.filter((p: any) => p.paymentStatus === 'COMPLETED').length / payments.length) * 100 : 0,
      walkInServicesSuccessRate: walkInServices.length > 0 ?
        (walkInServices.filter((s: any) => s.paymentStatus === 'COMPLETED').length / walkInServices.length) * 100 : 0
    }
  };

  return reportData;
}