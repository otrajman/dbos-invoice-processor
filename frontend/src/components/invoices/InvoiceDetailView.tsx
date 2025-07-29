import React, { useState, useCallback } from 'react';
import { InvoiceStatus, UserRole } from '../../types';
import { useApi, useMutation } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import { LoadingSpinner, ErrorMessage, StatusBadge, Button } from '../ui';

export interface InvoiceDetailViewProps {
  invoiceId: string;
  currentRole: UserRole;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoiceId,
  currentRole,
  onBack,
  onNavigate,
}) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionComments, setRejectionComments] = useState('');

  // Memoize API call to prevent infinite re-renders
  const getInvoiceById = useCallback(() => apiClient.getInvoiceById(invoiceId), [invoiceId]);

  // Fetch invoice details
  const {
    data: invoice,
    loading,
    error,
    refetch,
  } = useApi(getInvoiceById);

  // Mutations for workflow actions
  const submitForApproval = useMutation((id: string) =>
    apiClient.submitForApproval(id)
  );

  const approveInvoice = useMutation(({ id, comments }: { id: string; comments?: string }) =>
    apiClient.approveInvoice(id, { comments })
  );

  const rejectInvoice = useMutation(({ id, reason, comments }: { id: string; reason: string; comments?: string }) =>
    apiClient.rejectInvoice(id, { reason, comments })
  );

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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval.mutate(invoiceId);
      refetch();
    } catch (error) {
      console.error('Failed to submit for approval:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await approveInvoice.mutate({ id: invoiceId, comments: approvalComments });
      setShowApprovalModal(false);
      setApprovalComments('');
      refetch();
    } catch (error) {
      console.error('Failed to approve invoice:', error);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      return;
    }
    
    try {
      await rejectInvoice.mutate({
        id: invoiceId,
        reason: rejectionReason,
        comments: rejectionComments,
      });
      setShowRejectionModal(false);
      setRejectionReason('');
      setRejectionComments('');
      refetch();
    } catch (error) {
      console.error('Failed to reject invoice:', error);
    }
  };

  const canSubmitForApproval = () => {
    return (
      invoice?.status === InvoiceStatus.NEEDS_REVIEW &&
      (currentRole === UserRole.FINANCE_CLERK || currentRole === UserRole.ADMIN)
    );
  };

  const canApproveOrReject = () => {
    return (
      invoice?.status === InvoiceStatus.AWAITING_APPROVAL &&
      (currentRole === UserRole.FINANCE_MANAGER || currentRole === UserRole.ADMIN)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading invoice details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button onClick={onBack} variant="outline" size="sm">
          ← Back to List
        </Button>
        <ErrorMessage
          message={error}
          title="Failed to load invoice"
          variant="error"
        />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Button onClick={onBack} variant="outline" size="sm">
          ← Back to List
        </Button>
        <ErrorMessage
          message="Invoice not found"
          title="Invoice Not Found"
          variant="error"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            ← Back to List
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <p className="text-gray-600">
              {invoice.vendorName || 'Unknown Vendor'}
            </p>
          </div>
        </div>
        <StatusBadge status={invoice.status} size="lg" />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {canSubmitForApproval() && (
          <Button
            onClick={handleSubmitForApproval}
            loading={submitForApproval.loading}
            variant="primary"
          >
            Submit for Approval
          </Button>
        )}
        
        {canApproveOrReject() && (
          <>
            <Button
              onClick={() => setShowApprovalModal(true)}
              variant="success"
            >
              Approve
            </Button>
            <Button
              onClick={() => setShowRejectionModal(true)}
              variant="danger"
            >
              Reject
            </Button>
          </>
        )}
      </div>

      {/* Error Messages for Actions */}
      {submitForApproval.error && (
        <ErrorMessage
          message={submitForApproval.error}
          title="Failed to submit for approval"
          variant="error"
          dismissible
          onDismiss={submitForApproval.reset}
        />
      )}
      
      {approveInvoice.error && (
        <ErrorMessage
          message={approveInvoice.error}
          title="Failed to approve invoice"
          variant="error"
          dismissible
          onDismiss={approveInvoice.reset}
        />
      )}
      
      {rejectInvoice.error && (
        <ErrorMessage
          message={rejectInvoice.error}
          title="Failed to reject invoice"
          variant="error"
          dismissible
          onDismiss={rejectInvoice.reset}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Viewer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Document</h3>
          <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
            {invoice.filePath ? (
              <iframe
                src={apiClient.getFileUrl(invoice.filePath)}
                className="w-full h-full rounded-lg"
                title="Invoice Document"
              />
            ) : (
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No document available</p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                <p className="mt-1 text-sm text-gray-900">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <StatusBadge status={invoice.status} size="sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <p className="mt-1 text-sm text-gray-900">{invoice.currency}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(invoice.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Subtotal</span>
                <span className="text-sm text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Tax Amount</span>
                <span className="text-sm text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total Amount</span>
                  <span className="text-base font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Invoice</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to approve this invoice? This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any comments about this approval..."
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleApprove}
                  loading={approveInvoice.loading}
                  variant="success"
                  className="flex-1"
                >
                  Approve Invoice
                </Button>
                <Button
                  onClick={() => setShowApprovalModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Invoice</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this invoice.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a reason...</option>
                  <option value="Invalid vendor">Invalid vendor</option>
                  <option value="Incorrect amount">Incorrect amount</option>
                  <option value="Missing documentation">Missing documentation</option>
                  <option value="Duplicate invoice">Duplicate invoice</option>
                  <option value="Unauthorized purchase">Unauthorized purchase</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments
                </label>
                <textarea
                  value={rejectionComments}
                  onChange={(e) => setRejectionComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide additional details about the rejection..."
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleReject}
                  loading={rejectInvoice.loading}
                  variant="danger"
                  className="flex-1"
                  disabled={!rejectionReason.trim()}
                >
                  Reject Invoice
                </Button>
                <Button
                  onClick={() => setShowRejectionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailView;
