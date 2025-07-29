import request from 'supertest';
import express from 'express';
import { testDb } from './setup';
import { InvoiceStatus, UserRole } from '../src/constants';

// Create a simple test app without DBOS for basic testing
const testApp = express();
testApp.use(express.json());

// Simple health check endpoint for testing
testApp.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Simple test endpoint that uses the database
testApp.get('/test/vendors', async (req, res) => {
  try {
    const vendors = await testDb('vendors').select('*');
    res.json({ success: true, data: vendors });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: errorMessage });
  }
});

describe('Basic API Tests', () => {
  let testVendorId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test vendor
    const [vendor] = await testDb('vendors').insert({
      name: 'Test Vendor',
      address: '123 Test St',
      tax_id: 'TEST123',
      payment_terms: 'Net 30',
    }).returning('*');
    testVendorId = vendor.id;

    // Create test user
    const [user] = await testDb('users').insert({
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.FINANCE_CLERK,
    }).returning('*');
    testUserId = user.id;
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(testApp)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Database Connection', () => {
    it('should connect to test database and retrieve vendors', async () => {
      const response = await request(testApp)
        .get('/test/vendors');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Vendor');
    });
  });

  describe('Constants and Enums', () => {
    it('should have correct invoice statuses', () => {
      expect(InvoiceStatus.PROCESSING).toBe('processing');
      expect(InvoiceStatus.NEEDS_REVIEW).toBe('needs_review');
      expect(InvoiceStatus.AWAITING_APPROVAL).toBe('awaiting_approval');
      expect(InvoiceStatus.APPROVED).toBe('approved');
      expect(InvoiceStatus.REJECTED).toBe('rejected');
    });

    it('should have correct user roles', () => {
      expect(UserRole.FINANCE_CLERK).toBe('finance_clerk');
      expect(UserRole.FINANCE_MANAGER).toBe('finance_manager');
      expect(UserRole.ADMIN).toBe('admin');
    });
  });

  describe('Database Operations', () => {
    it('should create and retrieve invoices', async () => {
      const [invoice] = await testDb('invoices').insert({
        vendor_id: testVendorId,
        invoice_number: 'INV-TEST-001',
        invoice_date: '2024-01-15',
        due_date: '2024-02-15',
        subtotal: 1000.00,
        tax_amount: 80.00,
        total_amount: 1080.00,
        currency: 'USD',
        status: InvoiceStatus.NEEDS_REVIEW,
        file_path: '/uploads/test.pdf',
      }).returning('*');

      expect(invoice.id).toBeDefined();
      expect(invoice.invoice_number).toBe('INV-TEST-001');
      expect(invoice.status).toBe(InvoiceStatus.NEEDS_REVIEW);

      // Verify we can retrieve it
      const retrieved = await testDb('invoices').where('id', invoice.id).first();
      expect(retrieved.invoice_number).toBe('INV-TEST-001');
    });

    it('should create line items for invoices', async () => {
      const [invoice] = await testDb('invoices').insert({
        vendor_id: testVendorId,
        invoice_number: 'INV-LINE-TEST',
        status: InvoiceStatus.NEEDS_REVIEW,
        file_path: '/uploads/test.pdf',
        currency: 'USD',
        total_amount: 1000.00,
      }).returning('*');

      await testDb('line_items').insert([
        {
          invoice_id: invoice.id,
          description: 'Test Item 1',
          quantity: 1,
          unit_price: 500.00,
          line_total: 500.00,
          line_number: 1,
        },
        {
          invoice_id: invoice.id,
          description: 'Test Item 2',
          quantity: 2,
          unit_price: 250.00,
          line_total: 500.00,
          line_number: 2,
        },
      ]);

      const lineItems = await testDb('line_items').where('invoice_id', invoice.id);
      expect(lineItems).toHaveLength(2);
      expect(lineItems[0].description).toBe('Test Item 1');
      expect(lineItems[1].description).toBe('Test Item 2');
    });
  });
});
