import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/config/connection';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const db = (await import('mongoose')).connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const { reportData, reportMeta, format } = await request.json();

    if (!reportData || !format) {
      return NextResponse.json(
        { success: false, error: 'Missing required data for export' },
        { status: 400 }
      );
    }

    let exportContent: Buffer;
    let filename: string;
    let contentType: string;

    const timestamp = new Date().toISOString().split('T')[0];
    const reportType = reportMeta?.reportType || 'report';

    switch (format.toLowerCase()) {
      case 'csv':
        exportContent = Buffer.from(generateCSV(reportData, reportMeta));
        filename = `${reportType}_${timestamp}.csv`;
        contentType = 'text/csv';
        break;
      
      case 'excel':
        exportContent = generateExcel(reportData, reportMeta);
        filename = `${reportType}_${timestamp}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      
      case 'pdf':
        exportContent = generatePDF(reportData, reportMeta);
        filename = `${reportType}_${timestamp}.pdf`;
        contentType = 'application/pdf';
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported export format' },
          { status: 400 }
        );
    }

    // Create response with file content
    const response = new NextResponse(exportContent);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    return response;

  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

function generateCSV(reportData: any, reportMeta: any): string {
  let csvContent = '';

  // Add report metadata
  csvContent += 'Report Information\n';
  csvContent += `Report Type,${reportMeta?.reportType || 'N/A'}\n`;
  csvContent += `Date Range,${reportMeta?.dateRange || 'N/A'}\n`;
  csvContent += `Generated At,${reportMeta?.generatedAt || 'N/A'}\n`;
  csvContent += '\n';

  // Add summary data
  if (reportData.summary) {
    csvContent += 'Summary\n';
    Object.entries(reportData.summary).forEach(([key, value]) => {
      csvContent += `${key},${value}\n`;
    });
    csvContent += '\n';
  }

  // Add overview data
  if (reportData.overview) {
    csvContent += 'Overview\n';
    Object.entries(reportData.overview).forEach(([key, value]) => {
      csvContent += `${key},${value}\n`;
    });
    csvContent += '\n';
  }

  // Add financial data
  if (reportData.financial) {
    csvContent += 'Financial Summary\n';
    Object.entries(reportData.financial).forEach(([key, value]) => {
      csvContent += `${key},${value}\n`;
    });
    csvContent += '\n';
  }

  // Add performance data
  if (reportData.performance) {
    csvContent += 'Performance Metrics\n';
    Object.entries(reportData.performance).forEach(([key, value]) => {
      csvContent += `${key},${value}%\n`;
    });
    csvContent += '\n';
  }

  // Add detailed data tables
  if (reportData.patients) {
    csvContent += 'Patients\n';
    csvContent += 'Patient ID,Name,Age,Gender,Phone,Status,Created At\n';
    reportData.patients.forEach((patient: any) => {
      csvContent += `${patient.patientId},"${patient.name}",${patient.age},${patient.gender},${patient.phone},${patient.isActive},${patient.createdAt}\n`;
    });
    csvContent += '\n';
  }

  if (reportData.sales) {
    csvContent += 'Sales\n';
    csvContent += 'Sale ID,Patient Name,Total Amount,Final Amount,Payment Method,Status,Sold At\n';
    reportData.sales.forEach((sale: any) => {
      csvContent += `${sale.saleId},"${sale.patientName}",${sale.totalAmount},${sale.finalAmount},${sale.paymentMethod},${sale.status},${sale.soldAt}\n`;
    });
    csvContent += '\n';
  }

  if (reportData.payments) {
    csvContent += 'Payments\n';
    csvContent += 'Payment ID,Patient ID,Amount,Payment Method,Status,Created At\n';
    reportData.payments.forEach((payment: any) => {
      csvContent += `${payment.paymentId},${payment.patientId},${payment.amount},${payment.paymentMethod},${payment.paymentStatus},${payment.createdAt}\n`;
    });
    csvContent += '\n';
  }

  return csvContent;
}

function generateExcel(reportData: any, reportMeta: any): Buffer {
  // Create a workbook with multiple sheets
  const workbook = XLSX.utils.book_new();

  // Create metadata sheet
  const metadataSheet = [
    ['Report Information'],
    ['Report Type', reportMeta?.reportType || 'N/A'],
    ['Date Range', reportMeta?.dateRange || 'N/A'],
    ['Generated At', reportMeta?.generatedAt || 'N/A'],
    [],
    ['Summary'],
    ['Metric', 'Value']
  ];

  // Add summary data
  if (reportData.summary) {
    Object.entries(reportData.summary).forEach(([key, value]) => {
      metadataSheet.push([key, value]);
    });
  }

  metadataSheet.push([]);
  metadataSheet.push(['Overview']);
  metadataSheet.push(['Metric', 'Value']);

  // Add overview data
  if (reportData.overview) {
    Object.entries(reportData.overview).forEach(([key, value]) => {
      metadataSheet.push([key, value]);
    });
  }

  metadataSheet.push([]);
  metadataSheet.push(['Financial Summary']);
  metadataSheet.push(['Metric', 'Value']);

  // Add financial data
  if (reportData.financial) {
    Object.entries(reportData.financial).forEach(([key, value]) => {
      metadataSheet.push([key, value]);
    });
  }

  metadataSheet.push([]);
  metadataSheet.push(['Performance Metrics']);
  metadataSheet.push(['Metric', 'Value (%)']);

  // Add performance data
  if (reportData.performance) {
    Object.entries(reportData.performance).forEach(([key, value]) => {
      metadataSheet.push([key, `${value}%`]);
    });
  }

  const metadataWorksheet = XLSX.utils.aoa_to_sheet(metadataSheet);
  XLSX.utils.book_append_sheet(workbook, metadataWorksheet, 'Report Summary');

  // Create detailed data sheets
  if (reportData.patients && reportData.patients.length > 0) {
    const patientsData = [
      ['Patient ID', 'Name', 'Age', 'Gender', 'Phone', 'Status', 'Created At']
    ];
    
    reportData.patients.forEach((patient: any) => {
      patientsData.push([
        patient.patientId,
        patient.name,
        patient.age,
        patient.gender,
        patient.phone,
        patient.isActive ? 'Active' : 'Inactive',
        patient.createdAt
      ]);
    });

    const patientsWorksheet = XLSX.utils.aoa_to_sheet(patientsData);
    XLSX.utils.book_append_sheet(workbook, patientsWorksheet, 'Patients');
  }

  if (reportData.sales && reportData.sales.length > 0) {
    const salesData = [
      ['Sale ID', 'Patient Name', 'Total Amount', 'Final Amount', 'Payment Method', 'Status', 'Sold At']
    ];
    
    reportData.sales.forEach((sale: any) => {
      salesData.push([
        sale.saleId,
        sale.patientName,
        sale.totalAmount,
        sale.finalAmount,
        sale.paymentMethod,
        sale.status,
        sale.soldAt
      ]);
    });

    const salesWorksheet = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesWorksheet, 'Sales');
  }

  if (reportData.payments && reportData.payments.length > 0) {
    const paymentsData = [
      ['Payment ID', 'Patient ID', 'Amount', 'Payment Method', 'Status', 'Created At']
    ];
    
    reportData.payments.forEach((payment: any) => {
      paymentsData.push([
        payment.paymentId,
        payment.patientId,
        payment.amount,
        payment.paymentMethod,
        payment.paymentStatus,
        payment.createdAt
      ]);
    });

    const paymentsWorksheet = XLSX.utils.aoa_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(workbook, paymentsWorksheet, 'Payments');
  }

  // Write to buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function generatePDF(reportData: any, reportMeta: any): Buffer {
  // Create a new PDF document
  const doc = new jsPDF();
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Set font styles
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(`${reportMeta?.reportType || 'Report'} - ${reportMeta?.dateRange || 'Period'}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${reportMeta?.generatedAt || 'N/A'}`, margin, yPosition);
  yPosition += 10;
  doc.text(`Date Range: ${reportMeta?.dateRange || 'N/A'}`, margin, yPosition);
  yPosition += 20;

  // Add summary data
  if (reportData.summary) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('SUMMARY', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    Object.entries(reportData.summary).forEach(([key, value]) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${key}: ${value}`, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 10;
  }

  // Add overview data
  if (reportData.overview) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('OVERVIEW', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    Object.entries(reportData.overview).forEach(([key, value]) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${key}: ${value}`, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 10;
  }

  // Add financial data
  if (reportData.financial) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('FINANCIAL SUMMARY', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    Object.entries(reportData.financial).forEach(([key, value]) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${key}: ${value}`, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 10;
  }

  // Add performance data
  if (reportData.performance) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PERFORMANCE METRICS', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    Object.entries(reportData.performance).forEach(([key, value]) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${key}: ${value}%`, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 10;
  }

  // Add detailed data tables
  if (reportData.patients && reportData.patients.length > 0) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PATIENTS', margin, yPosition);
    yPosition += 10;
    
    // Create table headers
    const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Status'];
    const colWidths = [30, 50, 20, 25, 25];
    let xPos = margin;
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    headers.forEach((header, index) => {
      doc.text(header, xPos, yPosition);
      xPos += colWidths[index];
    });
    yPosition += 5;
    
    // Add table data
    doc.setFont(undefined, 'normal');
    reportData.patients.forEach((patient: any) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      xPos = margin;
      doc.text(patient.patientId, xPos, yPosition);
      xPos += colWidths[0];
      doc.text(patient.name, xPos, yPosition);
      xPos += colWidths[1];
      doc.text(patient.age.toString(), xPos, yPosition);
      xPos += colWidths[2];
      doc.text(patient.gender, xPos, yPosition);
      xPos += colWidths[3];
      doc.text(patient.isActive ? 'Active' : 'Inactive', xPos, yPosition);
      
      yPosition += 5;
    });
    yPosition += 10;
  }

  if (reportData.sales && reportData.sales.length > 0) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('SALES', margin, yPosition);
    yPosition += 10;
    
    // Create table headers
    const headers = ['Sale ID', 'Patient', 'Amount', 'Status'];
    const colWidths = [30, 50, 30, 30];
    let xPos = margin;
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    headers.forEach((header, index) => {
      doc.text(header, xPos, yPosition);
      xPos += colWidths[index];
    });
    yPosition += 5;
    
    // Add table data
    doc.setFont(undefined, 'normal');
    reportData.sales.forEach((sale: any) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      xPos = margin;
      doc.text(sale.saleId, xPos, yPosition);
      xPos += colWidths[0];
      doc.text(sale.patientName, xPos, yPosition);
      xPos += colWidths[1];
      doc.text(sale.finalAmount.toString(), xPos, yPosition);
      xPos += colWidths[2];
      doc.text(sale.status, xPos, yPosition);
      
      yPosition += 5;
    });
  }

  // Return PDF as buffer
  return Buffer.from(doc.output('arraybuffer'));
} 