'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes';
import { USER_ROLES } from '@/constants/user-roles';

interface SidebarProps {
  userRole: string;
  title?: string;
  userName?: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: '📊',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.NURSE, USER_ROLES.LABORATORIST, USER_ROLES.PHARMACIST],
  },
  {
    name: 'Patients',
    href: ROUTES.PATIENTS,
    icon: '👥',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.NURSE, USER_ROLES.LABORATORIST],
  },
  {
    name: 'Lab Results',
    href: ROUTES.LAB_RESULTS,
    icon: '🔬',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.NURSE, USER_ROLES.LABORATORIST],
  },
  {
    name: 'Drug Orders',
    href: ROUTES.DRUG_ORDERS,
    icon: '💊',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.NURSE, USER_ROLES.PHARMACIST],
  },
  {
    name: 'Sales',
    href: ROUTES.SALES,
    icon: '🧾',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
  },
  {
    name: 'Walk-in Services',
    href: ROUTES.WALK_IN_SERVICES,
    icon: '🏥',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
  },
  {
    name: 'Inventories',
    href: ROUTES.INVENTORIES,
    icon: '📦',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
  },
  {
    name: 'Payments',
    href: ROUTES.PAYMENTS,
    icon: '💳',
    roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.PHARMACIST],
  },
  {
    name: 'Reports',
    href: ROUTES.REPORTS,
    icon: '📈',
    roles: [USER_ROLES.SUPER_ADMIN],
  },
  {
    name: 'Feedback',
    href: ROUTES.FEEDBACK,
    icon: '💬',
    roles: [USER_ROLES.SUPER_ADMIN],
  },
];

export function Sidebar({ userRole, title, userName }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole as any)
  );

  return (
    <div className="fixed left-0 w-24 lg:w-54 flex flex-col bg-card-bg border-r border-border-color z-50" style={{ top: '4rem', height: 'calc(100vh - 3.5rem)' }}>
      
      <nav className="flex-1 space-y-1 px-1 lg:px-4 py-2 overflow-y-auto" style={{ paddingTop:`1.5rem` }}>
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent-color'
              )}
              style={{ 
                color: isActive ? undefined : 'var(--text-primary)'
              }}
              title={item.name}
            >
              <span className="mr-1 lg:mr-3 text-sm lg:text-lg">{item.icon}</span>
              <span className="opacity-0 lg:opacity-100 transition-opacity">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-border-color p-2 lg:p-4 flex-shrink-0 bg-card-bg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-full bg-gray-400 dark:bg-accent-color flex items-center justify-center">
              <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white">
                {userRole.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-2 lg:ml-3">
            <p className="text-xs lg:text-sm font-medium truncate opacity-0 lg:opacity-100 transition-opacity" style={{ color: 'var(--text-primary)' }}>
              {userRole.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 