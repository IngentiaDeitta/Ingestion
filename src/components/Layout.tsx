import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/forgot-password";

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen w-full bg-[#E5E9E6] bg-gradient-to-br from-[#E5E9E6] via-[#F6EEDF] to-[#E5E9E6] text-[#1A1A1A] font-sans p-4 md:p-6 lg:p-8 flex flex-col">
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
        <Header />
        <main className="flex-1 mt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
