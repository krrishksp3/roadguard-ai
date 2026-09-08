import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, MapPin, PlusCircle, LayoutDashboard, FileText, Activity, LogOut, LogIn, UserPlus } from 'lucide-react';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import { PwaInstallPrompt } from '../pwa/PwaInstallPrompt';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAuthority, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-heading font-extrabold text-lg tracking-tight text-white">ROADGUARD</span>
                <span className="text-xs bg-gov-500 text-white px-1.5 py-0.5 rounded font-bold">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight hidden sm:block">
                Public Infrastructure Safety Platform
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/map"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/map') ? 'bg-slate-800 text-gov-500 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Public Road Map</span>
            </Link>

            <Link
              to="/tenders"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/tenders') ? 'bg-slate-800 text-gov-500 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tender Intelligence</span>
            </Link>

            <Link
              to="/road-health"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/road-health') ? 'bg-slate-800 text-gov-500 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Road Health</span>
            </Link>

            {isAuthority && (
              <Link
                to="/authority"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/authority') ? 'bg-gov-700 text-white font-semibold' : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Authority Dashboard</span>
              </Link>
            )}

            {isAuthenticated && !isAuthority && (
              <Link
                to="/my-reports"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/my-reports') ? 'bg-slate-800 text-gov-500 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>My Reports</span>
              </Link>
            )}
          </nav>

          {/* Action Button & User Section */}
          <div className="flex items-center space-x-2.5">
            {/* PWA Connection Status & Sync */}
            <OfflineIndicator />

            {/* PWA Install Button */}
            <PwaInstallPrompt />

            <Link
              to="/report"
              className="flex items-center space-x-1.5 bg-gradient-to-r from-gov-500 to-gov-700 hover:from-gov-600 hover:to-gov-800 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-white block">{user?.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 border-l border-slate-800 pl-3">
                <Link
                  to="/login"
                  className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
