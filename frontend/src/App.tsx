import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreateReportPage } from './pages/CreateReportPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PublicMapPage } from './pages/PublicMapPage';
import { TenderIntelligencePage } from './pages/TenderIntelligencePage';
import { RoadHealthPage } from './pages/RoadHealthPage';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-warm-100 text-ink-900 selection:bg-teal-700 selection:text-white font-sans">
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
    </LanguageProvider>
  );
};

export default App;
