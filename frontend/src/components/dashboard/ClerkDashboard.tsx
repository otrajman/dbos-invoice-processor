import React, { useEffect, useCallback } from 'react';
import { InvoiceStatus } from '../../types';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import { LoadingSpinner, ErrorMessage } from '../ui';
import InvoiceQueue from './InvoiceQueue';

export interface ClerkDashboardProps {
  onNavigate: (path: string) => void;
}

const ClerkDashboard: React.FC<ClerkDashboardProps> = ({ onNavigate }) => {
  // Memoize API calls to prevent infinite re-renders
  const getClerkDashboard = useCallback(() => apiClient.getClerkDashboard(), []);
  const getNeedsReviewQueue = useCallback(() => apiClient.getInvoiceQueue(InvoiceStatus.NEEDS_REVIEW, { limit: 10 }), []);

  // Fetch clerk dashboard data
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useApi(getClerkDashboard);

  // Fetch needs review invoices for the queue
  const {
    data: needsReviewData,
    loading: needsReviewLoading,
    error: needsReviewError,
    refetch: refetchNeedsReview,
  } = useApi(getNeedsReviewQueue);

  // Listen for role changes to refresh data
  useEffect(() => {
    const handleRoleChange = () => {
      refetchDashboard();
      refetchNeedsReview();
    };

    window.addEventListener('roleChanged', handleRoleChange);
    return () => window.removeEventListener('roleChanged', handleRoleChange);
  }, [refetchDashboard, refetchNeedsReview]);

  const handleViewAllNeedsReview = () => {
    onNavigate('#invoices?status=needs_review');
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

  const needsReviewInvoices = needsReviewData?.invoices || [];
  const needsReviewCount = dashboardData?.needsReviewCount || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance Clerk Dashboard</h1>
        <p className="text-gray-600">Review and process invoices requiring manual attention</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Needs Review Count */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Needs Review</p>
              <p className="text-2xl font-bold text-gray-900">{needsReviewCount}</p>
            </div>
          </div>
        </div>

        {/* Personal Metrics */}
        {dashboardData?.personalMetrics && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Processed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.personalMetrics.invoicesProcessed}
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
                  <p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(dashboardData.personalMetrics.accuracyRate * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Needs Review Queue */}
      <InvoiceQueue
        title="Invoices Needing Review"
        status={InvoiceStatus.NEEDS_REVIEW}
        invoices={needsReviewInvoices}
        count={needsReviewCount}
        loading={needsReviewLoading}
        onViewAll={handleViewAllNeedsReview}
        onViewInvoice={handleViewInvoice}
      />

      {needsReviewError && (
        <ErrorMessage
          message={needsReviewError}
          title="Failed to load needs review queue"
          variant="warning"
        />
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('#upload')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">Upload Invoice</p>
              <p className="text-sm text-gray-500">Add new invoice for processing</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('#invoices')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">View All Invoices</p>
              <p className="text-sm text-gray-500">Browse all invoices in the system</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClerkDashboard;
