"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * Floating settings button (bottom-left corner).
 *
 * @param {Object} props
 * @param {"home" | "dashboard"} props.variant
 *   - "home": only shows Change Theme
 *   - "dashboard": shows Change Username, Update Password, Change Theme, Sign Out
 */
export default function SettingsButton({ variant = "home" }) {
  const [open, setOpen] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setShowTheme(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50" ref={panelRef}>
      {/* Settings popover */}
      {open && (
        <div className="absolute bottom-14 left-0 w-56 bg-bg-card border border-border-custom rounded-xl shadow-lg overflow-hidden">
          {showTheme ? (
            // Theme selection sub-panel
            <div>
              <button
                onClick={() => setShowTheme(false)}
                className="flex items-center gap-2 w-full px-4 py-3 text-xs text-text-secondary hover:text-text-primary border-b border-border-custom transition-colors"
              >
                <span className="text-sm">&#8592;</span> Back
              </button>
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setShowTheme(false);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-colors ${
                    theme === opt.value
                      ? "text-accent bg-accent/5"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
                  }`}
                >
                  <span>{opt.label}</span>
                  {theme === opt.value && (
                    <span className="text-accent text-xs">&#10003;</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            // Main settings menu
            <div>
              <div className="px-4 py-3 border-b border-border-custom">
                <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                  Settings
                </div>
              </div>

              {variant === "dashboard" && (
                <>
                  <button
                    onClick={() => {
                      setOpen(false);
                      // TODO: implement change username modal
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                  >
                    <span className="text-base w-5 text-center">&#9998;</span>
                    Change Username
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      // TODO: implement update password modal
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                  >
                    <span className="text-base w-5 text-center">&#128274;</span>
                    Update Password
                  </button>
                </>
              )}

              <button
                onClick={() => setShowTheme(true)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base w-5 text-center">&#9788;</span>
                  Change Theme
                </div>
                <span className="text-xs text-text-secondary/60 capitalize">
                  {theme}
                </span>
              </button>

              {variant === "dashboard" && (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/5 transition-colors border-t border-border-custom"
                >
                  <span className="text-base w-5 text-center">&#8594;</span>
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Gear button */}
      <button
        onClick={() => {
          setOpen(!open);
          setShowTheme(false);
        }}
        className={`w-11 h-11 rounded-full border border-border-custom bg-bg-card shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all ${
          open ? "border-accent/40 text-accent" : ""
        }`}
        aria-label="Settings"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="3" />
          <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" />
        </svg>
      </button>
    </div>
  );
}
