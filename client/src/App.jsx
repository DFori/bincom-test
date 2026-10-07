import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardPage from './pages/DashboardPage';
import PollingUnitsPage from './pages/PollingUnitsPage';
import PollingUnitDetailPage from './pages/PollingUnitDetailPage';
import LgaResultsPage from './pages/LgaResultsPage';
import PartyManagementPage from './pages/PartyManagementPage';
import NewPollingUnitResultPage from './pages/NewPollingUnitResultPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/polling-units" element={<PollingUnitsPage />} />
              <Route path="/polling-units/:uniqueid" element={<PollingUnitDetailPage />} />
              <Route path="/lga-results" element={<LgaResultsPage />} />
              <Route path="/parties" element={<PartyManagementPage />} />
              <Route path="/new-result" element={<NewPollingUnitResultPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
