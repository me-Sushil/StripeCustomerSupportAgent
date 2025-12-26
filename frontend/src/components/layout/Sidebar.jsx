
// ============================================
// src/components/layout/Sidebar.jsx
// Responsive sidebar with proper spacing and content management
// ============================================

import {
  Home,
  Boxes,
  Search as SearchIcon,
  PlayCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Search", icon: SearchIcon, path: "/search" },
  { name: "Chunks", icon: Boxes, path: "/chunks" },
  { name: "Pipeline", icon: PlayCircle, path: "/pipeline" },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop - only on mobile/tablet */}
      {isOpen && (
        <div
          // className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 
          //            transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 w-64 h-screen 
          bg-white border-r border-gray-200 shadow-lg
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Sidebar navigation"
      >
        {/* 
          Content container with proper spacing:
          - pt-20: Space for fixed navbar (navbar height ~72px)
          - px-3: Horizontal padding
          - pb-4: Bottom padding
          - overflow-y-auto: Scrollable if content is long
        */}
        <div className="h-full pt-20 px-3 pb-4 overflow-y-auto custom-scrollbar">
          
          {/* 20px top margin as requested */}
          <div className="mt-5">
            
            {/* Navigation Links */}
            <nav className="space-y-1" role="navigation">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-lg 
                    text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm border-l-4 border-primary-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};
