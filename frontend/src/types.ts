// TypeScript interfaces that exactly match the data structures in context/api.md

export interface InvoiceSubmissionRequest {
  file: File; // PDF, PNG, JPG only, max 10MB
  metadata?: {
    expectedVendor?: string;
    expectedAmount?: number;
    purchaseOrderNumber?: string;
  };
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productCode?: string;
  lineNumber: number;
}

export interface InvoiceResponse {
  id: string;
  vendorId?: string;
  vendorName?: string;
  invoiceNumber: string;
  invoiceDate?: string; // ISO 8601 date
  dueDate?: string; // ISO 8601 date
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency: string; // ISO 4217 currency code
  status: InvoiceStatus;
  assignedTo?: string; // User ID
  approvedBy?: string; // User ID
  filePath: string;
  extractionConfidence?: ExtractionConfidence;
  lineItems: LineItem[];
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}

export interface ExtractionConfidence {
  vendorName?: FieldConfidence;
  invoiceNumber?: FieldConfidence;
  invoiceDate?: FieldConfidence;
  totalAmount?: FieldConfidence;
  lineItems?: FieldConfidence[];
  overallConfidence: number; // 0-1 scale
}

export interface FieldConfidence {
  value: any;
  confidence: number; // 0-1 scale
}

export interface Vendor {
  id: string;
  name: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Enums
export enum InvoiceStatus {
  PROCESSING = 'processing',
  NEEDS_REVIEW = 'needs_review',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum InvoiceCategory {
  OFFICE_SUPPLIES = 'office_supplies',
  TECHNOLOGY = 'technology',
  CONSULTING = 'consulting',
  UTILITIES = 'utilities',
  TRAVEL = 'travel',
  MARKETING = 'marketing',
  OTHER = 'other'
}

export enum UserRole {
  FINANCE_CLERK = 'finance_clerk',
  FINANCE_MANAGER = 'finance_manager',
  ADMIN = 'admin'
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters?: Record<string, any>;
  };
}

// Request/Response Types for API endpoints
export interface InvoiceUpdateRequest {
  vendorId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency?: string;
  lineItems?: Partial<LineItem>[];
}

export interface ApprovalRequest {
  comments?: string;
}

export interface RejectionRequest {
  reason: string;
  comments?: string;
}

export interface AssignmentRequest {
  userId: string;
}

export interface DashboardMetrics {
  queueCounts: {
    needsReview: number;
    awaitingApproval: number;
    processing: number;
  };
  personalMetrics?: {
    invoicesProcessed: number;
    accuracyRate: number;
    avgProcessingTime: number; // in hours
  };
  teamMetrics?: {
    totalProcessed: number;
    avgAccuracyRate: number;
    avgProcessingTime: number;
    bottlenecks: string[];
  };
}

export interface ProcessingTimeReport {
  averageProcessingTime: number; // in hours
  medianProcessingTime: number;
  timeByStatus: Record<InvoiceStatus, number>;
  trends: Array<{
    period: string;
    avgTime: number;
    count: number;
  }>;
}

export interface AccuracyReport {
  overallAccuracy: number;
  accuracyByField: Record<string, number>;
  lowConfidenceCount: number;
  manualCorrectionRate: number;
}

export interface VendorCreateRequest {
  name: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
}

export interface VendorUpdateRequest {
  name?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
}

// Dashboard Data Types
export interface ClerkDashboardData {
  needsReviewCount: number;
  personalMetrics: {
    invoicesProcessed: number;
    accuracyRate: number;
    avgProcessingTime: number;
  };
  recentInvoices: InvoiceResponse[];
}

export interface ManagerDashboardData {
  awaitingApprovalCount: number;
  teamMetrics: {
    totalProcessed: number;
    avgAccuracyRate: number;
    avgProcessingTime: number;
    bottlenecks: string[];
  };
  recentInvoices: InvoiceResponse[];
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FilterState {
  status?: InvoiceStatus;
  assignedTo?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
