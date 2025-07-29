import React, { useState, useEffect, useCallback } from 'react';
import { InvoiceResponse, InvoiceStatus, FilterState } from '../../types';
import { useFilteredApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import { LoadingSpinner, ErrorMessage, StatusBadge, Button } from '../ui';
import { STATUS_DISPLAY_NAMES, PAGINATION_CONFIG } from '../../constants';

export interface InvoiceListViewProps {
  initialFilters?: Partial<FilterState>;
  onViewInvoice: (invoiceId: string) => void;
}

const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  initialFilters = {},
  onViewInvoice,
}) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

  // Combine filters with pagination
  const defaultFilters: FilterState & { page: number; limit: number } = {
    page,
    limit,
    ...initialFilters,
  };

  // Memoize API call to prevent infinite re-renders
  const getInvoices = useCallback((filters: any) => apiClient.getInvoices(filters), []);

  const {
    data: invoiceData,
    loading,
    error,
    filters,
    setFilters,
    refetch,
  } = useFilteredApi(
    getInvoices,
    defaultFilters
  );

  // Update page in filters when page state changes
  useEffect(() => {
    setFilters({ page, limit });
  }, [page, limit, setFilters]);

  const invoices = invoiceData?.invoices || [];
  const pagination = invoiceData?.pagination;

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setPage(1); // Reset to first page when filters change
    setFilters({ ...newFilters, page: 1 });
  };

  const handleSearch = (searchTerm: string) => {
    handleFilterChange({ search: searchTerm });
  };

  const handleStatusFilter = (status?: InvoiceStatus) => {
    handleFilterChange({ status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">
            {pagination ? `${pagination.total} total invoices` : 'Loading...'}
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Invoice number, vendor name..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value as InvoiceStatus || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.values(InvoiceStatus).map((status) => (
                <option key={status} value={status}>
                  {STATUS_DISPLAY_NAMES[status]}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading invoices..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorMessage
          message={error}
          title="Failed to load invoices"
          variant="error"
        />
      )}

      {/* Invoice List */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div>Invoice #</div>
                  <div>Vendor</div>
                  <div>Amount</div>
                  <div>Date</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onViewInvoice(invoice.id)}
                  >
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-sm text-gray-900">
                        {invoice.vendorName || 'Unknown Vendor'}
                      </div>
                      <div className="text-sm text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(invoice.invoiceDate)}
                      </div>
                      <div>
                        <StatusBadge status={invoice.status} size="sm" />
                      </div>
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewInvoice(invoice.id);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setPage(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceListView;
