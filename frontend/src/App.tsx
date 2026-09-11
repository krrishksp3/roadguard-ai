import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreateReportPage } from './pages/CreateReportPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { PublicMapPage } from './pages/PublicMapPage';
import { TenderIntelligencePage } from './pages/TenderIntelligencePage';
import { RoadHealthPage } from './pages/RoadHealthPage';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/report" element={<CreateReportPage />} />
              <Route path="/my-reports" element={<MyReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/authority" element={<AuthorityDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/map" element={<PublicMapPage />} />
              <Route path="/tenders" element={<TenderIntelligencePage />} />
              <Route path="/road-health" element={<RoadHealthPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
