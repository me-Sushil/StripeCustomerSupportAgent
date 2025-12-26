

// ============================================
// src/components/layout/Navbar.jsx
// Responsive navbar with proper height and spacing
// ============================================

import { Search, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = ({ onMenuClick, sidebarOpen }) => {
  return (
    <nav className="
      bg-white border-b border-gray-200 
      sticky top-0 z-50 shadow-sm
      px-3 sm:px-4 lg:px-6 
      py-3 sm:py-4
    ">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Toggle button - Responsive size */}
          <button
            onClick={onMenuClick}
            className="
              p-1.5 sm:p-2 rounded-lg 
              hover:bg-gray-100 transition-colors 
              focus:outline-none focus:ring-2 focus:ring-primary-500
            "
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            )}
          </button>

          <Link to="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
               <Search className="w-6 h-6 text-white" />
             </div>
             <div className="hidden sm:block">
               <h1 className="text-lg lg:text-xl font-bold text-gray-900">
                 Stripe Support Agent
               </h1>
               <p className="text-xs text-gray-500">
                 RAG-Powered Documentation Search
               </p>
             </div>
           </Link>
        </div>

       
      </div>
    </nav>
  );
};
