import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { SPJProvider } from './context/SPJContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SPJList from './pages/SPJList';
import SPJInput from './pages/SPJInput';
import LoginPage from './pages/LoginPage';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useFinance();

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <main className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <SPJProvider>
        <Toaster position="top-right" />
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/spj" element={<SPJList />} />
              <Route path="/spj/input" element={<SPJInput />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </SPJProvider>
    </FinanceProvider>
  );
}
