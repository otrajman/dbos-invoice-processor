
Your task is to fully integrate the frontend and backend, create a unified build system, and perform a final validation of the complete application.

### **🎯 Goal**
Combine the React frontend and DBOS backend into a single, deployable unit with a full suite of `package.json` scripts for development, building, and running the application.

### **📚 Context Files**
-   **Full Application Requirements**: `context/prd.md` is the source of truth for the final user experience.
-   **DBOS Patterns**: Use the `@Workflow()` pattern from `context/dbos.md`.

### **📝 Instructions**

1.  **Implement Final Backend Logic**:
    -   Ensure the `invoiceProcessingWorkflow` in `src/operations.ts` is fully implemented, orchestrating the entire invoice lifecycle as described in `context/prd.md`.
    -   Make sure the `POST /api/invoices` communicator correctly starts this workflow.

2.  **Create Unified `package.json` Scripts**:
    -   In the **root `package.json`** file, create a comprehensive set of scripts to manage the full-stack application (e.g., `dev`, `build`, `start`, `migrate`, `seed`).
    -   Install `concurrently` to run multiple processes in development.

3.  **Configure Static File Server**:
    -   Edit the backend express app to serve static files from `dist/public`.
    -   **CRITICAL** the backend *must* correctly serve all assets from the frontend and handle the api.
    -   Test using curl to verify that all frontend assets are correctly served by the backend.

4.  **Final Configuration Review**:
    -   Review `dbos-config.yaml` and `knexfile.ts` to ensure all paths and settings are correct for the final project structure.

### **✅ Verification**
This is the final, end-to-end test. I will execute the following commands **from the root directory in this exact order**:
1.  `npm install`
2.  `npm run migrate`
3.  `npm run seed`
4.  `npm run build` (This will build both backend and frontend).
5.  `npm run start`
6.  **CRITICAL** The server running on `http://localhost:3000` *must* correctly serve all of the frontend assests from `dist/public`

After these commands complete, I will open `http://localhost:3000` in my browser. The full React application must load and be fully functional. I will test the entire user flow described in `prd.md` to confirm that the frontend and backend are perfectly integrated.

**CRITICAL UUID Validation Test**: Before testing the UI, verify that UUID validation is working correctly:
```bash
# Test invoice approval with valid UUID (should work)
curl -X POST http://localhost:3000/api/invoices/{invoice-id}/approve \
  -H "Content-Type: application/json" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440002" \
  -d '{"comments": "Test approval"}'

# Test with invalid UUID (should return 401 INVALID_USER_ID error, NOT PostgreSQL error)
curl -X POST http://localhost:3000/api/invoices/{invoice-id}/approve \
  -H "Content-Type: application/json" \
  -H "x-user-id: invalid-user-id" \
  -d '{"comments": "Test with invalid ID"}'
```
**Expected Results**: No PostgreSQL UUID constraint violation errors in server logs. Invalid UUIDs should be caught by validation and return proper error responses.

## 🚨 CRITICAL DBOS EXPRESS INTEGRATION FIX

**IMPORTANT**: DBOS Express integration requires explicit `app.listen()` call even when using `npx dbos start`. You MUST implement this fix:

### Problem
1. Using `DBOS.launch({ expressApp: app })` without `app.listen()` prevents Express routes from being accessible
2. DBOS integration doesn't automatically start the Express server on the main port
3. Results in connection refused errors when accessing the application

### Solution
Use DBOS Express integration WITH explicit Express server startup. In `src/index.ts`:

```typescript
async function main(): Promise<void> {
  try {
    // Set up Express routes and middleware FIRST
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    app.use('/uploads', require('express').static(path.resolve(uploadDir)));

    const publicDir = path.resolve(__dirname, '../dist/public');
    app.use(require('express').static(publicDir));

    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'dbos-invoice-processor'
      });
    });

    app.get('/', (req, res) => {
      return res.sendFile(path.resolve(publicDir, 'index.html'));
    });

    // Initialize DBOS WITH Express integration
    DBOS.setConfig({
      name: "dbos-invoice-processor",
      databaseUrl: process.env.DBOS_DATABASE_URL
    });
    await DBOS.launch({ expressApp: app });

    // Start Express server (required even with DBOS integration)
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 DBOS Invoice Processor with Express integration running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start the application:', error);
    process.exit(1);
  }
}
```

### Additional Required Configuration

1. **Keep DBOS HTTP configuration** in `dbos-config.yaml` for CORS support:
   ```yaml
   name: dbos-invoice-processor
   language: node
   database_url: ${DBOS_DATABASE_URL}

   runtimeConfig:
     entrypoints:
       - dist/index.js

   database:
     hostname: 'localhost'
     migrate:
       - npx knex migrate:latest
     sys_db_name: 'dbos_invoice_processor_dbos_sys'

   # Keep the http section for CORS and other middleware
   http:
     cors_middleware: true
     credentials: true
   ```

2. **Fix static method context** in `src/operations.ts`:
   ```typescript
   // Change from:
   return this.mapDatabaseToInvoiceResponse(invoice, lineItems);

   // To:
   return InvoiceOperations.mapDatabaseToInvoiceResponse(invoice, lineItems);
   ```

3. **Update package.json scripts** to work with DBOS integration:
   ```json
   {
     "scripts": {
       "start": "node dist/index.js",
       "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
       "dev:backend": "ts-node src/index.ts",
       "dev:frontend": "cd frontend && npm run dev"
     }
   }
   ```

   **IMPORTANT**: Both `node dist/index.js` and `npx dbos start` work with this configuration. The `npx dbos start` command provides additional DBOS features like admin server and monitoring.

4. **Fix JSON parsing** in ALL locations where `extraction_confidence` is parsed:
   ```typescript
   // In mapDatabaseToInvoiceResponse and ALL dashboard methods
   extractionConfidence: invoice.extraction_confidence ?
     (typeof invoice.extraction_confidence === 'string' ?
       JSON.parse(invoice.extraction_confidence) :
       invoice.extraction_confidence) : undefined,
   ```

   **CRITICAL**: This fix must be applied in multiple locations:
   - `mapDatabaseToInvoiceResponse` method (line ~740)
   - `getClerkDashboardDataTransaction` method (line ~395)
   - `getManagerDashboardDataTransaction` method (line ~466)

5. **Fix invalid userId handling** in dashboard endpoints:
   ```typescript
   // In src/api.ts - GET /api/dashboard/clerk
   const currentUserId = req.headers['x-user-id'] as string;

   // Only pass userId if it's a valid UUID format
   const validUserId = currentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId)
     ? currentUserId
     : undefined;

   const dashboardData = await InvoiceOperations.getClerkDashboardDataTransaction(validUserId);
   ```

   ```typescript
   // In src/operations.ts - getClerkDashboardDataTransaction
   if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
     // Only execute user-specific queries if userId is valid UUID
   }
   ```

### Why These Fixes Are Necessary

**DBOS Express Integration Issue:**
- DBOS Express integration requires explicit `app.listen()` call to start the HTTP server
- Without `app.listen()`, DBOS initializes but doesn't serve HTTP requests on the main port
- The `http` section in `dbos-config.yaml` provides CORS and other middleware support
- DBOS admin server runs separately on port 3001 (may show warnings if port is in use, but this doesn't affect main functionality)
- This pattern provides full DBOS functionality (workflows, transactions, durability) with proper Express HTTP serving

**Database Transaction Errors:**
- Invalid user IDs cause PostgreSQL transaction failures
- When a transaction fails, all subsequent queries in that transaction are aborted
- Frontend may not send proper user ID headers, causing "mock-user-id" errors
- UUID validation prevents database constraint violations

**JSON Parsing Errors:**
- Database stores `extraction_confidence` as objects, not JSON strings
- Multiple locations attempt `JSON.parse()` on object data
- This causes "[object Object] is not valid JSON" errors
- Type checking prevents parsing errors across all dashboard methods

Without these fixes, the application will have:
- Express routes returning connection refused errors
- DBOS workflows working but HTTP endpoints inaccessible
- Database transaction failures causing repeated error logs
- Dashboard endpoints failing with JSON parsing errors
- Frontend unable to load data properly

### Testing the Fix

After implementing these changes, you should be able to run:

```bash
# Build the application
npm run build

# Start with DBOS (recommended - provides admin server and monitoring)
npx dbos start

# OR start with Node.js directly
npm start
```

Both approaches work correctly. The application will be accessible at `http://localhost:3000` with all Express routes working correctly. DBOS admin server may show warnings about port 3001 being in use, but this doesn't affect main functionality.
