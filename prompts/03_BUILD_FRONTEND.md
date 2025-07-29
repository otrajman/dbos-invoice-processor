
Your task is to build the frontend user interface for the invoice application using React, TypeScript, and Vite.

### **🎯 Goal**
Create a comprehensive single-page React application for invoice processing with full navigation, role-based access, and complete integration with the live backend API. The application must support both clerk and manager workflows as defined in the PRD.

### **📚 Context Files**
-   **Requirements**: `context/prd.md` defines all features and user workflows that must be implemented.
-   **API Contract**: `context/api.md` is the single source of truth for all data structures, API calls, and validation rules.
-   **Backend Implementation**: Review `src/api.ts` to understand available endpoints and data formats.

### **📝 Instructions**

1.  **Initialize React App**:
    -   Use `npm create vite@latest frontend -- --template react-ts` to create the React project in the `frontend/` directory.

2.  **Install Dependencies**:
    -   Install `tailwindcss@3`, `postcss`, `autoprefixer`, and `axios`.

3.  **Configure Tailwind CSS**:
    -   Initialize Tailwind CSS v3 and configure the `tailwind.config.js` and `index.css` files correctly.

4.  **Implement TypeScript Types and Constants**:
    -   Create a `src/types.ts` file. Define TypeScript interfaces that **exactly match** the data structures in `context/api.md`.
    -   Create a `src/constants.ts` file. Define constants for invoice statuses and categories, ensuring they **exactly match** the enums in `context/api.md`.
    -   **CRITICAL - API Base URL**: Set `API_BASE_URL = '/api'` (relative path) in `src/constants.ts`, NOT `'http://localhost:3000/api'` (absolute URL).

5.  **Component Development**:
    -   **Required Components**:
        - `Layout` with `Header` (including role switcher) and `Navigation`
        - `ClerkDashboard` and `ManagerDashboard` with real data integration
        - `InvoiceListView` for displaying filtered invoice lists with pagination
        - `InvoiceDetailView` for individual invoice management
        - `InvoiceQueue` component for dashboard queues with proper navigation
        - `FileUpload` with demo upload functionality that creates proper PDF files
        - `DocumentViewer` with graceful error handling for missing files
        - UI components: `Button`, `LoadingSpinner`, `ErrorMessage`, `StatusBadge`
    -   Use Tailwind CSS classes for styling.

6.  **API Integration**:
    -   Use `axios` to communicate with the backend.
    -   **CRITICAL**: All API calls must use the exact request and response formats defined in `context/api.md`.
    -   **CRITICAL - Use Relative Paths**: All API calls must use relative paths (e.g., `/api/invoices`) instead of absolute URLs (e.g., `http://localhost:3000/api/invoices`) for better deployment flexibility and to avoid CORS issues.
    -   Use the constants from `src/constants.ts` for any status or category-related logic.
    -   **MANDATORY**: Every React component must use the `apiClient` service from `src/services/api.ts` - NO hardcoded mock data in components.
    -   **CRITICAL - User ID Authentication**: In `src/services/api.ts`, configure axios interceptors with proper UUID format:
        - **DO NOT use invalid strings like "mock-user-id"** - this causes PostgreSQL UUID constraint violations
        - **USE valid UUIDs from seed data** for mock authentication:
          - Finance Manager: `550e8400-e29b-41d4-a716-446655440002` (for approval permissions)
          - Finance Clerk: `550e8400-e29b-41d4-a716-446655440001` (for basic operations)
        - Example: `config.headers['x-user-id'] = '550e8400-e29b-41d4-a716-446655440002';`
    -   Use the `useApi` hook from `src/hooks/useApi.ts` for all data fetching operations.
    -   **CRITICAL - Prevent Infinite Loops**: Always memoize API call functions using `useCallback` to prevent infinite re-renders:
        ```typescript
        // ❌ WRONG - Causes infinite loop:
        const { data } = useApi(() => apiClient.getInvoices());

        // ✅ CORRECT - Prevents infinite loop:
        const getInvoices = useCallback(() => apiClient.getInvoices(), []);
        const { data } = useApi(getInvoices);

        // ✅ CORRECT - With dependencies:
        const getInvoiceById = useCallback(() => apiClient.getInvoiceById(invoiceId), [invoiceId]);
        const { data } = useApi(getInvoiceById);
        ```

7.  **Implement All UI Features**:
    -   **Navigation and Routing**: Implement proper hash-based routing for all navigation items:
        - Dashboard (both clerk and manager views)
        - Upload Invoice with demo upload functionality
        - All Invoices list view with pagination and filtering
        - Needs Review filtered view
        - Awaiting Approval filtered view
        - Rejected Invoices filtered view
        - Reports placeholder view
    -   **Role-Based Access**: Add role switching functionality in the header for demo purposes
    -   **Invoice Management**:
        - Invoice list views with search, filtering, and pagination
        - Invoice detail view with proper navigation (replace current view, not new window)
        - Approval/rejection actions that work with real backend APIs
    -   **Demo Upload Functionality**: Add demo invoice upload buttons with sample data
        - **CRITICAL**: Demo uploads must create proper PDF files (not text files) to avoid file type validation errors
        - Use basic PDF structure with invoice content (vendor, amount, description) for realistic testing
        - Ensure demo files have `application/pdf` MIME type and `.pdf` extension
    -   **Dashboard Features**: Ensure both clerk and manager dashboards display real data
    -   **NO SIMULATION**: All upload, approval, rejection, and data fetching operations must make real HTTP requests to the backend.
    -   Handle loading states, error states, and network failures properly using the `useApi` hook patterns.
    -   **Document Viewer Error Handling**: Implement graceful handling for missing PDF files:
        - Detect when document files fail to load (404 errors, missing files)
        - Display user-friendly "Document Not Available" message for demo invoices
        - Show invoice details even when PDF cannot be displayed
        - Use proper error boundaries and fallback UI components
    -   **File URL Generation**: In `src/services/api.ts`, the `getFileUrl()` method must return relative paths (e.g., `/uploads/filename.pdf`) instead of absolute URLs (e.g., `http://localhost:3000/uploads/filename.pdf`).

8.  **Configure Build Output**:
    -   Modify `vite.config.ts` to output the final build assets to the top-level `dist/public` directory.

### **🔧 Demo Upload Implementation Requirements**

**CRITICAL**: The demo upload functionality must create proper PDF files to avoid server validation errors. Here's the exact implementation needed:

```typescript
// In FileUpload component - Demo upload handler
const handleDemoUpload = async (demoIndex: number) => {
  const demo = demoInvoices[demoIndex];

  // Create a proper PDF file with basic PDF structure
  const mockFileContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
// ... (include basic PDF structure with invoice content)
%%EOF`;

  const mockFile = new File([mockFileContent], `demo-invoice-${demoIndex + 1}.pdf`, {
    type: 'application/pdf'  // MUST be application/pdf, not text/plain
  });

  // Rest of upload logic...
};
```

**Key Requirements**:
- Demo files MUST have `application/pdf` MIME type
- Demo files MUST have `.pdf` extension
- File content should include basic PDF structure with invoice details
- Server only accepts PDF, PNG, and JPG files - text files will be rejected

### **📄 Document Viewer Error Handling Requirements**

The DocumentViewer component must gracefully handle missing or failed PDF files:

```typescript
// In DocumentViewer component
const [fileError, setFileError] = useState(false);

const handleFileError = () => {
  setFileError(true);
};

// In render method - show fallback UI when file fails to load
{fileError ? (
  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
    <h3 className="text-lg font-medium text-gray-900 mb-2">Document Not Available</h3>
    <p className="text-gray-600 mb-4">
      This is a demo invoice. The original document file is not available for viewing.
    </p>
    {/* Display invoice details even when PDF fails */}
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
      <h4 className="font-medium text-gray-900 mb-2">Invoice Details:</h4>
      <div className="space-y-1 text-sm text-gray-600">
        <p><span className="font-medium">Invoice #:</span> {invoiceData.invoiceNumber}</p>
        <p><span className="font-medium">Vendor:</span> {invoiceData.vendor.name}</p>
        <p><span className="font-medium">Amount:</span> ${invoiceData.totalAmount.toFixed(2)}</p>
        <p><span className="font-medium">Status:</span> {invoiceData.status}</p>
      </div>
    </div>
  </div>
) : (
  // Normal PDF/image display with onError handlers
  <iframe src={fileUrl} onError={handleFileError} />
)}
```

**Key Requirements**:
- Detect file load failures using `onError` handlers
- Display user-friendly fallback UI instead of broken elements
- Show invoice details even when PDF cannot be displayed
- Handle both iframe (PDF) and img (PNG/JPG) error cases

### **⚠️ Common Pitfalls and Best Practices**

**1. Infinite Loop Prevention with useApi Hook**:
- **Problem**: Passing inline arrow functions to `useApi` causes infinite re-renders
- **Solution**: Always memoize API call functions with `useCallback`
- **Examples**:
  ```typescript
  // ❌ CAUSES INFINITE LOOP:
  const { data } = useApi(() => apiClient.getClerkDashboard());
  const { data } = useApi(() => apiClient.getInvoiceById(invoiceId));
  const { data } = useFilteredApi((filters) => apiClient.getInvoices(filters), defaultFilters);

  // ✅ CORRECT IMPLEMENTATION:
  const getClerkDashboard = useCallback(() => apiClient.getClerkDashboard(), []);
  const { data } = useApi(getClerkDashboard);

  const getInvoiceById = useCallback(() => apiClient.getInvoiceById(invoiceId), [invoiceId]);
  const { data } = useApi(getInvoiceById);

  const getInvoices = useCallback((filters: any) => apiClient.getInvoices(filters), []);
  const { data } = useFilteredApi(getInvoices, defaultFilters);
  ```

**2. useCallback Dependencies**:
- Include all variables from component scope that are used inside the callback
- For static API calls (no parameters), use empty dependency array `[]`
- For parameterized calls, include the parameters in the dependency array

**3. Import Requirements**:
- Always import `useCallback` from React when using the `useApi` hook
- Add `import React, { useCallback } from 'react';` to components using `useApi`

### **✅ Verification**
1.  Run `npm run build:frontend`. It must run `npm i` and build the frontend and complete without errors.
2.  The final assets must be in the `dist/public` directory.
3.  **Navigation Testing**: Verify all navigation items work correctly:
    -   Dashboard loads appropriate view based on user role
    -   All Invoices shows paginated invoice list
    -   Needs Review shows filtered invoices with status "needs_review"
    -   Awaiting Approval shows filtered invoices with status "awaiting_approval"
    -   Rejected shows filtered invoices with status "rejected"
    -   Upload Invoice shows upload form with demo buttons
4.  **Role Switching**: Verify role switcher in header changes dashboard view
5.  **Invoice Interaction**: Verify clicking invoices navigates to detail view (not new window)
6.  **Demo Upload**: Verify demo upload buttons create test invoices
    -   Demo uploads must use proper PDF files (not text files)
    -   Uploads should succeed without file type validation errors
    -   Created invoices should appear in the system with proper status
7.  **API Integration Test**: Start the backend server and verify that:
    -   Dashboard displays real data from `/api/dashboard/clerk` and `/api/dashboard/manager`
    -   File uploads make actual calls to `/api/invoices` (not simulated)
    -   All invoice lists fetch data from `/api/invoices` with proper pagination and filtering
    -   Approval/rejection actions make real POST requests to the backend
    -   Search and filtering work correctly in invoice lists
    -   No console errors related to failed API calls or missing data
8.  **UUID Authentication Verification**: Verify that the API service uses valid UUIDs:
    -   Check `src/services/api.ts` axios interceptor uses valid UUID format (not "mock-user-id")
    -   Test invoice approval functionality works without PostgreSQL UUID errors
    -   Verify browser network tab shows proper `x-user-id` headers in API requests
    -   Confirm no "invalid input syntax for type uuid" errors in backend logs
9.  **Relative Path Verification**: Verify that all API calls use relative paths:
    -   Check `src/constants.ts` has `API_BASE_URL = '/api'` (not `'http://localhost:3000/api'`)
    -   Check `src/services/api.ts` `getFileUrl()` method returns `/uploads/filename.pdf` format
    -   Verify browser network tab shows API requests to relative URLs (e.g., `/api/invoices`)
    -   Confirm no hardcoded `localhost` URLs in the frontend code
10. **No Mock Data**: Confirm that no React components contain hardcoded mock data - all data must come from API calls.
11. **Document Viewer Testing**: Verify document viewer handles missing files gracefully:
    -   Test with demo invoices that have missing PDF files
    -   Confirm fallback UI displays invoice details when PDF fails to load
    -   Ensure no console errors or broken UI when documents are unavailable
12. **Infinite Loop Prevention**: Verify no infinite re-rendering occurs:
    -   Open browser developer tools and monitor the Network tab
    -   Navigate between dashboard views and role switching
    -   Confirm API calls are not being made continuously in a loop
    -   Check that each API endpoint is called only when necessary (initial load, role change, manual refresh)
    -   Verify console shows no warnings about "Maximum update depth exceeded" or similar React warnings
