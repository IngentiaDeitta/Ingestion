import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import NewClient from './pages/NewClient';
import Finance from './pages/Finance';
import NewInvoice from './pages/NewInvoice';
import Kanban from './pages/Kanban';
import SmartQuoter from './pages/SmartQuoter';
import Timesheet from './pages/Timesheet';
import Reports from './pages/Reports';
import Team from './pages/Team';
import Settings from './pages/Settings';
import TechStack from './pages/TechStack';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected App Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<NewClient />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/finance/new-invoice" element={<NewInvoice />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/smart-quoter" element={<SmartQuoter />} />
          <Route path="/timesheet" element={<Timesheet />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/tech-stack" element={<TechStack />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

// Redirect unknown paths to home if they don't match or show 404
function HomeRedirect() {
  return <NotFound />;
}

export default App;
