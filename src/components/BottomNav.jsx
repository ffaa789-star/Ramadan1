import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function BottomNav() {
  const { isAdmin } = useAuth();

  return (
    <nav className="bottom-nav">
      <NavLink to="/daily" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        <span className="bottom-nav-icon">📋</span>
        <span className="bottom-nav-label">اليومية</span>
      </NavLink>

      <NavLink to="/report" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        <span className="bottom-nav-icon">📊</span>
        <span className="bottom-nav-label">التقارير</span>
      </NavLink>

      {isAdmin && (
        <NavLink to="/admin" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <span className="bottom-nav-icon">⚙️</span>
          <span className="bottom-nav-label">الإدارة</span>
        </NavLink>
      )}
    </nav>
  );
}
