import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import BottomNav from './components/BottomNav';
import OnboardingPage from './pages/OnboardingPage';
import DailyPage from './pages/DailyPage';
import ReportPage from './pages/ReportPage';
import MorePage from './pages/MorePage';
import AdminPage from './pages/AdminPage';
import './App.css';

export default function App() {
  const location = useLocation();
  const isOnboarding = location.pathname === '/onboarding';

  return (
    <>
      {/* Header — always compact */}
      {!isOnboarding && (
        <header className="app-header app-header-compact">
          <h1 className="app-title">رفيق رمضان</h1>
        </header>
      )}

      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/"
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
      </Routes>

      {/* Bottom nav — hidden on onboarding */}
      {!isOnboarding && <BottomNav />}
    </>
  );
}
