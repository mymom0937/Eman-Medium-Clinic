import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/common/badge';
import { Sale } from '@/types/sale';
import { formatCurrency, formatDate } from '@/utils/format';

interface SaleDetailsProps {
  sale: Sale;
  onClose?: () => void;
}

export function SaleDetails({ sale, onClose }: SaleDetailsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return '💵';
      case 'CARD':
        return '💳';
      case 'BANK_TRANSFER':
        return '🏦';
      case 'MOBILE_MONEY':
        return '📱';
      default:
        return '💰';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Sale Details</CardTitle>
            <p className="text-sm text-gray-500">{sale.saleId}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sale Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Sale Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Patient:</span>
                <span className="font-medium">{sale.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Patient ID:</span>
                <span className="font-medium">{sale.patientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sold By:</span>
                <span className="font-medium">{sale.soldBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(sale.soldAt)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={getStatusColor(sale.paymentStatus)} size="sm">
                  {sale.paymentStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium flex items-center gap-1">
                  {getMethodIcon(sale.paymentMethod)}
                  {sale.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium">{formatCurrency(sale.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Final Amount:</span>
                <span className="font-medium text-lg text-green-600">
                  {formatCurrency(sale.finalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Items</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Drug</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Quantity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Unit Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{item.drugName}</div>
                        <div className="text-sm text-gray-500">ID: {item.drugId}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{item.quantity}</td>
                    <td className="py-3 px-4">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Summary</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(sale.finalAmount)}
              </div>
              <div className="text-sm text-gray-500">
                {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 