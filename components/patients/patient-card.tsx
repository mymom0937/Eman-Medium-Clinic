import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/badge';
import { Patient } from '@/types/patient';
import { formatDate } from '@/utils/format';

interface PatientCardProps {
  patient: Patient;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
  onView?: (patient: Patient) => void;
}

export function PatientCard({ patient, onEdit, onDelete, onView }: PatientCardProps) {
  const age = patient.dateOfBirth
    ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {patient.firstName} {patient.lastName}
            </CardTitle>
            <p className="text-sm text-gray-500">{patient.patientId}</p>
          </div>
          <div className="flex space-x-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(patient)}>
                View
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(patient)}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(patient._id)}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Phone:</span>
            <p className="text-gray-600">{patient.phone}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <p className="text-gray-600">{patient.email || '-'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Age:</span>
            <p className="text-gray-600">{age || '-'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Gender:</span>
            <p className="text-gray-600">{patient.gender || '-'}</p>
          </div>
        </div>

        {patient.address && (
          <div>
            <span className="font-medium text-gray-700 text-sm">Address:</span>
            <p className="text-gray-600 text-sm">{patient.address}</p>
          </div>
        )}

        {patient.emergencyContact && (
          <div>
            <span className="font-medium text-gray-700 text-sm">Emergency Contact:</span>
            <p className="text-gray-600 text-sm">{patient.emergencyContact}</p>
          </div>
        )}

        {patient.allergies && patient.allergies.length > 0 && (
          <div>
            <span className="font-medium text-gray-700 text-sm">Allergies:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {patient.allergies.map((allergy, index) => (
                <Badge key={index} variant="warning" size="sm">
                  {allergy}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {patient.medicalHistory && (
          <div>
            <span className="font-medium text-gray-700 text-sm">Medical History:</span>
            <p className="text-gray-600 text-sm line-clamp-2">{patient.medicalHistory}</p>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Registered: {formatDate(patient.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 