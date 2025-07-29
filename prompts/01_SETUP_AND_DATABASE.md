
Your task is to set up the initial project structure, configure the database, and generate the API specification.

### **1. Goal**
Initialize the project, create the database schema, seed it with data, and generate a markdown file with the API specification.

### **2. Instructions**

0. **Initialize the system**
    - Create a `.gitignore`
    - Create a `.dbosignore`
    - Initialize git

1.  **Initialize `package.json`:** Create a `package.json` file. Add the following dependencies:
    -   `dependencies`: `pg`, `knex`, `@dbos-inc/dbos-sdk`
    -   `devDependencies`: `typescript`, `ts-node`

2.  **Create `tsconfig.json`**: Create a `tsconfig.json` file in the root directory with the standard DBOS configuration.

3.  **Create Directory Structure:** Create the following directories and empty files:
    ```
    /
    ├── .env
    ├── dbos-config.yaml
    ├── knexfile.ts
    ├── package.json
    ├── src/
    ├── frontend/
    ├── migrations/
    ├── seeds/
    └── uploads/
        └── invoices/
    ```

4.  **Configure Environment:** In the `.env` file, add the default DBOS database connection string (DBOS_DATABASE_URL) "postgresql://postgres:dbos@localhost:5432/postgres"
    
5.  **Basic DBOS Config:** In `dbos-config.yaml`, add the basic application configuration per https://docs.dbos.dev/typescript/reference/configuration.
    - Make sure to include migration information: 
```
 database:
  hostname: 'localhost'
  migrate:
    - npx knex migrate:latest
  sys_db_name: 'dbos_invoice_processor_dbos_sys'
```

6.  **Configure Knex:** Edit `knexfile.ts` to connect to the database using the `.env` variable.

7.  **Create Migration Script:** In the `migrations/` directory, create a migration file to define the `invoices` table based on the schema in `context/prd.md`.

8.  **Create Seed File:** Create a `seeds/initial_invoices.ts` file to populate the database with a mix of valid and flawed invoices.
    -   **IMPORTANT**: Use relative file paths like `'invoices/inv-2024-001.pdf'` (not absolute paths like `/uploads/invoices/inv-2024-001.pdf`) to match the file serving structure.
    -   Create the `uploads/invoices/` directory and generate corresponding demo PDF files for each invoice in the seed data.
    -   Demo PDF files should contain basic PDF structure with invoice details (invoice number, vendor, amount, etc.) for realistic testing.

9.  **Demo PDF File Creation:** For each invoice in the seed data, create corresponding PDF files in `uploads/invoices/`:
    -   Example: For invoice with `file_path: 'invoices/inv-2024-001.pdf'`, create `uploads/invoices/inv-2024-001.pdf`
    -   Use basic PDF structure with invoice content (invoice number, vendor, amount, line items)
    -   This ensures demo invoices can be viewed without errors in the frontend

10. **Generate API Specification:**
    -   Read the `context/prd.md` file to understand the API requirements.
    -   Based on the PRD, generate a detailed `context/api.md` file.
    -   The generated file should contain:
        -   Core data types for `InvoiceSubmissionRequest`, `LineItem`, `InvoiceResponse`, etc.
        -   Enum definitions for `InvoiceCategory` and `InvoiceStatus`.
        -   The `ApiResponse` wrapper structure.
        -   Key validation rules and business logic constants.
        -   File upload constraints (PDF, PNG, JPG only, 10MB max)
    -   Save this generated specification to `context/api.md`.

### **✅ Verification**
1.  The project structure must be correct.
2.  `npx knex migrate:latest --dry-run` must execute without errors.
3.  `npx knex seed:run` must populate the database.
4.  The `context/api.md` file must exist and contain a detailed API specification.
5.  **File Structure Verification**: Confirm that:
    -   `uploads/invoices/` directory exists
    -   Demo PDF files exist for each invoice in seed data (e.g., `uploads/invoices/inv-2024-001.pdf`)
    -   Seed data uses relative file paths (e.g., `'invoices/inv-2024-001.pdf'`)
    -   Demo PDF files contain basic invoice content for realistic testing
