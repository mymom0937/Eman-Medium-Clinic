export const REPORT_TYPES = [
  { value: 'comprehensive', label: 'Comprehensive Report', description: 'Complete overview of all clinic operations' },
  { value: 'patients', label: 'Patients Report', description: 'Patient demographics and statistics' },
  { value: 'lab-results', label: 'Lab Requests & Results Report', description: 'Laboratory test requests, results, and completion rates' },
  { value: 'drug-orders', label: 'Drug Orders Report', description: 'Prescription and dispensing statistics' },
  { value: 'inventories', label: 'Inventory Report', description: 'Drug inventory levels and stock management' },
  { value: 'sales', label: 'Sales Report', description: 'Pharmacy sales and revenue statistics' },
  { value: 'payments', label: 'Payments Report', description: 'Payment processing and financial transactions' },
  { value: 'walk-in-services', label: 'Walk-in Services Report', description: 'Quick services and direct patient care' },
];

export const DATE_RANGES = [
  { value: 'today', label: 'Today', description: 'Current day data' },
  { value: 'week', label: 'This Week', description: 'Current week data' },
  { value: 'month', label: 'This Month', description: 'Current month data' },
  { value: 'quarter', label: 'This Quarter', description: 'Current quarter data' },
  { value: 'year', label: 'This Year', description: 'Current year data' },
  { value: 'custom', label: 'Custom Range', description: 'Select specific date range' },
];

export const SCHEDULE_FREQUENCIES = [
  { value: 'daily', label: 'Daily', description: 'Generate report every day' },
  { value: 'weekly', label: 'Weekly', description: 'Generate report every week' },
  { value: 'monthly', label: 'Monthly', description: 'Generate report every month' },
  { value: 'yearly', label: 'Yearly', description: 'Generate report every year' },
];

export const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF', description: 'Portable Document Format' },
  { value: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
  { value: 'csv', label: 'CSV', description: 'Comma Separated Values' },
];

export type ReportType = typeof REPORT_TYPES[number]['value'];
export type DateRange = typeof DATE_RANGES[number]['value'];
export type ScheduleFrequency = typeof SCHEDULE_FREQUENCIES[number]['value'];
export type ExportFormat = typeof EXPORT_FORMATS[number]['value']; 