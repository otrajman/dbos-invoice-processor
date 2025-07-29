import React, { useEffect, useCallback } from 'react';
import { InvoiceStatus } from '../../types';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import { LoadingSpinner, ErrorMessage } from '../ui';
import InvoiceQueue from './InvoiceQueue';

export interface ManagerDashboardProps {
  onNavigate: (path: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate }) => {
  // Memoize API calls to prevent infinite re-renders
  const getManagerDashboard = useCallback(() => apiClient.getManagerDashboard(), []);
  const getAwaitingApprovalQueue = useCallback(() => apiClient.getInvoiceQueue(InvoiceStatus.AWAITING_APPROVAL, { limit: 10 }), []);

  // Fetch manager dashboard data
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useApi(getManagerDashboard);

  // Fetch awaiting approval invoices for the queue
  const {
    data: awaitingApprovalData,
    loading: awaitingApprovalLoading,
    error: awaitingApprovalError,
    refetch: refetchAwaitingApproval,
  } = useApi(getAwaitingApprovalQueue);

  // Listen for role changes to refresh data
  useEffect(() => {
    const handleRoleChange = () => {
      refetchDashboard();
      refetchAwaitingApproval();
    };

    window.addEventListener('roleChanged', handleRoleChange);
    return () => window.removeEventListener('roleChanged', handleRoleChange);
  }, [refetchDashboard, refetchAwaitingApproval]);

  const handleViewAllAwaitingApproval = () => {
    onNavigate('#invoices?status=awaiting_approval');
  };

  const handleViewInvoice = (invoiceId: string) => {
    onNavigate(`#invoice/${invoiceId}`);
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <ErrorMessage
        message={dashboardError}
        title="Failed to load dashboard"
        variant="error"
      />
    );
  }

  const awaitingApprovalInvoices = awaitingApprovalData?.invoices || [];
  const awaitingApprovalCount = dashboardData?.awaitingApprovalCount || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance Manager Dashboard</h1>
        <p className="text-gray-600">Review and approve invoices ready for processing</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Awaiting Approval Count */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Awaiting Approval</p>
              <p className="text-2xl font-bold text-gray-900">{awaitingApprovalCount}</p>
            </div>
          </div>
        </div>

        {/* Team Metrics */}
        {dashboardData?.teamMetrics && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Processed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.teamMetrics.totalProcessed}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(dashboardData.teamMetrics.avgAccuracyRate * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Awaiting Approval Queue */}
      <InvoiceQueue
        title="Invoices Awaiting Approval"
        status={InvoiceStatus.AWAITING_APPROVAL}
        invoices={awaitingApprovalInvoices}
        count={awaitingApprovalCount}
        loading={awaitingApprovalLoading}
        onViewAll={handleViewAllAwaitingApproval}
        onViewInvoice={handleViewInvoice}
      />

      {awaitingApprovalError && (
        <ErrorMessage
          message={awaitingApprovalError}
          title="Failed to load awaiting approval queue"
          variant="warning"
        />
      )}

      {/* Team Performance */}
      {dashboardData?.teamMetrics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Average Processing Time</h4>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.teamMetrics.avgProcessingTime.toFixed(1)} hours
              </p>
            </div>
            
            {dashboardData.teamMetrics.bottlenecks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Bottlenecks</h4>
                <div className="space-y-1">
                  {dashboardData.teamMetrics.bottlenecks.map((bottleneck, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full mr-2"
                    >
                      {bottleneck}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('#invoices?status=awaiting_approval')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">Review Approvals</p>
              <p className="text-sm text-gray-500">Process pending approvals</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('#invoices')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">All Invoices</p>
              <p className="text-sm text-gray-500">View complete invoice list</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('#reports')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">View Reports</p>
              <p className="text-sm text-gray-500">Analytics and insights</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
