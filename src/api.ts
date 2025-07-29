import express, { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import { z } from 'zod';
import { DBOS } from '@dbos-inc/dbos-sdk';
import {
  InvoiceOperations,
  ApiResponse,
  InvoiceResponse,
  InvoiceSubmissionSchema,
  InvoiceUpdateSchema,
  ClerkDashboardData,
  ManagerDashboardData,
  Vendor
} from './operations';
import { InvoiceStatus, UserRole, BUSINESS_RULES, ERROR_CODES, DEFAULTS } from './constants';

// Extend Express Request type to include file
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

export const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: BUSINESS_RULES.MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(ERROR_CODES.INVALID_FILE_FORMAT));
    }
  },
});

// ===== UTILITY FUNCTIONS =====

function createSuccessResponse<T>(data: T, meta?: any): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

function createErrorResponse(code: string, message: string, details?: any): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

function handleError(error: unknown, res: Response): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);
  DBOS.logger.error(`API Error: ${errorMessage}`);

  if (errorMessage.includes(ERROR_CODES.INVALID_FILE_FORMAT)) {
    return res.status(400).json(createErrorResponse(
      ERROR_CODES.INVALID_FILE_FORMAT,
      'Invalid file format. Only PDF, PNG, and JPG files are allowed.'
    ));
  }

  if (errorMessage.includes(ERROR_CODES.FILE_TOO_LARGE)) {
    return res.status(413).json(createErrorResponse(
      ERROR_CODES.FILE_TOO_LARGE,
      'File size exceeds the 10MB limit.'
    ));
  }

  if (errorMessage.includes('not found')) {
    return res.status(404).json(createErrorResponse(
      'NOT_FOUND',
      'Resource not found.'
    ));
  }

  return res.status(500).json(createErrorResponse(
    'INTERNAL_ERROR',
    'An internal server error occurred.',
    process.env.NODE_ENV === 'development' ? errorMessage : undefined
  ));
}

// ===== INVOICE MANAGEMENT ENDPOINTS =====

// POST /api/invoices/upload
app.post('/api/invoices/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(createErrorResponse(
        'MISSING_FILE',
        'No file provided in the request.'
      ));
    }

    // Validate the request
    const validationResult = InvoiceSubmissionSchema.safeParse({
      file: req.file,
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined,
    });

    if (!validationResult.success) {
      return res.status(400).json(createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request data.',
        validationResult.error.issues
      ));
    }

    // Start the invoice processing workflow
    const invoice = await InvoiceOperations.invoiceProcessingWorkflow(
      req.file,
      validationResult.data.metadata
    );

    return res.status(201).json(createSuccessResponse(invoice));
  } catch (error) {
    return handleError(error, res);
  }
});

// GET /api/invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULTS.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit as string) || DEFAULTS.PAGE_SIZE,
      DEFAULTS.MAX_PAGE_SIZE
    );
    const offset = (page - 1) * limit;
    const status = req.query.status as InvoiceStatus;

    const invoices = await InvoiceOperations.getInvoicesWithVendorTransaction(
      status,
      limit,
      offset
    );

    // Get total count for pagination - use returned count as approximation
    const total = invoices.length;
    const totalPages = Math.ceil(total / limit);

    return res.json(createSuccessResponse(invoices, {
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }));
  } catch (error) {
    return handleError(error, res);
  }
});

// GET /api/invoices/:id
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;

    if (!invoiceId) {
      return res.status(400).json(createErrorResponse(
        'INVALID_ID',
        'Invoice ID is required.'
      ));
    }

    const invoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);

    if (!invoice) {
      return res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        'Invoice not found.'
      ));
    }

    return res.json(createSuccessResponse(invoice));
  } catch (error) {
    return handleError(error, res);
  }
});

// PUT /api/invoices/:id
app.put('/api/invoices/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    
    // Validate the request body
    const validationResult = InvoiceUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request data.',
        validationResult.error.issues
      ));
    }

    // Check if invoice exists and is in editable state
    const existingInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        'Invoice not found.'
      ));
    }

    if (![InvoiceStatus.NEEDS_REVIEW, InvoiceStatus.PROCESSING].includes(existingInvoice.status)) {
      return res.status(409).json(createErrorResponse(
        'INVALID_STATUS_TRANSITION',
        'Invoice is not in an editable state.'
      ));
    }

    // Update the invoice
    await InvoiceOperations.updateInvoiceDataTransaction(invoiceId, validationResult.data);

    // Get updated invoice
    const updatedInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);

    return res.json(createSuccessResponse(updatedInvoice));
  } catch (error) {
    return handleError(error, res);
  }
});

// DELETE /api/invoices/:id
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const existingInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        'Invoice not found.'
      ));
    }

    await InvoiceOperations.deleteInvoiceTransaction(invoiceId);

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
});

// ===== WORKFLOW ACTION ENDPOINTS =====

// POST /api/invoices/:id/submit-for-approval
app.post('/api/invoices/:id/submit-for-approval', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    
    const existingInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        'Invoice not found.'
      ));
    }

    if (existingInvoice.status !== InvoiceStatus.NEEDS_REVIEW) {
      return res.status(400).json(createErrorResponse(
        'INVALID_STATUS_TRANSITION',
        'Invoice is not ready for approval.'
      ));
    }

    await InvoiceOperations.updateInvoiceStatusTransaction(
      invoiceId,
      InvoiceStatus.AWAITING_APPROVAL
    );

    const updatedInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    return res.json(createSuccessResponse(updatedInvoice));
  } catch (error) {
    return handleError(error, res);
  }
});

// POST /api/invoices/:id/approve
app.post('/api/invoices/:id/approve', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { comments } = req.body;

    // TODO: Add authentication middleware to get current user
    const currentUserId = req.headers['x-user-id'] as string; // Mock for now

    // Validate user ID format (must be a valid UUID)
    if (!currentUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId)) {
      return res.status(401).json(createErrorResponse(
        'INVALID_USER_ID',
        'Valid user authentication required for approval.'
      ));
    }

    const existingInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        'Invoice not found.'
      ));
    }

    if (existingInvoice.status !== InvoiceStatus.AWAITING_APPROVAL) {
      return res.status(400).json(createErrorResponse(
        'INVALID_STATUS_TRANSITION',
        'Invoice is not awaiting approval.'
      ));
    }

    await InvoiceOperations.updateInvoiceStatusTransaction(
      invoiceId,
      InvoiceStatus.APPROVED,
      undefined,
      currentUserId
    );

    const updatedInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    return res.json(createSuccessResponse(updatedInvoice));
  } catch (error) {
    return handleError(error, res);
  }
});

// POST /api/invoices/:id/reject
app.post('/api/invoices/:id/reject', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { reason, comments } = req.body;
    
    if (!reason) {
      return res.status(400).json(createErrorResponse(
        'MISSING_REASON',
        'Rejection reason is required.'
      ));
    }
    
    const existingInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        'Invoice not found.'
      ));
    }

    await InvoiceOperations.updateInvoiceStatusTransaction(
      invoiceId,
      InvoiceStatus.REJECTED
    );

    const updatedInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    return res.json(createSuccessResponse(updatedInvoice));
  } catch (error) {
    return handleError(error, res);
  }
});

// POST /api/invoices/:id/assign
app.post('/api/invoices/:id/assign', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json(createErrorResponse(
        'MISSING_USER_ID',
        'User ID is required.'
      ));
    }

    // Validate user ID format (must be a valid UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json(createErrorResponse(
        'INVALID_USER_ID',
        'User ID must be a valid UUID format.'
      ));
    }

    const existingInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        'Invoice not found.'
      ));
    }

    await InvoiceOperations.updateInvoiceStatusTransaction(
      invoiceId,
      existingInvoice.status,
      userId
    );

    const updatedInvoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);
    return res.json(createSuccessResponse(updatedInvoice));
  } catch (error) {
    return handleError(error, res);
  }
});

// ===== DASHBOARD ENDPOINTS =====

// GET /api/dashboard/clerk
app.get('/api/dashboard/clerk', async (req, res) => {
  try {
    // TODO: Get current user from authentication middleware
    const currentUserId = req.headers['x-user-id'] as string; // Mock for now

    // Only pass userId if it's a valid UUID format
    const validUserId = currentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId)
      ? currentUserId
      : undefined;

    const dashboardData = await InvoiceOperations.getClerkDashboardDataTransaction(validUserId);
    return res.json(createSuccessResponse(dashboardData));
  } catch (error) {
    return handleError(error, res);
  }
});

// GET /api/dashboard/manager
app.get('/api/dashboard/manager', async (req, res) => {
  try {
    const dashboardData = await InvoiceOperations.getManagerDashboardDataTransaction();
    return res.json(createSuccessResponse(dashboardData));
  } catch (error) {
    return handleError(error, res);
  }
});

// GET /api/dashboard/metrics (legacy endpoint)
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const role = req.query.role as UserRole;
    // TODO: Get current user role from authentication
    const currentRole = role || UserRole.FINANCE_CLERK;

    if (currentRole === UserRole.FINANCE_MANAGER) {
      const dashboardData = await InvoiceOperations.getManagerDashboardDataTransaction();
      return res.json(createSuccessResponse(dashboardData));
    } else {
      const currentUserId = req.headers['x-user-id'] as string;
      const dashboardData = await InvoiceOperations.getClerkDashboardDataTransaction(currentUserId);
      return res.json(createSuccessResponse(dashboardData));
    }
  } catch (error) {
    return handleError(error, res);
  }
});

// ===== QUEUE ENDPOINTS =====

// GET /api/invoices/queue/:status
app.get('/api/invoices/queue/:status', async (req, res) => {
  try {
    const status = req.params.status as InvoiceStatus;
    const page = parseInt(req.query.page as string) || DEFAULTS.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit as string) || DEFAULTS.PAGE_SIZE,
      DEFAULTS.MAX_PAGE_SIZE
    );
    const offset = (page - 1) * limit;
    const assignedTo = req.query.assignedTo as string;

    // Validate status
    if (!Object.values(InvoiceStatus).includes(status)) {
      return res.status(400).json(createErrorResponse(
        'INVALID_STATUS',
        'Invalid invoice status.'
      ));
    }

    let invoices = await InvoiceOperations.getInvoicesWithVendorTransaction(
      status,
      limit,
      offset
    );

    // Filter by assignedTo if provided
    if (assignedTo) {
      invoices = invoices.filter(invoice => invoice.assignedTo === assignedTo);
    }

    // Get total count for pagination - use returned count as approximation
    const total = invoices.length;
    const totalPages = Math.ceil(total / limit);

    return res.json(createSuccessResponse(invoices, {
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }));
  } catch (error) {
    return handleError(error, res);
  }
});

// ===== VENDOR MANAGEMENT ENDPOINTS =====

// GET /api/vendors
app.get('/api/vendors', async (req, res) => {
  try {
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || DEFAULTS.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit as string) || DEFAULTS.PAGE_SIZE,
      DEFAULTS.MAX_PAGE_SIZE
    );
    const offset = (page - 1) * limit;

    const vendors = await InvoiceOperations.getVendorsTransaction(search, limit, offset);

    // Get total count for pagination - this needs to be done in a separate transaction
    const total = vendors.length; // For now, use the returned count as an approximation
    const totalPages = Math.ceil(total / limit);

    return res.json(createSuccessResponse(vendors, {
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }));
  } catch (error) {
    return handleError(error, res);
  }
});

// POST /api/vendors
app.post('/api/vendors', async (req, res) => {
  try {
    const { name, address, taxId, paymentTerms } = req.body;

    if (!name) {
      return res.status(400).json(createErrorResponse(
        'MISSING_NAME',
        'Vendor name is required.'
      ));
    }

    const vendorId = await InvoiceOperations.createVendorTransaction({
      name,
      address,
      taxId,
      paymentTerms,
    });

    const vendor = await InvoiceOperations.getVendorByIdTransaction(vendorId);
    return res.status(201).json(createSuccessResponse(vendor));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return res.status(409).json(createErrorResponse(
        'VENDOR_EXISTS',
        'A vendor with this name already exists.'
      ));
    }
    return handleError(error, res);
  }
});

// PUT /api/vendors/:id
app.put('/api/vendors/:id', async (req, res) => {
  try {
    const vendorId = req.params.id;
    const { name, address, taxId, paymentTerms } = req.body;

    const existingVendor = await InvoiceOperations.getVendorByIdTransaction(vendorId);
    if (!existingVendor) {
      return res.status(404).json(createErrorResponse(
        'NOT_FOUND',
        'Vendor not found.'
      ));
    }

    await InvoiceOperations.updateVendorTransaction(vendorId, {
      name,
      address,
      taxId,
      paymentTerms,
    });

    const updatedVendor = await InvoiceOperations.getVendorByIdTransaction(vendorId);
    return res.json(createSuccessResponse(updatedVendor));
  } catch (error) {
    return handleError(error, res);
  }
});

// ===== ERROR HANDLING MIDDLEWARE =====

// Multer error handling
app.use((error: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json(createErrorResponse(
        ERROR_CODES.FILE_TOO_LARGE,
        'File size exceeds the 10MB limit.'
      ));
      return;
    }
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage === ERROR_CODES.INVALID_FILE_FORMAT) {
    res.status(400).json(createErrorResponse(
      ERROR_CODES.INVALID_FILE_FORMAT,
      'Invalid file format. Only PDF, PNG, and JPG files are allowed.'
    ));
    return;
  }

  next(error);
});

// Global error handler
app.use((error: unknown, req: Request, res: Response, next: NextFunction): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  DBOS.logger.error(`Unhandled error: ${errorMessage}`);
  res.status(500).json(createErrorResponse(
    'INTERNAL_ERROR',
    'An internal server error occurred.',
    process.env.NODE_ENV === 'development' ? errorMessage : undefined
  ));
});
