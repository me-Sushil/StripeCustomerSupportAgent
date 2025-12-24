// ============================================
// src/components/layout/Sidebar.jsx
// ============================================

import {
  Home,
  FileText,
  Boxes,
  Search as SearchIcon,
  Settings,
  Database,
  PlayCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Search", icon: SearchIcon, path: "/search" },
  { name: "Scraper", icon: FileText, path: "/scraper" },
  { name: "Chunks", icon: Boxes, path: "/chunks" },
  { name: "Pipeline", icon: PlayCircle, path: "/pipeline" },
  { name: "Vector DB", icon: Database, path: "/vectors" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform
        bg-white border-r border-gray-200
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Stats section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2 px-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Documents</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Chunks</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vectors</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
