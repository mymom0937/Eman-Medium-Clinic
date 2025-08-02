import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Drug } from '@/types/drug';
import { formatCurrency } from '@/utils/format';

interface DrugCardProps {
  drug: Drug;
  onEdit?: (drug: Drug) => void;
  onDelete?: (drugId: string) => void;
}

export function DrugCard({ drug, onEdit, onDelete }: DrugCardProps) {
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (quantity <= 10) return { text: 'Low Stock', color: 'text-orange-600' };
    return { text: 'In Stock', color: 'text-green-600' };
  };

  const stockStatus = getStockStatus(drug.quantity);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{drug.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{drug.manufacturer}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(drug.price)}
            </p>
            <p className={`text-sm font-medium ${stockStatus.color}`}>
              {stockStatus.text}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium">{drug.category}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium">{drug.quantity} units</span>
          </div>
          
          {drug.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {drug.description}
            </p>
          )}
          
          {drug.expiryDate && (
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Expiry:</span>
              <span className="font-medium">
                {new Date(drug.expiryDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(drug)}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete?.(drug._id)}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 