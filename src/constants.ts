// Invoice Processing Application Constants
// These constants must exactly match the definitions in context/api.md

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
