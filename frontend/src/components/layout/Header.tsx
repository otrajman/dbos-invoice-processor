import React from 'react';
import { UserRole } from '../../types';
import { ROLE_DISPLAY_NAMES } from '../../constants';

export interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900">
                Invoice Processor
              </h1>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value={UserRole.FINANCE_CLERK}>
                  {ROLE_DISPLAY_NAMES[UserRole.FINANCE_CLERK]}
                </option>
                <option value={UserRole.FINANCE_MANAGER}>
                  {ROLE_DISPLAY_NAMES[UserRole.FINANCE_MANAGER]}
                </option>
                <option value={UserRole.ADMIN}>
                  {ROLE_DISPLAY_NAMES[UserRole.ADMIN]}
                </option>
              </select>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {currentRole === UserRole.FINANCE_CLERK ? 'FC' : 
                   currentRole === UserRole.FINANCE_MANAGER ? 'FM' : 'AD'}
                </span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-900">Demo User</div>
                <div className="text-xs text-gray-500">
                  {ROLE_DISPLAY_NAMES[currentRole]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
