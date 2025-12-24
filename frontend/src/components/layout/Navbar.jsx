// ============================================
// src/components/layout/Navbar.jsx
// ============================================

import React from "react";
import { Search, Menu } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = ({ onMenuClick }) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Stripe Support Agent
              </h1>
              <p className="text-xs text-gray-500">
                RAG-Powered Documentation Search
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            Documentation
          </button>
          <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700">
            API Reference
          </button>
        </div>
      </div>
    </nav>
  );
};
