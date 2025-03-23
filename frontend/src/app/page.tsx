"use client";

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section - Instant Clarity & No Risk */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
                Find Grants That Fit You — Instantly & Free
              </h1>
              <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto lg:mx-0">
                Grantify uses AI to match you with live, relevant funding opportunities — no more endless browsing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/search"
                  className="btn-primary bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                >
                  Get Started Free
                </Link>
                <Link
                  href="#how-it-works"
                  className="btn-secondary border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                >
                  How It Works
                </Link>
              </div>
              <p className="mt-6 text-primary-100 text-sm">
                No login required • Updated daily from Grants.gov
              </p>
            </div>
            <div className="flex-1 hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Live updates from Grants.gov</span>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-primary-600 font-medium">Research Grant #{i}</div>
                          <div className="text-green-600 text-sm">98% Match</div>
                        </div>
                        <div className="text-sm text-gray-600">$250,000 • Due in 30 days</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How Grantify Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Tell us what you're looking for</h3>
              <p className="text-gray-600">Enter your research interests or browse categories to start</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get AI-powered matches daily</h3>
              <p className="text-gray-600">Our AI finds grants that align with your interests</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Save, ignore, or apply</h3>
              <p className="text-gray-600">We learn from your choices to improve matches</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It's Better Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose Grantify?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Completely Free</h3>
              <p className="text-gray-600">No hidden fees, no credit card required. Access all features at no cost.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Matching</h3>
              <p className="text-gray-600">Smart recommendations that learn from your preferences and choices.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Always Up-to-Date</h3>
              <p className="text-gray-600">Daily updates from Grants.gov ensure you never miss an opportunity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Who Uses Grantify?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {['Researchers', 'Grad Students', 'Nonprofits', 'Artists', 'Small Businesses', 'Educators'].map((role) => (
              <div key={role} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="font-medium text-gray-900">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Common Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How is this different from Grants.gov?</h3>
              <p className="text-gray-600">While Grants.gov is a database, Grantify uses AI to actively match grants to your interests and needs. We filter out expired grants and provide personalized recommendations, saving you hours of manual searching.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Is it really free? What's the catch?</h3>
              <p className="text-gray-600">Yes, Grantify is completely free. Our mission is to make grant discovery accessible to everyone. We believe in removing barriers between researchers and funding opportunities.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What makes the AI match me with better results?</h3>
              <p className="text-gray-600">Our AI analyzes multiple factors including your field of research, funding requirements, and past interactions. It learns from your preferences to provide increasingly accurate matches over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Your Next Grant Could Be Waiting
          </h2>
          <p className="text-xl text-primary-50 mb-8">
            Join thousands of researchers finding funding opportunities daily
          </p>
          <Link
            href="/search"
            className="inline-block bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all"
          >
            Find Grants Now
          </Link>
          <p className="mt-4 text-primary-100 text-sm">100% free • No login required • Updated daily</p>
        </div>
      </section>
    </Layout>
  );
}
