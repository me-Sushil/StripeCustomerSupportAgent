
// ============================================
// src/components/layout/Layout.jsx
// Responsive layout with proper content spacing
// ============================================

import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  // Prevent body scroll on mobile when sidebar open
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - Fixed at top */}
      <Navbar onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />

      {/* Main content area */}
      <div className="flex relative min-h-[calc(100vh-72px)]">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

       
        <main
          className={`
            flex-1 w-full min-h-full
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? "lg:ml-64" : "ml-0"}
          `}
        >
         
          <div className="
            w-full h-full
            p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8
            mx-auto
            max-w-[100%] sm:max-w-[100%] md:max-w-[100%] lg:max-w-7xl
          ">
            {/* 20px top margin for content */}
            <div className="mt-5">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
