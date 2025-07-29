// Constants for invoice statuses and categories that exactly match the enums in context/api.md

import { InvoiceStatus, InvoiceCategory, UserRole } from './types';

// Business Logic Constants
export const BUSINESS_RULES = {
  CONFIDENCE_THRESHOLD_AUTO_APPROVAL: 0.95,
  LOW_CONFIDENCE_THRESHOLD: 0.75,
  MAX_PROCESSING_TIME_HOURS: 72,
  DUPLICATE_DETECTION_WINDOW_DAYS: 90,
  MAX_FILE_SIZE_BYTES: 10485760, // 10MB
  ALLOWED_FILE_TYPES: ['pdf', 'png', 'jpg', 'jpeg'],
  MINIMUM_DPI: 150,
  MATH_TOLERANCE: 0.01, // For line item and tax calculations
} as const;

// Error Codes
export const ERROR_CODES = {
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  DUPLICATE_INVOICE: 'DUPLICATE_INVOICE',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  FILE_UPLOADS_PER_MINUTE: 10,
  API_CALLS_PER_MINUTE: 100,
  BULK_OPERATIONS_PER_MINUTE: 5,
} as const;

// Default Values
export const DEFAULTS = {
  CURRENCY: 'USD',
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// Status Display Names
export const STATUS_DISPLAY_NAMES: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PROCESSING]: 'Processing',
  [InvoiceStatus.NEEDS_REVIEW]: 'Needs Review',
  [InvoiceStatus.AWAITING_APPROVAL]: 'Awaiting Approval',
  [InvoiceStatus.APPROVED]: 'Approved',
  [InvoiceStatus.REJECTED]: 'Rejected',
};

// Status Colors for UI
export const STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [InvoiceStatus.NEEDS_REVIEW]: 'bg-yellow-100 text-yellow-800',
  [InvoiceStatus.AWAITING_APPROVAL]: 'bg-orange-100 text-orange-800',
  [InvoiceStatus.APPROVED]: 'bg-green-100 text-green-800',
  [InvoiceStatus.REJECTED]: 'bg-red-100 text-red-800',
};

// Category Display Names
export const CATEGORY_DISPLAY_NAMES: Record<InvoiceCategory, string> = {
  [InvoiceCategory.OFFICE_SUPPLIES]: 'Office Supplies',
  [InvoiceCategory.TECHNOLOGY]: 'Technology',
  [InvoiceCategory.CONSULTING]: 'Consulting',
  [InvoiceCategory.UTILITIES]: 'Utilities',
  [InvoiceCategory.TRAVEL]: 'Travel',
  [InvoiceCategory.MARKETING]: 'Marketing',
  [InvoiceCategory.OTHER]: 'Other',
};

// Role Display Names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.FINANCE_CLERK]: 'Finance Clerk',
  [UserRole.FINANCE_MANAGER]: 'Finance Manager',
  [UserRole.ADMIN]: 'Admin',
};

// Navigation Items
export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '#dashboard' },
  { id: 'upload', label: 'Upload Invoice', href: '#upload' },
  { id: 'all-invoices', label: 'All Invoices', href: '#invoices' },
  { id: 'needs-review', label: 'Needs Review', href: '#invoices?status=needs_review' },
  { id: 'awaiting-approval', label: 'Awaiting Approval', href: '#invoices?status=awaiting_approval' },
  { id: 'rejected', label: 'Rejected Invoices', href: '#invoices?status=rejected' },
  { id: 'reports', label: 'Reports', href: '#reports' },
] as const;

// Demo Invoice Data for Upload Testing
export const DEMO_INVOICES = [
  {
    vendor: 'Office Depot',
    amount: 245.67,
    description: 'Office supplies including paper, pens, and folders',
    invoiceNumber: 'OD-2024-001',
    category: InvoiceCategory.OFFICE_SUPPLIES,
  },
  {
    vendor: 'TechCorp Solutions',
    amount: 1299.99,
    description: 'Software licensing and technical support',
    invoiceNumber: 'TC-2024-456',
    category: InvoiceCategory.TECHNOLOGY,
  },
  {
    vendor: 'Consulting Partners LLC',
    amount: 3500.00,
    description: 'Business process optimization consulting',
    invoiceNumber: 'CP-2024-789',
    category: InvoiceCategory.CONSULTING,
  },
] as const;

// API Base URL - Use relative path for better deployment flexibility
export const API_BASE_URL = '/api';

// File Upload Configuration
export const UPLOAD_CONFIG = {
  ACCEPTED_TYPES: {
    'application/pdf': ['.pdf'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
  },
  MAX_SIZE: BUSINESS_RULES.MAX_FILE_SIZE_BYTES,
  MAX_SIZE_MB: BUSINESS_RULES.MAX_FILE_SIZE_BYTES / (1024 * 1024),
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: DEFAULTS.PAGE_SIZE,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: DEFAULTS.MAX_PAGE_SIZE,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
} as const;

// Confidence Thresholds for UI
export const CONFIDENCE_LEVELS = {
  HIGH: BUSINESS_RULES.CONFIDENCE_THRESHOLD_AUTO_APPROVAL,
  MEDIUM: BUSINESS_RULES.LOW_CONFIDENCE_THRESHOLD,
  LOW: 0,
} as const;

// Confidence Colors for UI
export const CONFIDENCE_COLORS = {
  HIGH: 'text-green-600',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-red-600',
} as const;
