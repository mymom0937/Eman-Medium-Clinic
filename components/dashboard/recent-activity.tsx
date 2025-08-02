import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface ActivityItem {
  id: string;
  type: 'sale' | 'purchase' | 'patient' | 'service';
  description: string;
  timestamp: string;
  amount?: number;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale':
        return '💰';
      case 'purchase':
        return '📦';
      case 'patient':
        return '👥';
      case 'service':
        return '🏥';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale':
        return 'text-green-600';
      case 'purchase':
        return 'text-blue-600';
      case 'patient':
        return 'text-purple-600';
      case 'service':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className="text-lg">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
              {activity.amount && (
                <div className={cn('text-sm font-medium', getActivityColor(activity.type))}>
                  ${activity.amount.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 