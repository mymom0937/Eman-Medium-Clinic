import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sale, SaleItem } from '@/types/sale';
import { formatCurrency } from '@/utils/format';

interface SaleFormProps {
  onSubmit: (data: Partial<Sale>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  availableDrugs?: Array<{ _id: string; name: string; price: number; quantity: number }>;
  patients?: Array<{ _id: string; patientId: string; firstName: string; lastName: string }>;
}

export function SaleForm({ onSubmit, onCancel, isLoading, availableDrugs = [], patients = [] }: SaleFormProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    items: [] as Array<{ drugId: string; drugName: string; quantity: number; unitPrice: number; totalPrice: number }>,
    discount: 0,
    paymentMethod: 'CASH' as const,
  });

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { drugId: '', drugName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Recalculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleDrugSelect = (index: number, drugId: string) => {
    const drug = availableDrugs.find(d => d._id === drugId);
    if (drug) {
      updateItem(index, 'drugId', drugId);
      updateItem(index, 'drugName', drug.name);
      updateItem(index, 'unitPrice', drug.price);
      updateItem(index, 'totalPrice', drug.price);
    }
  };

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p._id === patientId);
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`
      }));
    }
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const finalAmount = totalAmount - formData.discount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    onSubmit({
      ...formData,
      totalAmount,
      finalAmount,
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Sale</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient *
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => handlePatientSelect(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient._id} value={patient._id}>
                  {patient.patientId} - {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Items</h3>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                Add Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drug *
                    </label>
                    <select
                      value={item.drugId}
                      onChange={(e) => handleDrugSelect(index, e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Drug</option>
                      {availableDrugs.map(drug => (
                        <option key={drug._id} value={drug._id}>
                          {drug.name} (${drug.price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-md">
                      {formatCurrency(item.totalPrice)}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => removeItem(index)}
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Final Amount
              </label>
              <div className="px-3 py-2 bg-blue-50 rounded-md font-bold text-blue-600">
                {formatCurrency(finalAmount)}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating Sale...' : 'Create Sale'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 