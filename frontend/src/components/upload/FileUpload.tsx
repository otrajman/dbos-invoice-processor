import React, { useState, useRef } from 'react';
import { useMutation } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import { Button, ErrorMessage } from '../ui';
import { UPLOAD_CONFIG, DEMO_INVOICES } from '../../constants';

export interface FileUploadProps {
  onUploadSuccess: (invoiceId: string) => void;
  onNavigate: (path: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, onNavigate }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation((file: File) => apiClient.uploadInvoice(file));

  // Create a proper PDF file for demo uploads
  const createDemoPDF = (demoIndex: number): File => {
    const demo = DEMO_INVOICES[demoIndex];
    
    // Basic PDF structure with invoice content
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(INVOICE) Tj
0 -30 Td
(Invoice #: ${demo.invoiceNumber}) Tj
0 -20 Td
(Vendor: ${demo.vendor}) Tj
0 -20 Td
(Amount: $${demo.amount.toFixed(2)}) Tj
0 -20 Td
(Description: ${demo.description}) Tj
0 -20 Td
(Category: ${demo.category}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000348 00000 n 
0000000565 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
635
%%EOF`;

    return new File([pdfContent], `demo-invoice-${demoIndex + 1}.pdf`, {
      type: 'application/pdf'
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!Object.keys(UPLOAD_CONFIG.ACCEPTED_TYPES).includes(file.type)) {
      alert('Invalid file type. Please select a PDF, PNG, or JPG file.');
      return;
    }

    // Validate file size
    if (file.size > UPLOAD_CONFIG.MAX_SIZE) {
      alert(`File size exceeds ${UPLOAD_CONFIG.MAX_SIZE_MB}MB limit.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const invoice = await uploadMutation.mutate(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess(invoice.id);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDemoUpload = async (demoIndex: number) => {
    const demoFile = createDemoPDF(demoIndex);
    
    try {
      const invoice = await uploadMutation.mutate(demoFile);
      onUploadSuccess(invoice.id);
    } catch (error) {
      console.error('Demo upload failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Invoice</h1>
        <p className="text-gray-600">Upload invoice documents for AI-powered processing</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your invoice here, or{' '}
                <span className="text-blue-600">browse</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports PDF, PNG, JPG files up to {UPLOAD_CONFIG.MAX_SIZE_MB}MB
              </p>
            </div>
          </div>
        </div>

        {/* Selected File */}
        {selectedFile && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleUpload}
                  loading={uploadMutation.loading}
                  variant="primary"
                  size="sm"
                >
                  Upload
                </Button>
                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadMutation.error && (
          <div className="mt-4">
            <ErrorMessage
              message={uploadMutation.error}
              title="Upload Failed"
              variant="error"
              dismissible
              onDismiss={uploadMutation.reset}
            />
          </div>
        )}
      </div>

      {/* Demo Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Demo Invoices</h3>
        <p className="text-sm text-gray-600 mb-4">
          Try the system with these sample invoices to see how AI processing works.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_INVOICES.map((demo, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">{demo.vendor}</h4>
                <p className="text-sm text-gray-600">{demo.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">
                    ${demo.amount.toFixed(2)}
                  </span>
                  <Button
                    onClick={() => handleDemoUpload(index)}
                    loading={uploadMutation.loading}
                    variant="outline"
                    size="sm"
                  >
                    Upload Demo
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">After Upload</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-sm font-medium text-gray-900">View All Invoices</p>
              <p className="text-sm text-gray-500">See all uploaded invoices</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('#dashboard')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">Back to Dashboard</p>
              <p className="text-sm text-gray-500">Return to main dashboard</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
