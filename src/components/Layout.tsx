import React from "react";
import { WorkerRole } from "../types";

interface LayoutProps {
  children: React.ReactNode;
  role?: WorkerRole;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, role, onLogout }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      {role && (
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800">
          <div className="font-bold tracking-wide">
            LORDS TAILOR – {role}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-sm px-3 py-1 border border-red-500 text-red-500 rounded"
            >
              Logout
            </button>
          )}
        </div>
      )}

      <div className="p-4">{children}</div>
    </div>
  );
};

export default Layout;
