"use client";

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 xl:gap-8">
            {/* Brand section */}
            <div className="md:col-span-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
                Grantify.ai
              </div>
              <p className="text-gray-600 max-w-md">
                AI-powered grant matching platform helping researchers, organizations, and individuals find relevant funding opportunities tailored to their needs.
              </p>
              <div className="mt-6 flex space-x-6">
                <a href="https://twitter.com" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://linkedin.com" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Platform
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/search" className="text-base text-gray-600 hover:text-primary-600 transition-colors">
                    Search Grants
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-base text-gray-600 hover:text-primary-600 transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/preferences" className="text-base text-gray-600 hover:text-primary-600 transition-colors">
                    Preferences
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-base text-gray-600 hover:text-primary-600 transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Contact
              </h3>
              <ul className="mt-4 space-y-3">
                <li className="text-base text-gray-600">
                  <a href="mailto:info@grantify.ai" className="hover:text-primary-600 transition-colors">
                    info@grantify.ai
                  </a>
                </li>
                <li className="text-base text-gray-600">
                  San Francisco, CA
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-base text-gray-500">
                &copy; {currentYear} Grantify.ai. All rights reserved.
              </p>
              <div className="mt-4 md:mt-0 flex space-x-6">
                <Link href="/privacy-policy" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;