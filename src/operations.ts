import { DBOS } from '@dbos-inc/dbos-sdk';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { InvoiceStatus, UserRole, BUSINESS_RULES, ERROR_CODES } from './constants';

// ===== INTERFACES =====

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productCode?: string;
  lineNumber: number;
}

export interface FieldConfidence {
  value: any;
  confidence: number; // 0-1 scale
}

export interface ExtractionConfidence {
  vendorName?: FieldConfidence;
  invoiceNumber?: FieldConfidence;
  invoiceDate?: FieldConfidence;
  totalAmount?: FieldConfidence;
  lineItems?: FieldConfidence[];
  overallConfidence: number; // 0-1 scale
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

// Dashboard Data Structures
export interface ClerkDashboardData {
  queueCounts: {
    needsReview: number;
    processing: number;
  };
  personalMetrics: {
    invoicesProcessed: number;
    accuracyRate: number;
    avgProcessingTime: number; // in hours
  };
  recentActivity: InvoiceResponse[];
}

export interface ManagerDashboardData {
  queueCounts: {
    awaitingApproval: number;
    processing: number;
    needsReview: number;
  };
  teamMetrics: {
    totalProcessed: number;
    avgAccuracyRate: number;
    avgProcessingTime: number;
    bottlenecks: string[];
  };
  approvalQueue: InvoiceResponse[];
}

// ===== VALIDATION SCHEMAS =====

export const InvoiceSubmissionSchema = z.object({
  file: z.object({
    originalname: z.string(),
    mimetype: z.string(),
    size: z.number().max(BUSINESS_RULES.MAX_FILE_SIZE_BYTES),
    buffer: z.instanceof(Buffer),
  }),
  metadata: z.object({
    expectedVendor: z.string().optional(),
    expectedAmount: z.number().optional(),
    purchaseOrderNumber: z.string().optional(),
  }).optional(),
});

export const InvoiceUpdateSchema = z.object({
  vendorId: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  subtotal: z.number().positive().optional(),
  taxAmount: z.number().min(0).optional(),
  totalAmount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  lineItems: z.array(z.object({
    id: z.string().uuid().optional(),
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    lineTotal: z.number().positive(),
    productCode: z.string().optional(),
    lineNumber: z.number().int().positive(),
  })).optional(),
});

// ===== DBOS OPERATIONS CLASS =====

export class InvoiceOperations {

  // ===== TRANSACTION FUNCTIONS (Database Operations) =====

  @DBOS.transaction()
  static async createInvoiceTransaction(invoiceData: {
    vendorId?: string;
    invoiceNumber: string;
    invoiceDate?: string;
    dueDate?: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    currency: string;
    status: InvoiceStatus;
    filePath: string;
    extractionConfidence?: ExtractionConfidence;
  }): Promise<string> {
    const [invoice] = await DBOS.knexClient('invoices')
      .insert({
        vendor_id: invoiceData.vendorId,
        invoice_number: invoiceData.invoiceNumber,
        invoice_date: invoiceData.invoiceDate,
        due_date: invoiceData.dueDate,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.taxAmount,
        total_amount: invoiceData.totalAmount,
        currency: invoiceData.currency,
        status: invoiceData.status,
        file_path: invoiceData.filePath,
        extraction_confidence: JSON.stringify(invoiceData.extractionConfidence),
      })
      .returning('id');
    
    return invoice.id;
  }

  @DBOS.transaction()
  static async createLineItemsTransaction(invoiceId: string, lineItems: Omit<LineItem, 'id'>[]): Promise<void> {
    if (lineItems.length > 0) {
      const lineItemsData = lineItems.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
        product_code: item.productCode,
        line_number: item.lineNumber,
      }));

      await DBOS.knexClient('line_items').insert(lineItemsData);
    }
  }

  @DBOS.transaction({ readOnly: true })
  static async getInvoiceByIdTransaction(invoiceId: string): Promise<InvoiceResponse | null> {
    const invoice = await DBOS.knexClient('invoices')
      .leftJoin('vendors', 'invoices.vendor_id', 'vendors.id')
      .leftJoin('users as assigned_user', 'invoices.assigned_to', 'assigned_user.id')
      .leftJoin('users as approved_user', 'invoices.approved_by', 'approved_user.id')
      .select(
        'invoices.*',
        'vendors.name as vendor_name',
        'assigned_user.id as assigned_user_id',
        'approved_user.id as approved_user_id'
      )
      .where('invoices.id', invoiceId)
      .first();

    if (!invoice) return null;

    const lineItems = await DBOS.knexClient('line_items')
      .where('invoice_id', invoiceId)
      .orderBy('line_number')
      .select('*');

    return InvoiceOperations.mapDatabaseToInvoiceResponse(invoice, lineItems);
  }

  @DBOS.transaction({ readOnly: true })
  static async getInvoicesWithVendorTransaction(
    status?: InvoiceStatus,
    limit: number = 20,
    offset: number = 0
  ): Promise<InvoiceResponse[]> {
    let query = DBOS.knexClient('invoices')
      .leftJoin('vendors', 'invoices.vendor_id', 'vendors.id')
      .leftJoin('users as assigned_user', 'invoices.assigned_to', 'assigned_user.id')
      .leftJoin('users as approved_user', 'invoices.approved_by', 'approved_user.id')
      .select(
        'invoices.*',
        'vendors.name as vendor_name',
        'assigned_user.id as assigned_user_id',
        'approved_user.id as approved_user_id'
      )
      .orderBy('invoices.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where('invoices.status', status);
    }

    const invoices = await query;
    const result: InvoiceResponse[] = [];

    for (const invoice of invoices) {
      const lineItems = await DBOS.knexClient('line_items')
        .where('invoice_id', invoice.id)
        .orderBy('line_number')
        .select('*');

      result.push(InvoiceOperations.mapDatabaseToInvoiceResponse(invoice, lineItems));
    }

    return result;
  }

  @DBOS.transaction()
  static async updateInvoiceStatusTransaction(
    invoiceId: string,
    status: InvoiceStatus,
    assignedTo?: string,
    approvedBy?: string
  ): Promise<void> {
    const updateData: any = { status };

    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
    if (approvedBy !== undefined) updateData.approved_by = approvedBy;

    await DBOS.knexClient('invoices')
      .where('id', invoiceId)
      .update(updateData);
  }

  @DBOS.transaction()
  static async updateInvoiceDataTransaction(
    invoiceId: string,
    updateData: {
      vendorId?: string;
      invoiceNumber?: string;
      invoiceDate?: string;
      dueDate?: string;
      subtotal?: number;
      taxAmount?: number;
      totalAmount?: number;
      currency?: string;
    }
  ): Promise<void> {
    const dbUpdateData: any = {};

    if (updateData.vendorId !== undefined) dbUpdateData.vendor_id = updateData.vendorId;
    if (updateData.invoiceNumber !== undefined) dbUpdateData.invoice_number = updateData.invoiceNumber;
    if (updateData.invoiceDate !== undefined) dbUpdateData.invoice_date = updateData.invoiceDate;
    if (updateData.dueDate !== undefined) dbUpdateData.due_date = updateData.dueDate;
    if (updateData.subtotal !== undefined) dbUpdateData.subtotal = updateData.subtotal;
    if (updateData.taxAmount !== undefined) dbUpdateData.tax_amount = updateData.taxAmount;
    if (updateData.totalAmount !== undefined) dbUpdateData.total_amount = updateData.totalAmount;
    if (updateData.currency !== undefined) dbUpdateData.currency = updateData.currency;

    await DBOS.knexClient('invoices')
      .where('id', invoiceId)
      .update(dbUpdateData);
  }

  @DBOS.transaction()
  static async deleteInvoiceTransaction(invoiceId: string): Promise<void> {
    // Soft delete by updating status
    await DBOS.knexClient('invoices')
      .where('id', invoiceId)
      .update({ status: 'deleted' });
  }

  @DBOS.transaction({ readOnly: true })
  static async getClerkDashboardDataTransaction(userId?: string): Promise<ClerkDashboardData> {
    // Get queue counts
    const queueCounts = await DBOS.knexClient('invoices')
      .select('status')
      .count('* as count')
      .whereIn('status', [InvoiceStatus.NEEDS_REVIEW, InvoiceStatus.PROCESSING])
      .groupBy('status');

    const needsReview = queueCounts.find(q => q.status === InvoiceStatus.NEEDS_REVIEW)?.count || 0;
    const processing = queueCounts.find(q => q.status === InvoiceStatus.PROCESSING)?.count || 0;

    // Get personal metrics (if userId provided)
    let personalMetrics = {
      invoicesProcessed: 0,
      accuracyRate: 0.95, // Mock data
      avgProcessingTime: 2.5, // Mock data in hours
    };

    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      try {
        const processedCount = await DBOS.knexClient('invoices')
          .where('assigned_to', userId)
          .whereIn('status', [InvoiceStatus.APPROVED, InvoiceStatus.AWAITING_APPROVAL])
          .count('* as count')
          .first();

        personalMetrics.invoicesProcessed = parseInt(processedCount?.count as string) || 0;
      } catch (error) {
        // If there's any error with the query, just use default metrics
        DBOS.logger.info(`Error fetching user metrics for ${userId}: ${error}`);
      }
    } else if (userId) {
      // Log invalid userId format but don't fail the transaction
      DBOS.logger.info(`Invalid userId format: ${userId}`);
    }

    // Get recent activity - simplified to avoid recursive transaction calls
    const recentInvoices = await DBOS.knexClient('invoices')
      .leftJoin('vendors', 'invoices.vendor_id', 'vendors.id')
      .select(
        'invoices.*',
        'vendors.name as vendor_name'
      )
      .where('invoices.status', InvoiceStatus.NEEDS_REVIEW)
      .orderBy('invoices.created_at', 'desc')
      .limit(5);

    const recentActivity = recentInvoices.map(invoice => ({
      id: invoice.id,
      vendorId: invoice.vendor_id,
      vendorName: invoice.vendor_name,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date?.toISOString().split('T')[0],
      dueDate: invoice.due_date?.toISOString().split('T')[0],
      subtotal: parseFloat(invoice.subtotal) || undefined,
      taxAmount: parseFloat(invoice.tax_amount) || undefined,
      totalAmount: parseFloat(invoice.total_amount) || undefined,
      currency: invoice.currency,
      status: invoice.status,
      assignedTo: invoice.assigned_to,
      approvedBy: invoice.approved_by,
      filePath: invoice.file_path,
      extractionConfidence: invoice.extraction_confidence ?
        (typeof invoice.extraction_confidence === 'string' ?
          JSON.parse(invoice.extraction_confidence) :
          invoice.extraction_confidence) : undefined,
      lineItems: [], // Will be populated separately if needed
      createdAt: invoice.created_at.toISOString(),
      updatedAt: invoice.updated_at.toISOString(),
    }));

    return {
      queueCounts: {
        needsReview: parseInt(needsReview as string),
        processing: parseInt(processing as string),
      },
      personalMetrics,
      recentActivity,
    };
  }

  @DBOS.transaction({ readOnly: true })
  static async getManagerDashboardDataTransaction(): Promise<ManagerDashboardData> {
    // Get queue counts
    const queueCounts = await DBOS.knexClient('invoices')
      .select('status')
      .count('* as count')
      .whereIn('status', [InvoiceStatus.AWAITING_APPROVAL, InvoiceStatus.PROCESSING, InvoiceStatus.NEEDS_REVIEW])
      .groupBy('status');

    const awaitingApproval = queueCounts.find(q => q.status === InvoiceStatus.AWAITING_APPROVAL)?.count || 0;
    const processing = queueCounts.find(q => q.status === InvoiceStatus.PROCESSING)?.count || 0;
    const needsReview = queueCounts.find(q => q.status === InvoiceStatus.NEEDS_REVIEW)?.count || 0;

    // Get team metrics
    const totalProcessedCount = await DBOS.knexClient('invoices')
      .whereIn('status', [InvoiceStatus.APPROVED, InvoiceStatus.REJECTED])
      .count('* as count')
      .first();

    const teamMetrics = {
      totalProcessed: parseInt(totalProcessedCount?.count as string) || 0,
      avgAccuracyRate: 0.94, // Mock data
      avgProcessingTime: 3.2, // Mock data in hours
      bottlenecks: ['Manual review queue'], // Mock data
    };

    // Get approval queue - simplified to avoid recursive transaction calls
    const approvalInvoices = await DBOS.knexClient('invoices')
      .leftJoin('vendors', 'invoices.vendor_id', 'vendors.id')
      .select(
        'invoices.*',
        'vendors.name as vendor_name'
      )
      .where('invoices.status', InvoiceStatus.AWAITING_APPROVAL)
      .orderBy('invoices.created_at', 'desc')
      .limit(10);

    const approvalQueue = approvalInvoices.map(invoice => ({
      id: invoice.id,
      vendorId: invoice.vendor_id,
      vendorName: invoice.vendor_name,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date?.toISOString().split('T')[0],
      dueDate: invoice.due_date?.toISOString().split('T')[0],
      subtotal: parseFloat(invoice.subtotal) || undefined,
      taxAmount: parseFloat(invoice.tax_amount) || undefined,
      totalAmount: parseFloat(invoice.total_amount) || undefined,
      currency: invoice.currency,
      status: invoice.status,
      assignedTo: invoice.assigned_to,
      approvedBy: invoice.approved_by,
      filePath: invoice.file_path,
      extractionConfidence: invoice.extraction_confidence ?
        (typeof invoice.extraction_confidence === 'string' ?
          JSON.parse(invoice.extraction_confidence) :
          invoice.extraction_confidence) : undefined,
      lineItems: [], // Will be populated separately if needed
      createdAt: invoice.created_at.toISOString(),
      updatedAt: invoice.updated_at.toISOString(),
    }));

    return {
      queueCounts: {
        awaitingApproval: parseInt(awaitingApproval as string),
        processing: parseInt(processing as string),
        needsReview: parseInt(needsReview as string),
      },
      teamMetrics,
      approvalQueue,
    };
  }

  // ===== VENDOR MANAGEMENT TRANSACTIONS =====

  @DBOS.transaction({ readOnly: true })
  static async getVendorsTransaction(
    search?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Vendor[]> {
    let query = DBOS.knexClient('vendors')
      .select('*')
      .orderBy('name')
      .limit(limit)
      .offset(offset);

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    const vendors = await query;
    return vendors.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      address: vendor.address,
      taxId: vendor.tax_id,
      paymentTerms: vendor.payment_terms,
      createdAt: vendor.created_at.toISOString(),
      updatedAt: vendor.updated_at.toISOString(),
    }));
  }

  @DBOS.transaction()
  static async createVendorTransaction(vendorData: {
    name: string;
    address?: string;
    taxId?: string;
    paymentTerms?: string;
  }): Promise<string> {
    const [vendor] = await DBOS.knexClient('vendors')
      .insert({
        name: vendorData.name,
        address: vendorData.address,
        tax_id: vendorData.taxId,
        payment_terms: vendorData.paymentTerms,
      })
      .returning('id');

    return vendor.id;
  }

  @DBOS.transaction()
  static async updateVendorTransaction(
    vendorId: string,
    updateData: {
      name?: string;
      address?: string;
      taxId?: string;
      paymentTerms?: string;
    }
  ): Promise<void> {
    const dbUpdateData: any = {};

    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.address !== undefined) dbUpdateData.address = updateData.address;
    if (updateData.taxId !== undefined) dbUpdateData.tax_id = updateData.taxId;
    if (updateData.paymentTerms !== undefined) dbUpdateData.payment_terms = updateData.paymentTerms;

    await DBOS.knexClient('vendors')
      .where('id', vendorId)
      .update(dbUpdateData);
  }

  @DBOS.transaction({ readOnly: true })
  static async getVendorByIdTransaction(vendorId: string): Promise<Vendor | null> {
    const vendor = await DBOS.knexClient('vendors')
      .where('id', vendorId)
      .first();

    if (!vendor) return null;

    return {
      id: vendor.id,
      name: vendor.name,
      address: vendor.address,
      taxId: vendor.tax_id,
      paymentTerms: vendor.payment_terms,
      createdAt: vendor.created_at.toISOString(),
      updatedAt: vendor.updated_at.toISOString(),
    };
  }

  // ===== STEP FUNCTIONS (External Operations) =====

  @DBOS.step()
  static async saveFileStep(fileBuffer: Buffer, originalName: string): Promise<string> {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/invoices';
    await fs.mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const extension = path.extname(originalName);
    const filename = `${timestamp}-${path.basename(originalName, extension)}${extension}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, fileBuffer);
    DBOS.logger.info(`File saved: ${filePath}`);

    return filePath;
  }

  @DBOS.step()
  static async validateFileStep(file: any): Promise<void> {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`${ERROR_CODES.INVALID_FILE_FORMAT}: Unsupported file type ${file.mimetype}`);
    }

    if (file.size > BUSINESS_RULES.MAX_FILE_SIZE_BYTES) {
      throw new Error(`${ERROR_CODES.FILE_TOO_LARGE}: File size ${file.size} exceeds limit`);
    }

    DBOS.logger.info(`File validation passed: ${file.originalname}`);
  }

  @DBOS.step()
  static async extractInvoiceDataStep(filePath: string): Promise<{
    extractedData: any;
    confidence: ExtractionConfidence;
  }> {
    // Mock LLM extraction - in real implementation, this would call an LLM service
    DBOS.logger.info(`Extracting data from: ${filePath}`);

    // Simulate extraction with mock data
    const extractedData = {
      vendorName: 'Acme Corp',
      invoiceNumber: `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 1000.00,
      taxAmount: 80.00,
      totalAmount: 1080.00,
      currency: 'USD',
      lineItems: [
        {
          description: 'Professional Services',
          quantity: 1,
          unitPrice: 1000.00,
          lineTotal: 1000.00,
          lineNumber: 1,
        }
      ]
    };

    const confidence: ExtractionConfidence = {
      vendorName: { value: extractedData.vendorName, confidence: 0.95 },
      invoiceNumber: { value: extractedData.invoiceNumber, confidence: 0.98 },
      invoiceDate: { value: extractedData.invoiceDate, confidence: 0.92 },
      totalAmount: { value: extractedData.totalAmount, confidence: 0.97 },
      overallConfidence: 0.93
    };

    return { extractedData, confidence };
  }

  @DBOS.step()
  static async validateBusinessRulesStep(extractedData: any, confidence: ExtractionConfidence): Promise<InvoiceStatus> {
    // Check confidence thresholds
    if (confidence.overallConfidence < BUSINESS_RULES.LOW_CONFIDENCE_THRESHOLD) {
      DBOS.logger.info(`Low confidence extraction: ${confidence.overallConfidence}`);
      return InvoiceStatus.NEEDS_REVIEW;
    }

    // Validate math calculations
    const lineItemsTotal = extractedData.lineItems?.reduce((sum: number, item: any) => sum + item.lineTotal, 0) || 0;
    const subtotalDiff = Math.abs(lineItemsTotal - (extractedData.subtotal || 0));
    const totalDiff = Math.abs((extractedData.subtotal || 0) + (extractedData.taxAmount || 0) - (extractedData.totalAmount || 0));

    if (subtotalDiff > BUSINESS_RULES.MATH_TOLERANCE || totalDiff > BUSINESS_RULES.MATH_TOLERANCE) {
      DBOS.logger.info(`Math validation failed - subtotal diff: ${subtotalDiff}, total diff: ${totalDiff}`);
      return InvoiceStatus.NEEDS_REVIEW;
    }

    // Check for auto-approval threshold
    if (confidence.overallConfidence >= BUSINESS_RULES.CONFIDENCE_THRESHOLD_AUTO_APPROVAL) {
      return InvoiceStatus.AWAITING_APPROVAL;
    }

    return InvoiceStatus.NEEDS_REVIEW;
  }

  // ===== WORKFLOW FUNCTIONS =====

  @DBOS.workflow()
  static async invoiceProcessingWorkflow(fileData: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }, metadata?: any): Promise<InvoiceResponse> {

    // Step 1: Validate file
    await InvoiceOperations.validateFileStep(fileData);

    // Step 2: Save file
    const filePath = await InvoiceOperations.saveFileStep(fileData.buffer, fileData.originalname);

    // Step 3: Extract invoice data using LLM
    const { extractedData, confidence } = await InvoiceOperations.extractInvoiceDataStep(filePath);

    // Step 4: Validate business rules and determine status
    const status = await InvoiceOperations.validateBusinessRulesStep(extractedData, confidence);

    // Step 5: Create invoice in database
    const invoiceId = await InvoiceOperations.createInvoiceTransaction({
      vendorId: undefined, // Will be set later when vendor is identified
      invoiceNumber: extractedData.invoiceNumber,
      invoiceDate: extractedData.invoiceDate,
      dueDate: extractedData.dueDate,
      subtotal: extractedData.subtotal,
      taxAmount: extractedData.taxAmount,
      totalAmount: extractedData.totalAmount,
      currency: extractedData.currency || 'USD',
      status,
      filePath,
      extractionConfidence: confidence,
    });

    // Step 6: Create line items
    if (extractedData.lineItems && extractedData.lineItems.length > 0) {
      await InvoiceOperations.createLineItemsTransaction(invoiceId, extractedData.lineItems);
    }

    // Step 7: Get the complete invoice data
    const invoice = await InvoiceOperations.getInvoiceByIdTransaction(invoiceId);

    if (!invoice) {
      throw new Error('Failed to retrieve created invoice');
    }

    DBOS.logger.info(`Invoice processing completed: ${invoiceId}, status: ${status}`);
    return invoice;
  }

  // Helper method to map database results to API response format
  private static mapDatabaseToInvoiceResponse(invoice: any, lineItems: any[]): InvoiceResponse {
    return {
      id: invoice.id,
      vendorId: invoice.vendor_id,
      vendorName: invoice.vendor_name,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date?.toISOString().split('T')[0],
      dueDate: invoice.due_date?.toISOString().split('T')[0],
      subtotal: parseFloat(invoice.subtotal) || undefined,
      taxAmount: parseFloat(invoice.tax_amount) || undefined,
      totalAmount: parseFloat(invoice.total_amount) || undefined,
      currency: invoice.currency,
      status: invoice.status,
      assignedTo: invoice.assigned_user_id,
      approvedBy: invoice.approved_user_id,
      filePath: invoice.file_path,
      extractionConfidence: invoice.extraction_confidence ?
        (typeof invoice.extraction_confidence === 'string' ?
          JSON.parse(invoice.extraction_confidence) :
          invoice.extraction_confidence) : undefined,
      lineItems: lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unit_price),
        lineTotal: parseFloat(item.line_total),
        productCode: item.product_code,
        lineNumber: item.line_number,
      })),
      createdAt: invoice.created_at.toISOString(),
      updatedAt: invoice.updated_at.toISOString(),
    };
  }
}
