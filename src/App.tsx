import React, { useState } from "react";
import { Crown, Menu, X } from "lucide-react";
import Layout from "./components/Layout";
import { ThemeProvider } from "./ThemeContext";
import { DataProvider } from "./DataContext";

/* ================= MAIN APP ================= */

const MainApp: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<"CUSTOMER" | "STAFF" | null>(null);

  if (mode === "CUSTOMER") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">Customer Order Tracking</h1>
        </div>
      </Layout>
    );
  }

  if (mode === "STAFF") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">Staff Login</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <nav className="fixed top-0 w-full bg-black/90 border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto h-20 px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="text-yellow-500" />
            <div>
              <h1 className="font-bold tracking-wider">LORDS BESPOKE</h1>
              <p className="text-[10px] text-yellow-500 tracking-widest">
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
            onClick={() => setMode("CUSTOMER")}
            className="block text-yellow-500 text-2xl mb-6"
          >
            Track Order
          </button>

          <button
            onClick={() => setMode("STAFF")}
            className="block text-white text-2xl"
          >
            Staff Login
          </button>
        </div>
      )}
    </Layout>
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
