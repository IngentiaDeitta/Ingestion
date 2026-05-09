import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/forgot-password', '/register'].includes(location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cerrar el menú al cambiar de ruta en móviles
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-[#F6F8F7]">
      {/* Overlay para móviles */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col relative min-w-0">
        <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="flex-1 flex flex-col p-4 md:p-8 pb-32 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
