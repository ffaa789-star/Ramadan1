import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import BottomNav from './components/BottomNav';
import OnboardingPage from './pages/OnboardingPage';
import DailyPage from './pages/DailyPage';
import ReportPage from './pages/ReportPage';
import MorePage from './pages/MorePage';
import AdminPage from './pages/AdminPage';
import './App.css';

const HIDE_SHELL_PATHS = ['/', '/onboarding', '/daily'];

export default function App() {
  const location = useLocation();
  const isOnboarding = location.pathname === '/' || location.pathname === '/onboarding';
  const hideHeader = HIDE_SHELL_PATHS.includes(location.pathname);

  return (
    <>
      {/* Header — hidden on onboarding + daily (daily has its own header) */}
      {!hideHeader && (
        <header className="app-header app-header-compact">
          <h1 className="app-title">رفيق رمضان</h1>
        </header>
      )}

      <Routes>
        {/* Onboarding — both "/" and "/onboarding" */}
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Main app pages */}
        <Route
          path="/daily"
          element={
            <ProtectedRoute>
              <DailyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/more"
          element={
            <ProtectedRoute>
              <MorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />

        {/* Fallback — redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Bottom nav — hidden on onboarding */}
      {!isOnboarding && <BottomNav />}
    </>
  );
}
