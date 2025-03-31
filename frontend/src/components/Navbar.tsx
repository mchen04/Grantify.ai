"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isHomePage = pathname === '/';

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Search', path: '/search' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'About Us', path: '/about' },
  ];

  // Dynamic navbar classes based on homepage and scroll position
  const navbarClasses = isHomePage
    ? scrolled
      ? "bg-white shadow-md transition-all duration-300 fixed w-full top-0 z-50"
      : "bg-transparent transition-all duration-300 absolute w-full top-0 z-50"
    : "bg-white border-b border-gray-200";

  // Dynamic text color for links based on homepage and scroll position
  const textColorClass = (isActive: boolean) => {
    if (isHomePage && !scrolled) {
      return isActive ? 'text-white font-semibold' : 'text-white hover:text-primary-100';
    }
    return isActive ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600';
  };

  // Dynamic logo color based on homepage and scroll position
  const logoClass = isHomePage && !scrolled
    ? "text-2xl font-bold text-white"
    : "text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent";

  return (
    <nav className={navbarClasses}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2"
            >
              <span className={logoClass}>
                Grantify.ai
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm font-medium transition-colors ${textColorClass(pathname === item.path)}`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                >
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-card border border-gray-200 py-1 z-10">
                    <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100 truncate">
                      {user.email}
                    </div>
                    <Link
                      href="/preferences"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Preferences
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={isHomePage && !scrolled
                    ? "px-4 py-2 rounded-lg text-sm font-medium border border-white text-white hover:bg-white/10 transition-colors"
                    : "btn-secondary"
                  }
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className={isHomePage && !scrolled
                    ? "px-4 py-2 rounded-lg text-sm font-medium bg-white text-primary-600 hover:bg-primary-50 transition-colors"
                    : "btn-primary"
                  }
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
