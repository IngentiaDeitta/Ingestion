import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E5E9E6]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-black animate-spin" />
          <p className="text-sm font-medium text-[#666666]">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
