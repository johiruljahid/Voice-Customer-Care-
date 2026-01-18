import React from 'react';
import { Heart, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser, getCurrentUser } from '../utils/db';

export const Header: React.FC = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-rose-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-gradient-to-br from-rose-400 to-rose-600 p-2 rounded-xl text-white shadow-lg shadow-rose-200">
            <Heart size={24} className="fill-current animate-pulse" />
          </div>
          <div>
            <h1 className="font-handwriting font-bold text-2xl text-gray-800 leading-none">Maya</h1>
            <p className="text-[10px] uppercase tracking-widest text-rose-500 font-bold">AI Companion</p>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden md:block text-sm font-medium text-gray-500">
              Hi, <span className="text-rose-600 font-bold">{user.name}</span>
            </span>
            
            <Link 
              to="/dashboard" 
              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
              title="My Routine"
            >
              <LayoutDashboard size={22} />
            </Link>
            
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};