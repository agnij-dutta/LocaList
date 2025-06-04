"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <FiSun className="h-5 w-5" />;
      case "dark":
        return <FiMoon className="h-5 w-5" />;
      default:
        return <FiMonitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
        aria-label="Toggle theme"
      >
        {getIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-md shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
          <div className="py-1">
            <button
              onClick={() => {
                setTheme("light");
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center w-full px-4 py-2 text-sm text-left",
                theme === "light"
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <FiSun className="mr-2 h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => {
                setTheme("dark");
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center w-full px-4 py-2 text-sm text-left",
                theme === "dark"
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <FiMoon className="mr-2 h-4 w-4" />
              Dark
            </button>
            <button
              onClick={() => {
                setTheme("system");
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center w-full px-4 py-2 text-sm text-left",
                theme === "system"
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <FiMonitor className="mr-2 h-4 w-4" />
              System
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 