import { useState, useEffect } from 'react';
import { UserRole, InvoiceStatus } from './types';
import { Layout } from './components/layout';
import { ClerkDashboard, ManagerDashboard } from './components/dashboard';
import { InvoiceListView, InvoiceDetailView } from './components/invoices';
import { FileUpload } from './components/upload';
import { ErrorMessage } from './components/ui';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.FINANCE_CLERK);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [listFilters, setListFilters] = useState<any>({});

  // Parse hash to determine current view
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.slice(1); // Remove #
      const [path, query] = hash.split('?');

      if (path.startsWith('invoice/')) {
        const invoiceId = path.split('/')[1];
        setSelectedInvoiceId(invoiceId);
        setCurrentView('invoice-detail');
      } else if (path === 'upload') {
        setCurrentView('upload');
      } else if (path === 'invoices') {
        setCurrentView('invoices');
        // Parse query parameters for filters
        const params = new URLSearchParams(query || '');
        const filters: any = {};
        if (params.get('status')) {
          filters.status = params.get('status') as InvoiceStatus;
        }
        setListFilters(filters);
      } else if (path === 'reports') {
        setCurrentView('reports');
      } else {
        setCurrentView('dashboard');
      }
    };

    // Parse on initial load
    parseHash();

    // Listen for hash changes
    window.addEventListener('hashchange', parseHash);

    return () => {
      window.removeEventListener('hashchange', parseHash);
    };
  }, []);

  // Listen for role changes
  useEffect(() => {
    const handleRoleChange = (event: CustomEvent) => {
      setCurrentRole(event.detail.role);
    };

    window.addEventListener('roleChanged', handleRoleChange as EventListener);
    return () => window.removeEventListener('roleChanged', handleRoleChange as EventListener);
  }, []);

  const handleNavigate = (path: string) => {
    window.location.hash = path.startsWith('#') ? path.slice(1) : path;
  };

  const handleViewInvoice = (invoiceId: string) => {
    handleNavigate(`#invoice/${invoiceId}`);
  };

  const handleUploadSuccess = (invoiceId: string) => {
    // Navigate to the uploaded invoice
    handleViewInvoice(invoiceId);
  };

  const handleBackToList = () => {
    handleNavigate('#invoices');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        if (currentRole === UserRole.FINANCE_MANAGER || currentRole === UserRole.ADMIN) {
          return <ManagerDashboard onNavigate={handleNavigate} />;
        } else {
          return <ClerkDashboard onNavigate={handleNavigate} />;
        }

      case 'upload':
        return (
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onNavigate={handleNavigate}
          />
        );

      case 'invoices':
        return (
          <InvoiceListView
            initialFilters={listFilters}
            onViewInvoice={handleViewInvoice}
          />
        );

      case 'invoice-detail':
        if (!selectedInvoiceId) {
          return (
            <ErrorMessage
              message="No invoice selected"
              title="Invalid Invoice"
              variant="error"
            />
          );
        }
        return (
          <InvoiceDetailView
            invoiceId={selectedInvoiceId}
            currentRole={currentRole}
            onBack={handleBackToList}
            onNavigate={handleNavigate}
          />
        );

      case 'reports':
        return (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Coming Soon</h3>
            <p className="text-gray-600">
              Analytics and reporting features will be available in a future release.
            </p>
          </div>
        );

      default:
        return (
          <ErrorMessage
            message="Page not found"
            title="404 - Not Found"
            variant="error"
          />
        );
    }
  };

  return (
    <Layout>
      {renderCurrentView()}
    </Layout>
  );
}

export default App;
