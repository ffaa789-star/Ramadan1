import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
