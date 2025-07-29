# Invoice Processing API Specification

## Core Data Types

### InvoiceSubmissionRequest
```typescript
interface InvoiceSubmissionRequest {
  file: File; // PDF, PNG, JPG only, max 10MB
  metadata?: {
    expectedVendor?: string;
    expectedAmount?: number;
    purchaseOrderNumber?: string;
  };
}
```

### LineItem
```typescript
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productCode?: string;
  lineNumber: number;
}
```

### InvoiceResponse
```typescript
interface InvoiceResponse {
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
```

### ExtractionConfidence
```typescript
interface ExtractionConfidence {
  vendorName?: FieldConfidence;
  invoiceNumber?: FieldConfidence;
  invoiceDate?: FieldConfidence;
  totalAmount?: FieldConfidence;
  lineItems?: FieldConfidence[];
  overallConfidence: number; // 0-1 scale
}

interface FieldConfidence {
  value: any;
  confidence: number; // 0-1 scale
}
```

### Vendor
```typescript
interface Vendor {
  id: string;
  name: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
```

## Enums

### InvoiceStatus
```typescript
enum InvoiceStatus {
  PROCESSING = 'processing',
  NEEDS_REVIEW = 'needs_review',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}
```

### InvoiceCategory
```typescript
enum InvoiceCategory {
  OFFICE_SUPPLIES = 'office_supplies',
  TECHNOLOGY = 'technology',
  CONSULTING = 'consulting',
  UTILITIES = 'utilities',
  TRAVEL = 'travel',
  MARKETING = 'marketing',
  OTHER = 'other'
}
```

### UserRole
```typescript
enum UserRole {
  FINANCE_CLERK = 'finance_clerk',
  FINANCE_MANAGER = 'finance_manager',
  ADMIN = 'admin'
}
```

## API Response Wrapper

### ApiResponse
```typescript
interface ApiResponse<T> {
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
```

## API Endpoints

### Invoice Management

#### POST /api/invoices/upload
Upload new invoice files for processing.

**Request:**
- Content-Type: multipart/form-data
- Body: InvoiceSubmissionRequest

**Response:**
- 201 Created: ApiResponse<InvoiceResponse>
- 400 Bad Request: Invalid file format or size
- 413 Payload Too Large: File exceeds 10MB limit

#### GET /api/invoices
List invoices with filtering and pagination.

**Query Parameters:**
- page?: number (default: 1)
- limit?: number (default: 20, max: 100)
- status?: InvoiceStatus
- assignedTo?: string (user ID)
- vendorId?: string
- dateFrom?: string (ISO 8601 date)
- dateTo?: string (ISO 8601 date)
- search?: string (searches invoice number, vendor name)

**Response:**
- 200 OK: ApiResponse<InvoiceResponse[]>

#### GET /api/invoices/{id}
Get specific invoice details.

**Response:**
- 200 OK: ApiResponse<InvoiceResponse>
- 404 Not Found: Invoice not found

#### PUT /api/invoices/{id}
Update invoice data (for manual corrections).

**Request Body:**
```typescript
interface InvoiceUpdateRequest {
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
```

**Response:**
- 200 OK: ApiResponse<InvoiceResponse>
- 400 Bad Request: Validation errors
- 404 Not Found: Invoice not found
- 409 Conflict: Invoice not in editable state

#### DELETE /api/invoices/{id}
Soft delete invoice.

**Response:**
- 204 No Content: Successfully deleted
- 404 Not Found: Invoice not found

### Workflow Actions

#### POST /api/invoices/{id}/submit-for-approval
Submit reviewed invoice for approval.

**Response:**
- 200 OK: ApiResponse<InvoiceResponse>
- 400 Bad Request: Invoice not ready for approval
- 404 Not Found: Invoice not found

#### POST /api/invoices/{id}/approve
Approve invoice (Finance Manager only).

**Request Body:**
```typescript
interface ApprovalRequest {
  comments?: string;
}
```

**Response:**
- 200 OK: ApiResponse<InvoiceResponse>
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Invoice not found

#### POST /api/invoices/{id}/reject
Reject invoice with reason.

**Request Body:**
```typescript
interface RejectionRequest {
  reason: string;
  comments?: string;
}
```

**Response:**
- 200 OK: ApiResponse<InvoiceResponse>
- 400 Bad Request: Missing rejection reason
- 404 Not Found: Invoice not found

#### POST /api/invoices/{id}/assign
Assign invoice to user.

**Request Body:**
```typescript
interface AssignmentRequest {
  userId: string;
}
```

**Response:**
- 200 OK: ApiResponse<InvoiceResponse>
- 404 Not Found: Invoice or user not found

### Dashboard & Reporting

#### GET /api/dashboard/metrics
Get dashboard metrics by user role.

**Query Parameters:**
- role?: UserRole (defaults to current user's role)
- dateFrom?: string (ISO 8601 date)
- dateTo?: string (ISO 8601 date)

**Response:**
```typescript
interface DashboardMetrics {
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
```

#### GET /api/invoices/queue/{status}
Get invoices by status queue.

**Path Parameters:**
- status: InvoiceStatus

**Query Parameters:**
- page?: number (default: 1)
- limit?: number (default: 20)
- assignedTo?: string (user ID)
- priority?: 'high' | 'medium' | 'low'

**Response:**
- 200 OK: ApiResponse<InvoiceResponse[]>

#### GET /api/reports/processing-times
Processing time analytics.

**Query Parameters:**
- dateFrom?: string (ISO 8601 date)
- dateTo?: string (ISO 8601 date)
- groupBy?: 'day' | 'week' | 'month'

**Response:**
```typescript
interface ProcessingTimeReport {
  averageProcessingTime: number; // in hours
  medianProcessingTime: number;
  timeByStatus: Record<InvoiceStatus, number>;
  trends: Array<{
    period: string;
    avgTime: number;
    count: number;
  }>;
}
```

#### GET /api/reports/accuracy
Data accuracy metrics.

**Response:**
```typescript
interface AccuracyReport {
  overallAccuracy: number;
  accuracyByField: Record<string, number>;
  lowConfidenceCount: number;
  manualCorrectionRate: number;
}
```

### Vendor Management

#### GET /api/vendors
List vendors with search.

**Query Parameters:**
- search?: string
- page?: number (default: 1)
- limit?: number (default: 20)

**Response:**
- 200 OK: ApiResponse<Vendor[]>

#### POST /api/vendors
Create new vendor.

**Request Body:**
```typescript
interface VendorCreateRequest {
  name: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
}
```

**Response:**
- 201 Created: ApiResponse<Vendor>
- 400 Bad Request: Validation errors
- 409 Conflict: Vendor already exists

#### PUT /api/vendors/{id}
Update vendor information.

**Request Body:**
```typescript
interface VendorUpdateRequest {
  name?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
}
```

**Response:**
- 200 OK: ApiResponse<Vendor>
- 404 Not Found: Vendor not found
- 400 Bad Request: Validation errors

## Key Validation Rules

### File Upload Constraints
- **Supported formats**: PDF, PNG, JPG, JPEG
- **Maximum file size**: 10MB (10,485,760 bytes)
- **Minimum image resolution**: 150 DPI for optimal OCR
- **Multi-page support**: Yes for PDF files

### Business Logic Constants
- **Confidence threshold for auto-approval**: 0.95
- **Low confidence threshold requiring review**: 0.75
- **Maximum processing time before escalation**: 72 hours
- **Duplicate detection window**: 90 days

### Data Validation Rules
- **Invoice numbers**: Must be unique per vendor
- **Amounts**: Must be positive numbers with max 2 decimal places
- **Dates**: Must be valid ISO 8601 dates
- **Currency codes**: Must be valid ISO 4217 codes
- **Line item totals**: Must sum to subtotal (within 0.01 tolerance)
- **Tax calculations**: Tax + subtotal must equal total (within 0.01 tolerance)

### User Permissions
- **Finance Clerk**: Can view, edit, and submit invoices assigned to them
- **Finance Manager**: Can approve/reject invoices, view all invoices, assign invoices
- **Admin**: Full access to all operations and user management

### Rate Limiting
- **File uploads**: 10 requests per minute per user
- **API calls**: 100 requests per minute per user
- **Bulk operations**: 5 requests per minute per user

### Error Codes
- **INVALID_FILE_FORMAT**: Unsupported file type
- **FILE_TOO_LARGE**: File exceeds size limit
- **DUPLICATE_INVOICE**: Invoice number already exists for vendor
- **INSUFFICIENT_PERMISSIONS**: User lacks required permissions
- **INVALID_STATUS_TRANSITION**: Cannot change invoice to requested status
- **EXTRACTION_FAILED**: LLM processing failed
- **LOW_CONFIDENCE**: Extraction confidence below threshold
