import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect Grant Match
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
            Grantify.ai uses artificial intelligence to match you with the most relevant grants based on your preferences and interests.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link
              href="/search"
              className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-md font-bold text-lg transition-colors"
            >
              Find Your Grant Now
            </Link>
            <Link
              href="/signup"
              className="bg-blue-700 text-white hover:bg-blue-800 border border-white px-8 py-4 rounded-md font-bold text-lg transition-colors"
            >
              Sign Up for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How Grantify.ai Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Daily Updates</h3>
              <p className="text-gray-600">
                We extract and process grant data daily from Grants.gov to ensure you have access to the latest opportunities.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Our AI analyzes grant descriptions and matches them with your preferences to find the most relevant opportunities.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Personalized Learning</h3>
              <p className="text-gray-600">
                The system learns from your interactions to continuously improve recommendations and find better matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Find Your Perfect Grant?
          </h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            Join thousands of users who have found funding opportunities through Grantify.ai.
          </p>
          <Link
            href="/signup"
            className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 rounded-md font-bold text-lg transition-colors"
          >
            Get Started for Free
          </Link>
        </div>
      </section>
    </Layout>
  );
}
