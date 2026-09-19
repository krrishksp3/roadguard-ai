import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  MapPin,
  PlusCircle,
  LayoutDashboard,
  FileText,
  Activity,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import { PwaInstallPrompt } from '../pwa/PwaInstallPrompt';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAuthority, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-ink-950/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-ink-800/80 shadow-premium transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.25rem]">
          {/* LEFT: Logo & Subtitle */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-heading font-extrabold text-lg tracking-tight text-white group-hover:text-teal-400 transition-colors">
                  ROADGUARD
                </span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight hidden sm:block">
                Public Infrastructure Safety
              </p>
            </div>
          </Link>

          {/* CENTER: Road Map, Road Health, Tender Intelligence */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              to="/map"
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive('/map')
                  ? 'bg-ink-800 text-teal-400 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-ink-900'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isActive('/map') ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>Road Map</span>
            </Link>

            <Link
              to="/road-health"
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive('/road-health')
                  ? 'bg-ink-800 text-teal-400 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-ink-900'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${isActive('/road-health') ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>Road Health</span>
            </Link>

            <Link
              to="/tenders"
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive('/tenders')
                  ? 'bg-ink-800 text-teal-400 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-ink-900'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${isActive('/tenders') ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>Tender Intelligence</span>
            </Link>

            {isAuthenticated && !isAuthority && !isAdmin && (
              <Link
                to="/my-reports"
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive('/my-reports')
                    ? 'bg-ink-800 text-teal-400 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-ink-900'
                }`}
              >
                My Reports
              </Link>
            )}

            {/* Authority View */}
            {isAuthority && (
              <Link
                to="/authority"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  isActive('/authority')
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Authority Ops</span>
              </Link>
            )}

            {/* Admin View */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  isActive('/admin')
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>

          {/* RIGHT: Online status, Install App, Primary CTA "REPORT ISSUE", Login/User */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Status indicators */}
            <div className="hidden sm:flex items-center space-x-1">
              <OfflineIndicator />
              <PwaInstallPrompt />
            </div>

            {/* PRIMARY NAVBAR CTA */}
            <Link
              to="/report"
              className="btn-lift flex items-center space-x-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase shadow-md shadow-teal-900/30 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-teal-100" />
              <span>Report Issue</span>
            </Link>

            {/* Auth Controls */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2.5 border-l border-ink-800 pl-3">
                <div className="text-right">
                  <span className="text-xs font-semibold text-white block leading-tight">{user?.name}</span>
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-ink-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-1.5 border-l border-ink-800 pl-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-ink-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-ink-800 hover:bg-ink-700 text-white px-3 py-2 rounded-xl border border-ink-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-ink-900 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-ink-800 bg-ink-950 px-4 pt-4 pb-6 space-y-3 animate-in slide-in-from-top-2">
          {/* Quick status on mobile */}
          <div className="flex items-center justify-between pb-2 border-b border-ink-850">
            <OfflineIndicator />
            <PwaInstallPrompt />
          </div>

          <nav className="flex flex-col space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/') ? 'bg-ink-800 text-teal-400 font-bold' : 'text-slate-200 hover:bg-ink-900'
              }`}
            >
              Home
            </Link>

            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/map') ? 'bg-ink-800 text-teal-400 font-bold' : 'text-slate-200 hover:bg-ink-900'
              }`}
            >
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>Public Road Map</span>
            </Link>

            <Link
              to="/road-health"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/road-health') ? 'bg-ink-800 text-teal-400 font-bold' : 'text-slate-200 hover:bg-ink-900'
              }`}
            >
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Road Health Index</span>
            </Link>

            <Link
              to="/tenders"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/tenders') ? 'bg-ink-800 text-teal-400 font-bold' : 'text-slate-200 hover:bg-ink-900'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Tender Intelligence</span>
            </Link>

            <Link
              to="/my-reports"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive('/my-reports') ? 'bg-ink-800 text-teal-400 font-bold' : 'text-slate-200 hover:bg-ink-900'
              }`}
            >
              My Reports
            </Link>

            {isAuthority && (
              <Link
                to="/authority"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-amber-600 text-white shadow-sm mt-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Authority Operations Dashboard</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-purple-600 text-white shadow-sm mt-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>

          {/* User Section in Drawer */}
          <div className="pt-4 border-t border-ink-800 flex items-center justify-between">
            {isAuthenticated ? (
              <div className="flex items-center justify-between w-full">
                <div>
                  <span className="text-sm font-bold text-white block">{user?.name}</span>
                  <span className="text-xs text-teal-400 font-semibold uppercase">{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 bg-ink-800 px-3.5 py-2 rounded-xl"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 bg-ink-800 text-white rounded-xl text-xs font-bold border border-ink-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
