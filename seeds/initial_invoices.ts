import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Clear existing entries
    await knex('line_items').del();
    await knex('invoices').del();
    await knex('vendors').del();
    await knex('users').del();

    // Insert users
    const users = await knex('users').insert([
        {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'clerk@company.com',
            name: 'Finance Clerk',
            role: 'finance_clerk'
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440002',
            email: 'manager@company.com',
            name: 'Finance Manager',
            role: 'finance_manager'
        }
    ]).returning('*');

    // Insert vendors
    const vendors = await knex('vendors').insert([
        {
            id: '550e8400-e29b-41d4-a716-446655440010',
            name: 'TechSupply Corp',
            address: '123 Business Ave, Tech City, TC 12345',
            tax_id: 'TAX123456789',
            payment_terms: 'Net 30'
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440011',
            name: 'Office Solutions LLC',
            address: '456 Commerce St, Business Town, BT 67890',
            tax_id: 'TAX987654321',
            payment_terms: 'Net 15'
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440012',
            name: 'Global Services Inc',
            address: '789 Enterprise Blvd, Corporate City, CC 11111',
            tax_id: 'TAX555666777',
            payment_terms: 'Net 45'
        }
    ]).returning('*');

    // Insert invoices with mix of valid and flawed data
    const invoices = await knex('invoices').insert([
        // Valid invoice 1
        {
            id: '550e8400-e29b-41d4-a716-446655440020',
            vendor_id: '550e8400-e29b-41d4-a716-446655440010',
            invoice_number: 'INV-2024-001',
            invoice_date: '2024-01-15',
            due_date: '2024-02-14',
            subtotal: 1000.00,
            tax_amount: 80.00,
            total_amount: 1080.00,
            currency: 'USD',
            status: 'needs_review',
            assigned_to: '550e8400-e29b-41d4-a716-446655440001',
            file_path: 'invoices/inv-2024-001.pdf',
            extraction_confidence: JSON.stringify({
                vendor_name: { value: 'TechSupply Corp', confidence: 0.95 },
                invoice_number: { value: 'INV-2024-001', confidence: 0.98 },
                total_amount: { value: 1080.00, confidence: 0.97 },
                overall_confidence: 0.93
            })
        },
        // Valid invoice 2
        {
            id: '550e8400-e29b-41d4-a716-446655440021',
            vendor_id: '550e8400-e29b-41d4-a716-446655440011',
            invoice_number: 'OS-2024-0045',
            invoice_date: '2024-01-20',
            due_date: '2024-02-04',
            subtotal: 750.00,
            tax_amount: 60.00,
            total_amount: 810.00,
            currency: 'USD',
            status: 'awaiting_approval',
            assigned_to: '550e8400-e29b-41d4-a716-446655440001',
            file_path: 'invoices/inv-2024-002.pdf',
            extraction_confidence: JSON.stringify({
                vendor_name: { value: 'Office Solutions LLC', confidence: 0.92 },
                invoice_number: { value: 'OS-2024-0045', confidence: 0.96 },
                total_amount: { value: 810.00, confidence: 0.94 },
                overall_confidence: 0.91
            })
        },
        // Flawed invoice 1 - Low confidence extraction
        {
            id: '550e8400-e29b-41d4-a716-446655440022',
            vendor_id: '550e8400-e29b-41d4-a716-446655440012',
            invoice_number: 'GS-2024-0123',
            invoice_date: '2024-01-18',
            due_date: '2024-03-04',
            subtotal: 2500.00,
            tax_amount: 200.00,
            total_amount: 2700.00,
            currency: 'USD',
            status: 'needs_review',
            assigned_to: '550e8400-e29b-41d4-a716-446655440001',
            file_path: 'invoices/inv-2024-003.pdf',
            extraction_confidence: JSON.stringify({
                vendor_name: { value: 'Global Services Inc', confidence: 0.65 },
                invoice_number: { value: 'GS-2024-0123', confidence: 0.72 },
                total_amount: { value: 2700.00, confidence: 0.68 },
                overall_confidence: 0.68
            })
        },
        // Processing invoice
        {
            id: '550e8400-e29b-41d4-a716-446655440023',
            vendor_id: '550e8400-e29b-41d4-a716-446655440010',
            invoice_number: 'INV-2024-004',
            invoice_date: '2024-01-25',
            due_date: '2024-02-24',
            subtotal: 1500.00,
            tax_amount: 120.00,
            total_amount: 1620.00,
            currency: 'USD',
            status: 'processing',
            file_path: 'invoices/inv-2024-004.pdf',
            extraction_confidence: JSON.stringify({
                vendor_name: { value: 'TechSupply Corp', confidence: 0.88 },
                invoice_number: { value: 'INV-2024-004', confidence: 0.91 },
                total_amount: { value: 1620.00, confidence: 0.89 },
                overall_confidence: 0.86
            })
        },
        // Approved invoice
        {
            id: '550e8400-e29b-41d4-a716-446655440024',
            vendor_id: '550e8400-e29b-41d4-a716-446655440011',
            invoice_number: 'OS-2024-0032',
            invoice_date: '2024-01-10',
            due_date: '2024-01-25',
            subtotal: 500.00,
            tax_amount: 40.00,
            total_amount: 540.00,
            currency: 'USD',
            status: 'approved',
            assigned_to: '550e8400-e29b-41d4-a716-446655440001',
            approved_by: '550e8400-e29b-41d4-a716-446655440002',
            file_path: 'invoices/inv-2024-005.pdf',
            extraction_confidence: JSON.stringify({
                vendor_name: { value: 'Office Solutions LLC', confidence: 0.96 },
                invoice_number: { value: 'OS-2024-0032', confidence: 0.99 },
                total_amount: { value: 540.00, confidence: 0.98 },
                overall_confidence: 0.97
            })
        }
    ]).returning('*');

    // Insert line items for the invoices
    await knex('line_items').insert([
        // Line items for INV-2024-001
        {
            invoice_id: '550e8400-e29b-41d4-a716-446655440020',
            description: 'Laptop Computer - Dell XPS 13',
            quantity: 2,
            unit_price: 500.00,
            line_total: 1000.00,
            product_code: 'DELL-XPS13',
            line_number: 1
        },
        // Line items for OS-2024-0045
        {
            invoice_id: '550e8400-e29b-41d4-a716-446655440021',
            description: 'Office Chairs - Ergonomic',
            quantity: 5,
            unit_price: 150.00,
            line_total: 750.00,
            product_code: 'CHAIR-ERG-001',
            line_number: 1
        },
        // Line items for GS-2024-0123
        {
            invoice_id: '550e8400-e29b-41d4-a716-446655440022',
            description: 'Consulting Services - Q1 2024',
            quantity: 1,
            unit_price: 2500.00,
            line_total: 2500.00,
            product_code: 'CONSULT-Q1',
            line_number: 1
        },
        // Line items for INV-2024-004
        {
            invoice_id: '550e8400-e29b-41d4-a716-446655440023',
            description: 'Software License - Annual',
            quantity: 3,
            unit_price: 500.00,
            line_total: 1500.00,
            product_code: 'SW-LIC-ANN',
            line_number: 1
        },
        // Line items for OS-2024-0032
        {
            invoice_id: '550e8400-e29b-41d4-a716-446655440024',
            description: 'Office Supplies Bundle',
            quantity: 1,
            unit_price: 500.00,
            line_total: 500.00,
            product_code: 'SUPPLY-BUNDLE',
            line_number: 1
        }
    ]);
}
