import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faUsers,
  faPlus,
  faFileLines,
  faRightFromBracket,
  faChevronLeft,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../services/supabaseClient";

export default function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: faChartSimple },
    { path: "/tenants", label: "Tenants", icon: faUsers },
    { path: "/tenants/new", label: "Add Tenant", icon: faPlus },
    { path: "/reports", label: "Reports", icon: faFileLines },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closeSidebar();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeSidebar]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Desktop Sidebar */}
      <aside id="sidebar">
        {/* Navigation */}
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path} className={isActive(item.path) ? "active" : ""}>
              <Link
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors">
                <FontAwesomeIcon
                  icon={item.icon}
                  className="w-5 h-5 flex-shrink-0"
                />
                {!isOpen && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 lg:hidden flex flex-col transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 mt-16">
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            Menu
          </span>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <FontAwesomeIcon
              icon={faXmark}
              className="w-5 h-5 text-gray-600 dark:text-gray-300"
            />
          </button>
        </div>
        <ul className="p-2 space-y-1">
          {navItems.map((item) => (
            <li key={item.path} className={isActive(item.path) ? "active" : ""}>
              <Link
                to={item.path}
                onClick={closeSidebar}
                className="flex items-center gap-3 px-4 py-3 rounded-lg">
                <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <ul>
          {navItems.slice(0, 4).map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={isActive(item.path) ? "active" : ""}>
                <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
