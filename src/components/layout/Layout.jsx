import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children, hideSidebarToggle = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarClosed, setSidebarClosed] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    const root = window.document.documentElement;

    if (savedTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(savedTheme);
    }
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setSidebarClosed(!sidebarClosed);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const marginLeft = sidebarClosed ? "72px" : "250px";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar hideSidebarToggle={hideSidebarToggle} />
      <Sidebar
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        closed={sidebarClosed}
        toggleSidebar={toggleSidebar}
      />
      <main
        id="main-content"
        className="pt-16"
        style={{ marginLeft: window.innerWidth >= 1024 ? marginLeft : 0 }}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
