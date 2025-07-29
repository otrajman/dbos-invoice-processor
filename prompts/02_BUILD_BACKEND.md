
Your task is to build the backend API endpoints and the core invoice submission workflow.

### **🎯 Goal**
Implement the backend business logic, API, and workflow, referencing the authoritative API specification.

### **📚 Context Files**
-   **Application Logic**: `context/prd.md` defines the business rules.
-   **API Contract**: `context/api.md` is the single source of truth for all data structures, endpoints, and validation rules.
-   **DBOS Patterns**: `context/dbos.md` provides syntax for DBOS features and architecture guidelines.
-   **DBOS API**: Follow the class definitions at https://docs.dbos.dev/typescript/reference/client

### **🏗️ CRITICAL: DBOS Architecture Requirements**
**You MUST follow the DBOS architecture patterns defined in `context/dbos.md`. Pay special attention to:**

- **Workflow Guidelines** (lines 13-32): Workflows call steps, steps handle external operations
- **Transaction Guidelines** (lines 661-674): Transactions are for database operations only
- **Hierarchy Rules**: Workflows → Steps → Transactions (see examples in `context/dbos.md` lines 76-100, 747-770)

**Key Architecture Points:**
- Workflows orchestrate business processes and call steps
- Steps handle external APIs, file operations, and wrap transactions for workflow compatibility
- Transactions handle database operations using `DBOS.knexClient`
- API endpoints call workflows for complex operations, transactions for simple CRUD

### **📝 Instructions**

1.  **Install Dependencies**:
    -   Install any necessary dependencies like `zod` for validation and `express` to serve api and files.

2.  **Implement Constants**:
    -   Create a `src/constants.ts` file.
    -   Define constants for invoice statuses and categories, ensuring they **exactly match** the definitions in `context/api.md`.

3.  **Implement the Invoice Submission Workflow**:
    -   Create a `src/operations.ts` file.
    -   Implement a DBOS **Workflow** (`@DBOS.workflow()`) called `invoiceProcessingWorkflow`.
    -   **Follow the DBOS patterns in `context/dbos.md`**:
        - Workflows call steps (see Workflow Guidelines lines 23-25)
        - Steps handle external operations and wrap transactions (lines 16-18)
        - Transactions handle database operations only (lines 661-674)
    -   Use `zod` to create validation schemas that strictly adhere to the `InvoiceSubmissionRequest` structure in `context/api.md`.
    -   Perform all business logic checks outlined in `context/prd.md` and `context/api.md`.

4.  **Implement API Endpoints (Communicators)**:
    -   Create a `src/api.ts` file.
    -   Implement **ALL** RESTful API endpoints as specified in `context/api.md` and referenced in `context/prd.md`.
    -   **CRITICAL**: All request and response bodies must strictly conform to the structures defined in `context/api.md`, including the `ApiResponse` wrapper.
    -   **MANDATORY UUID Validation**: Add UUID format validation for all user ID parameters:
        - Validate `x-user-id` headers in endpoints that require authentication (approve, assign, etc.)
        - Validate user IDs in request bodies (assignment endpoints)
        - Use regex pattern: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
        - Return 401 with `INVALID_USER_ID` error code for invalid UUIDs
        - **This prevents PostgreSQL UUID constraint violations**
    -   **MANDATORY Dashboard Endpoints**: The frontend expects these endpoints to exist:
        - `GET /api/dashboard/clerk` - Returns `ClerkDashboardData` with invoice queues and metrics
        - `GET /api/dashboard/manager` - Returns `ManagerDashboardData` with approval queues and analytics
        - These endpoints must return real data from the database, not mock data
        - Use proper database joins to include vendor information in invoice queue items
        - **Include UUID validation for user ID headers in dashboard endpoints**
    -   **Follow Express integration patterns from `context/dbos.md` (lines 116-147, 767-770)**:
        - Call workflows for complex business operations (e.g., invoice processing)
        - Call transactions directly for simple CRUD operations (e.g., get invoice, update status, dashboard queries)
    -   Use the constants from `src/constants.ts` for all status and category validation.
    -   **Database Query Requirements**: Dashboard endpoints must use DBOS transactions to query the database. Create transaction methods in `src/operations.ts` for dashboard data retrieval that join invoices with vendors table to get vendor names.
    -   **CRITICAL - File Serving Configuration**: Ensure proper file serving setup to avoid 404 errors:
        - Files are stored in `uploads/invoices/` directory (via `UPLOAD_DIR` environment variable)
        - Static middleware serves from this directory at `/uploads` URL path
        - Database stores full file paths (e.g., `uploads/invoices/filename.pdf`)
        - Frontend must extract filename from full path for URL generation
        - Example: Database path `uploads/invoices/inv-001.pdf` → Frontend URL `http://localhost:3000/uploads/inv-001.pdf`

5.  **Implement Dashboard Data Transactions**:
    -   In `src/operations.ts`, create DBOS transaction methods for dashboard data:
        - `getInvoicesWithVendorTransaction(status, limit)` - Join invoices with vendors table
        - These transactions must return real data from the database for dashboard endpoints
        - Handle cases where vendor information might be null (use LEFT JOIN)
    -   Dashboard endpoints should aggregate data from these transactions to build the required response structures

6.  **Configure File Serving (CRITICAL)**:
    -   **Static Middleware Setup**: In `src/index.ts`, configure Express static middleware:
        ```typescript
        const uploadDir = process.env.UPLOAD_DIR || 'uploads/invoices';
        app.use('/uploads', express.static(path.resolve(uploadDir)));
        ```
    -   **File Storage**: Store files in `uploads/invoices/` directory with timestamped filenames
    -   **Database Storage**: Store full file paths in database (e.g., `uploads/invoices/1234567890-invoice.pdf`)
    -   **Frontend Integration**: Frontend must extract filename from database path for URL generation:
        - Database: `uploads/invoices/inv-001.pdf`
        - Frontend URL: `http://localhost:3000/uploads/inv-001.pdf`
        - Implementation: `filePath.split('/').pop()` to get filename
    -   **Security**: Ensure file paths are validated and within upload directory bounds

7.  **Write Integration Tests**:
    -   Create integration tests for each API endpoint, **including dashboard endpoints**.
    -   Tests should cover both successful and error scenarios, validating against the contracts in `context/api.md`.
    -   **Dashboard endpoint tests must verify**:
        - Correct data structure returned (matching `ClerkDashboardData` and `ManagerDashboardData`)
        - Real database data is returned, not hardcoded values
        - Vendor names are properly joined and included in queue items
    -   **File serving tests**: Verify that uploaded files can be accessed via static middleware

### **✅ Verification**
1.  **DBOS Architecture Validation**: Verify implementation follows `context/dbos.md` patterns:
    - Review Workflow Guidelines (lines 13-32) compliance
    - Check Transaction usage (lines 661-674) for database operations only
    - Validate against examples (lines 76-100, 747-770)
2.  Run `npm run build:backend`. It must compile without errors.
3.  Run the integration tests `npm run test`. All tests must pass.
4.  Start the server with `npm start` which should run `npx dbos-sdk start`. All API endpoints must be reachable and behave exactly as specified in `context/api.md`.
5.  **Dashboard Endpoint Verification**: Manually test dashboard endpoints to ensure they work correctly:
    - `curl http://localhost:3000/api/dashboard/clerk` should return `ClerkDashboardData` structure
    - `curl http://localhost:3000/api/dashboard/manager` should return `ManagerDashboardData` structure
    - Verify that invoice queue items include vendor names (not null/undefined)
    - Confirm financial calculations return numeric values, not string concatenations
6.  **File Serving Verification**: Test that uploaded files are accessible:
    - Upload a test file via `POST /api/invoices/upload`
    - Verify file is stored in `uploads/invoices/` directory
    - Test file access via static middleware: `curl http://localhost:3000/uploads/filename.pdf`
    - Confirm frontend can generate correct URLs from database file paths
7.  **UUID Validation Verification**: Test that UUID validation is working correctly:
    - Test approval endpoint with invalid user ID: `curl -X POST http://localhost:3000/api/invoices/{id}/approve -H "x-user-id: invalid-user-id"` should return 401 with `INVALID_USER_ID` error
    - Test approval endpoint with valid UUID: should proceed to business logic validation
    - Test assignment endpoint with invalid user ID in request body: should return 400 with `INVALID_USER_ID` error
    - Verify no PostgreSQL UUID constraint violation errors in logs
8.  Manually test other endpoints with `curl` to ensure request and response formats are correct.

### **🔍 Quick Reference**
For detailed DBOS patterns and examples, see `context/dbos.md`:
- **Workflow → Step → Transaction hierarch

## ⚠️ Common Implementation Pitfalls to Avoid

### DBOS-Specific Issues:
- **Never call transaction functions from step functions** - this violates DBOS architecture
- **Database operations must be in transaction functions** - step functions are for external operations
- **Use direct knex connections for test database operations** - don't use DBOS.knexClient in tests
- **Dashboard endpoints must use DBOS transactions** - cannot use DBOS.knexClient directly in Express routes

### Database Schema Issues:
- **Always verify column names match migration files** - check actual schema vs. code references
- **Ensure data types align** - especially for JSON columns, decimal precision, etc.
- **Test database must have same schema as development** - run migrations on test DB
- **Dashboard queries need vendor joins** - invoices table has vendor_id, not vendor_name directly

### UUID and User ID Validation Issues:
- **CRITICAL: Validate UUID format before database operations** - PostgreSQL will reject invalid UUID strings
- **Use proper UUID format for mock user IDs** - Use valid UUIDs from seed data, not strings like "mock-user-id"
- **Add UUID validation in API endpoints** - Validate user IDs before passing to database transactions
- **Example UUID validation regex**: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
- **Frontend mock authentication** - Use valid UUIDs from seed data (e.g., Finance Manager: `550e8400-e29b-41d4-a716-446655440002`)
- **Backend validation pattern**:
  ```typescript
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return res.status(401).json(createErrorResponse('INVALID_USER_ID', 'Valid user authentication required.'));
  }
  ```

### Dashboard Implementation Issues:
- **Frontend expects specific endpoints** - `/api/dashboard/clerk` and `/api/dashboard/manager` must exist
- **Use LEFT JOIN for vendor data** - some invoices may not have associated vendors
- **Handle numeric calculations properly** - avoid string concatenation in financial summaries
- **Return real database data** - dashboard endpoints should not return hardcoded mock data

### File Serving Issues:
- **Static middleware path mismatch** - ensure URL paths match directory structure served by Express static middleware
- **Frontend URL generation** - frontend must extract filename from database file paths for correct URL construction
- **File path storage** - store full paths in database but serve via static middleware with simplified URLs
- **Route order matters** - static middleware can intercept API routes if not configured properly

### Error Handling Patterns:
- **Multer errors need specific middleware** - file upload errors won't be caught by global handlers
- **Return appropriate HTTP status codes** - 400 for validation, 404 for not found, 500 for server errors
- **Validate request data early** - use Zod schemas or similar for input validation

### Testing Requirements:
- **Create separate test environment** - with `.env.test` and test database
- **Use direct database connections in tests** - avoid framework-specific clients
- **Test both success and failure scenarios** - especially file upload validationy**: Lines 76-100, 747-770
- **Transaction examples**: Lines 689-765
- **Express integration**: Lines 116-147, 767-770
- **Class-based patterns**: Lines 570-600

## 🔧 Debugging Checklist

When tests fail, check these in order:

1. **Compilation Issues**:
   - [ ] TypeScript builds without errors
   - [ ] All imports are resolved
   - [ ] Interface definitions match usage

2. **Database Issues**:
   - [ ] Test database exists and is accessible
   - [ ] Migrations have run on test database
   - [ ] Column names in code match actual schema
   - [ ] Data types are compatible

3. **Framework Architecture**:
   - [ ] DBOS patterns are correctly implemented
   - [ ] No transaction calls from step functions
   - [ ] Proper workflow structure

4. **Error Handling**:
   - [ ] Multer errors have specific handlers
   - [ ] HTTP status codes are appropriate
   - [ ] Error responses follow API format

5. **Dashboard Endpoints**:
   - [ ] `/api/dashboard/clerk` endpoint exists and returns correct structure
   - [ ] `/api/dashboard/manager` endpoint exists and returns correct structure
   - [ ] Dashboard queries use DBOS transactions, not direct knexClient calls
   - [ ] Vendor information is properly joined in invoice queue items
   - [ ] Financial calculations return numbers, not concatenated strings

6. **File Serving**:
   - [ ] Static middleware is configured correctly in `src/index.ts`
   - [ ] Upload directory exists and is accessible
   - [ ] File paths in database match actual file locations
   - [ ] Frontend URL generation extracts filename correctly
   - [ ] Test file access: `curl http://localhost:3000/uploads/filename.pdf` returns 200

7. **Test Environment**:
   - [ ] Test configuration files exist
   - [ ] Test database is properly configured
   - [ ] Tests use appropriate database connections