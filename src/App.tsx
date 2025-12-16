import React from 'react';
import Layout from './components/Layout';

import CustomerPortal from './components/CustomerPortal';
import AdminDashboard from './components/AdminDashboard';
import WorkerPanel from './components/WorkerPanel';
import VIPShowcase from './components/VIPShowcase';
import MaterialPanel from './components/MaterialPanel';
import FinishingPanel from './components/FinishingPanel';
import Login from './components/Login';
import ShowroomPanel from './components/ShowroomPanel';
import MeasurementPanel from './components/MeasurementPanel';
import ManagerPanel from './components/ManagerPanel';
import BookingMasterPanel from './components/BookingMasterPanel';
import InvestorPanel from './components/InvestorPanel';

import { WorkerRole } from './types';
import { DataProvider, useData } from './DataContext';
import { ThemeProvider } from './ThemeContext';

import {
  Menu,
  X,
  ArrowRight,
  Crown
} from 'lucide-react';

/* ================= MAIN APP ================= */

const MainApp: React.FC = () => {
  const { currentUser, logout } = useData();
  const [view, setView] = React.useState<'DASHBOARD' | 'SHOWROOM' | 'MATERIAL'>(
    'DASHBOARD'
  );

  if (!currentUser) {
    return <LandingPage />;
  }

  const renderContent = () => {
    switch (currentUser.role) {
      case WorkerRole.ADMIN:
        if (view === 'MATERIAL') return <MaterialPanel />;
        if (view === 'SHOWROOM') return <ShowroomPanel />;
        return <AdminDashboard />;

      case WorkerRole.MANAGER:
        return <ManagerPanel />;

      case WorkerRole.SHOWROOM:
        return <ShowroomPanel />;

      case WorkerRole.BOOKING_MASTER:
        return <BookingMasterPanel />;

      case WorkerRole.INVESTOR:
        return <InvestorPanel />;

      case WorkerRole.MATERIAL:
        return <MaterialPanel />;

      case WorkerRole.FINISHING:
        return <FinishingPanel />;

      case WorkerRole.MEASUREMENT:
        return <MeasurementPanel />;

      case WorkerRole.CUTTING:
      case WorkerRole.SHIRT_MAKER:
      case WorkerRole.PANT_MAKER:
      case WorkerRole.COAT_MAKER:
      case WorkerRole.SAFARI_MAKER:
      case WorkerRole.SHERWANI_MAKER:
      case WorkerRole.KAJ_BUTTON:
      case WorkerRole.DELIVERY:
      case WorkerRole.STITCHING:
        return <WorkerPanel role={currentUser.role} />;

      default:
        return (
          <div className="text-white text-center mt-20">
            Access Restricted
          </div>
        );
    }
  };

  return (
    <Layout role={currentUser.role} onLogout={logout}>
      {currentUser.role === WorkerRole.ADMIN && (
        <div className="flex gap-4 border-b border-neutral-800 pb-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setView('DASHBOARD')}
            className={`px-4 pb-2 text-sm font-bold uppercase ${
              view === 'DASHBOARD'
                ? 'text-gold-500 border-b-2 border-gold-500'
                : 'text-neutral-500'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setView('SHOWROOM')}
            className={`px-4 pb-2 text-sm font-bold uppercase ${
              view === 'SHOWROOM'
                ? 'text-gold-500 border-b-2 border-gold-500'
                : 'text-neutral-500'
            }`}
          >
            Showroom
          </button>

          <button
            onClick={() => setView('MATERIAL')}
            className={`px-4 pb-2 text-sm font-bold uppercase ${
              view === 'MATERIAL'
                ? 'text-gold-500 border-b-2 border-gold-500'
                : 'text-neutral-500'
            }`}
          >
            Materials
          </button>
        </div>
      )}

      {renderContent()}
    </Layout>
  );
};

/* ================= LANDING PAGE ================= */

const LandingPage: React.FC = () => {
  const [mode, setMode] = React.useState<'LANDING' | 'CUSTOMER' | 'STAFF'>(
    'LANDING'
  );
  const [menuOpen, setMenuOpen] = React.useState(false);

  if (mode === 'STAFF') return <Login />;

  if (mode === 'CUSTOMER') {
    return (
      <div className="bg-black min-h-screen p-4">
        <button
          onClick={() => setMode('LANDING')}
          className="text-white mb-4 flex items-center gap-2 font-bold"
        >
          <ArrowRight className="rotate-180 h-4 w-4" />
          Back
        </button>

        <CustomerPortal />
        <div className="mt-12">
          <VIPShowcase />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="fixed top-0 w-full bg-black/90 border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto h-20 px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="text-gold-500" />
            <div>
              <h1 className="font-bold tracking-wider">LORDS BESPOKE</h1>
              <p className="text-[10px] text-gold-500 tracking-widest">
                BESPOKE TAILORING
              </p>
            </div>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 bg-black z-40 pt-24 px-6">
          <button
            onClick={() => setMode('CUSTOMER')}
            className="block text-gold-500 text-2xl mb-6"
          >
            Track Order
          </button>
          <button
            onClick={() => setMode('STAFF')}
            className="block text-white text-2xl"
          >
            Staff Login
          </button>
        </div>
      )}
    </div>
  );
};

/* ================= ROOT ================= */

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;
