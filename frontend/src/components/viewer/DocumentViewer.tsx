import React, { useState, useEffect } from 'react';
import { InvoiceResponse } from '../../types';
import { apiClient } from '../../services/api';
import { LoadingSpinner } from '../ui';

export interface DocumentViewerProps {
  invoice: InvoiceResponse;
  className?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ invoice, className = '' }) => {
  const [fileError, setFileError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (invoice.filePath) {
      const url = apiClient.getFileUrl(invoice.filePath);
      setFileUrl(url);
      setLoading(false);
    } else {
      setFileError(true);
      setLoading(false);
    }
  }, [invoice.filePath]);

  const handleFileError = () => {
    setFileError(true);
    setLoading(false);
  };

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

  const getFileType = () => {
    if (!invoice.filePath) return null;
    const extension = invoice.filePath.split('.').pop()?.toLowerCase();
    return extension;
  };

  const isPDF = () => {
    const fileType = getFileType();
    return fileType === 'pdf';
  };

  const isImage = () => {
    const fileType = getFileType();
    return ['png', 'jpg', 'jpeg'].includes(fileType || '');
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" text="Loading document..." />
      </div>
    );
  }

  if (fileError || !fileUrl) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Document Not Available</h3>
            <p className="text-gray-600 mb-4">
              This is a demo invoice. The original document file is not available for viewing.
            </p>
          </div>

          {/* Display invoice details even when PDF fails */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-left max-w-md mx-auto">
            <h4 className="font-medium text-gray-900 mb-4 text-center">Invoice Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Invoice #:</span>
                <span className="text-sm text-gray-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Vendor:</span>
                <span className="text-sm text-gray-900">{invoice.vendorName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Amount:</span>
                <span className="text-sm text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Date:</span>
                <span className="text-sm text-gray-900">{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className="text-sm text-gray-900">{invoice.status}</span>
              </div>
              {invoice.subtotal && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                  <span className="text-sm text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
              )}
              {invoice.taxAmount && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Tax:</span>
                  <span className="text-sm text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items if available */}
          {invoice.lineItems && invoice.lineItems.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-left max-w-md mx-auto mt-4">
              <h4 className="font-medium text-gray-900 mb-4 text-center">Line Items</h4>
              <div className="space-y-2">
                {invoice.lineItems.slice(0, 3).map((item, index) => (
                  <div key={item.id || index} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700 truncate mr-2">{item.description}</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </div>
                    {item.quantity && item.unitPrice && (
                      <div className="text-xs text-gray-500">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </div>
                    )}
                  </div>
                ))}
                {invoice.lineItems.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    ... and {invoice.lineItems.length - 3} more items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {isPDF() ? (
        <iframe
          src={fileUrl}
          className="w-full h-full min-h-[600px]"
          title="Invoice Document"
          onError={handleFileError}
        />
      ) : isImage() ? (
        <div className="p-4">
          <img
            src={fileUrl}
            alt="Invoice Document"
            className="max-w-full h-auto mx-auto"
            onError={handleFileError}
          />
        </div>
      ) : (
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unsupported File Type</h3>
          <p className="text-gray-600 mb-4">
            This file type cannot be previewed in the browser.
          </p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download File
          </a>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
