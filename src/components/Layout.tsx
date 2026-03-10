import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/forgot-password', '/register'].includes(location.pathname);

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-[#F6F8F7]">
      <Sidebar />
      <div className="flex-1 flex flex-col relative min-w-0">
        <Header />
        <main className="p-8 pb-32 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
