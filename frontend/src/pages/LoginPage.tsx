import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gov-700 text-white rounded-xl mx-auto flex items-center justify-center shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-900">Sign in to ROADGUARD AI</h2>
          <p className="text-xs text-slate-500">Access citizen reporting or authority management console</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        {/* 1-Click Quick Demo Login Pill Buttons for Judges */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Quick Fill Demo Credentials
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('citizen@roadguard.demo', 'citizen123')}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg transition border border-slate-200 text-center"
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => fillDemo('authority@roadguard.demo', 'authority123')}
              className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold rounded-lg transition border border-amber-200 text-center"
            >
              Authority
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@roadguard.demo', 'admin123')}
              className="px-2 py-1.5 bg-gov-50 hover:bg-gov-100 text-gov-800 text-[11px] font-semibold rounded-lg transition border border-gov-200 text-center"
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gov-700 hover:bg-gov-800 text-white font-bold py-2.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-gov-700 font-semibold hover:underline">
            Create citizen account
          </Link>
        </p>
      </div>
    </div>
  );
};
