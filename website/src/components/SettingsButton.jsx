"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";

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
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);

  const initial = session?.user?.name?.[0]?.toUpperCase() || null;

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

      {/* Settings trigger button */}
      <button
        onClick={() => {
          setOpen(!open);
          setShowTheme(false);
        }}
        className={`w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center hover:opacity-90 transition-all ${
          open ? "ring-2 ring-accent/40" : ""
        }`}
        aria-label="Settings"
      >
        {initial ? (
          <span className="text-base font-semibold">{initial}</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
