import React, { useState, useEffect } from 'react';
import { UserRole } from '../../types';
import Header from './Header';
import Navigation from './Navigation';

export interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.FINANCE_CLERK);
  const [activeItem, setActiveItem] = useState('dashboard');

  // Parse current hash to determine active navigation item
  useEffect(() => {
    const updateActiveItem = () => {
      const hash = window.location.hash.slice(1); // Remove #
      const [path, query] = hash.split('?');
      
      if (path === 'dashboard') {
        setActiveItem('dashboard');
      } else if (path === 'upload') {
        setActiveItem('upload');
      } else if (path === 'invoices') {
        if (query?.includes('status=needs_review')) {
          setActiveItem('needs-review');
        } else if (query?.includes('status=awaiting_approval')) {
          setActiveItem('awaiting-approval');
        } else if (query?.includes('status=rejected')) {
          setActiveItem('rejected');
        } else {
          setActiveItem('all-invoices');
        }
      } else if (path === 'reports') {
        setActiveItem('reports');
      } else {
        setActiveItem('dashboard');
      }
    };

    // Update on initial load
    updateActiveItem();

    // Listen for hash changes
    window.addEventListener('hashchange', updateActiveItem);
    
    return () => {
      window.removeEventListener('hashchange', updateActiveItem);
    };
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    // Optionally trigger a refresh of dashboard data
    window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role } }));
  };

  const handleNavigate = (href: string) => {
    window.location.hash = href.slice(1); // Remove # from href
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentRole={currentRole} onRoleChange={handleRoleChange} />
      
      <div className="flex">
        <Navigation
          currentRole={currentRole}
          activeItem={activeItem}
          onNavigate={handleNavigate}
        />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
