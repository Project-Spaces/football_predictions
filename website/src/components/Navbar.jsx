"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't show navbar inside dashboard (dashboard has its own sidebar)
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <nav className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur border-b border-border-custom">
      <div className="max-w-[960px] mx-auto px-4 w-full flex items-center justify-between h-16">
        <Link
          href="/"
          className="text-2xl font-bold text-accent tracking-tight"
        >
          Pindexa
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
              >
                <div className="w-7 h-7 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs font-bold">
                  {session.user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span>{session.user?.name?.split(" ")[0]}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-bg-card border border-border-custom rounded-lg shadow-lg py-1 z-50">
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-red-400 hover:bg-bg-card-hover transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-text-primary transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-text-primary transition-opacity ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-text-primary transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border-custom bg-bg-primary">
          {session ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-sm border-b border-border-custom text-text-secondary hover:text-text-primary"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block w-full text-left px-6 py-3 text-sm text-text-secondary hover:text-red-400"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-sm border-b border-border-custom text-text-secondary hover:text-text-primary"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-sm text-accent"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
