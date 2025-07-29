import React from 'react';
import { InvoiceResponse, InvoiceStatus } from '../../types';
import { StatusBadge } from '../ui';

export interface InvoiceQueueProps {
  title: string;
  status: InvoiceStatus;
  invoices: InvoiceResponse[];
  count: number;
  loading?: boolean;
  onViewAll: () => void;
  onViewInvoice: (invoiceId: string) => void;
}

const InvoiceQueue: React.FC<InvoiceQueueProps> = ({
  title,
  status,
  invoices,
  count,
  loading = false,
  onViewAll,
  onViewInvoice,
}) => {
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

  const getQueueIcon = () => {
    switch (status) {
      case InvoiceStatus.NEEDS_REVIEW:
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case InvoiceStatus.AWAITING_APPROVAL:
        return (
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case InvoiceStatus.PROCESSING:
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getQueueIcon()}
            <div>
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">
                {count} {count === 1 ? 'invoice' : 'invoices'}
              </p>
            </div>
          </div>
          <button
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No invoices in this queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => onViewInvoice(invoice.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {invoice.vendorName || 'Unknown Vendor'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Invoice #{invoice.invoiceNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(invoice.invoiceDate)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <StatusBadge status={invoice.status} size="sm" />
                </div>
              </div>
            ))}
            
            {invoices.length > 5 && (
              <div className="text-center pt-3">
                <button
                  onClick={onViewAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View {invoices.length - 5} more invoices
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceQueue;
