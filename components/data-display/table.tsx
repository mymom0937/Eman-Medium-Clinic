import React from 'react';
import { cn } from '@/utils/cn';

interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function Table<T>({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn('text-center py-8 text-text-muted', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-color">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'text-left py-3 px-4 font-medium text-text-primary',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className={cn(
                'border-b border-border-color hover:bg-card-bg',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('py-3 px-4', column.className)}
                >
                  {column.render
                    ? column.render(item)
                    : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 