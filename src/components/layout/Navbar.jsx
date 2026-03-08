import { useState, useEffect, useRef } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faRightFromBracket,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";

export default function Navbar({ toggleSidebar, hideSidebarToggle = false }) {
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  // Handle scroll-based visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Set scrolled state for background
      if (currentScrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleThemeChange = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Settings Icon - Fixed Top Right */}
      <button
        onClick={() => setShowSettings(true)}
        className={`fixed top-5 right-5 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 shadow-md ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"
        }`}
        title="Settings">
        <FontAwesomeIcon icon={faGear} className="w-5 h-5 text-white" />
      </button>

      {showSettings && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end pt-16 pr-4"
          onClick={() => setShowSettings(false)}>
          <div
            className="glass-card w-full max-w-48"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-3 space-y-2">
              {/* Theme Toggle */}
              <button
                onClick={handleThemeChange}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <FontAwesomeIcon
                  icon={theme === "dark" ? faMoon : faSun}
                  className="w-5 h-5 text-black dark:text-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <FontAwesomeIcon
                  icon={faRightFromBracket}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
