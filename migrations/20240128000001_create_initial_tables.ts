import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('name').notNullable();
    table.enum('role', ['finance_clerk', 'finance_manager', 'admin']).notNullable();
    table.timestamps(true, true);
  });

  // Create vendors table
  await knex.schema.createTable('vendors', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().index();
    table.text('address');
    table.string('tax_id');
    table.string('payment_terms');
    table.timestamps(true, true);
  });

  // Create invoices table
  await knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('vendor_id').references('id').inTable('vendors').onDelete('SET NULL');
    table.string('invoice_number').notNullable().index();
    table.date('invoice_date');
    table.date('due_date');
    table.decimal('subtotal', 12, 2);
    table.decimal('tax_amount', 12, 2);
    table.decimal('total_amount', 12, 2);
    table.string('currency', 3).defaultTo('USD');
    table.enum('status', [
      'processing', 
      'needs_review', 
      'awaiting_approval', 
      'approved', 
      'rejected'
    ]).notNullable().defaultTo('processing');
    table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.string('file_path');
    table.json('extraction_confidence');
    table.timestamps(true, true);
  });

  // Create line_items table
  await knex.schema.createTable('line_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('invoice_id').references('id').inTable('invoices').onDelete('CASCADE').notNullable();
    table.text('description');
    table.decimal('quantity', 10, 3);
    table.decimal('unit_price', 12, 2);
    table.decimal('line_total', 12, 2);
    table.string('product_code');
    table.integer('line_number');
    table.timestamps(true, true);
  });

  // Create indexes for better performance
  await knex.schema.alterTable('invoices', (table) => {
    table.index(['status']);
    table.index(['assigned_to']);
    table.index(['approved_by']);
    table.index(['created_at']);
  });

  await knex.schema.alterTable('line_items', (table) => {
    table.index(['invoice_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('line_items');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('vendors');
  await knex.schema.dropTableIfExists('users');
}
