import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { Layout, LogOut, User as UserIcon } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-3 flex items-center justify-between shadow-sm">
      <Link to="/" className="flex items-center gap-2 group transition-all">
        <div className="bg-primary-600 p-1.5 rounded-lg text-white group-hover:rotate-12 transition-transform duration-300">
          <Layout size={20} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">Antigravity<span className="text-primary-600">Kanban</span></span>
      </Link>

      <div className="flex items-center gap-6">
        <NotificationBell />
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-100/50 border border-slate-200">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:inline">{user?.name}</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors p-2 rounded-lg hover:bg-red-50"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
