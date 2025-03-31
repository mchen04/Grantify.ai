"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import supabase from '@/lib/supabaseClient';
import { Grant } from '@/types/grant';

export default function Home() {
  const [featuredGrants, setFeaturedGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedGrants = async () => {
      try {
        const today = new Date().toISOString();
        // Get grants with upcoming deadlines and high funding amounts
        const { data, error } = await supabase
          .from('grants')
          .select('*')
          .gt('close_date', today)
          .not('award_ceiling', 'is', null)
          .order('award_ceiling', { ascending: false })
          .order('close_date', { ascending: true })
          .limit(3);

        if (error) throw error;
        setFeaturedGrants(data || []);
      } catch (error) {
        console.error('Error fetching featured grants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedGrants();
  }, []);

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Amount not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short',
    }).format(amount);
  };

  // Calculate days until deadline
  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return 'No deadline';
    const days = Math.ceil(
      (new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days === 1 ? '1 day' : `${days} days`;
  };

  return (
    <Layout fullWidth>
      {/* Hero Section - Full-width and full-height */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
                  className="btn-primary bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all"
                >
                  Get Started Free
                </Link>
                <Link
                  href="#how-it-works"
                  className="bg-primary-700 text-white hover:bg-primary-800 px-8 py-4 text-lg rounded-xl border border-primary-500 shadow-lg hover:shadow-xl transition-all"
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
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live updates from Grants.gov</span>
                  </div>
                  <div className="space-y-4">
                    {loading ? (
                      // Loading skeleton
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))
                    ) : featuredGrants.length > 0 ? (
                      // Real grants
                      featuredGrants.map((grant) => (
                        <Link
                          key={grant.id}
                          href={`/grants/${grant.id}`}
                          className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-primary-600 font-medium line-clamp-1" title={grant.title}>
                              {grant.title}
                            </div>
                            <div className="text-green-600 text-sm whitespace-nowrap ml-2">
                              {grant.match_score ? `${grant.match_score}% Match` : 'New'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(grant.award_ceiling)} • Due in {getDaysUntil(grant.close_date)}
                          </div>
                        </Link>
                      ))
                    ) : (
                      // Fallback content
                      <div className="text-center text-gray-500 py-4">
                        No grants available
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href="/search"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-1"
                    >
                      View all grants
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content container for the rest of the sections */}
      <div className="max-w-8xl mx-auto">
        {/* How It Works Section - with added spacing */}
        <section id="how-it-works" className="py-24 bg-white mt-8">
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
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Why Choose Grantify?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Completely Free</h3>
                <p className="text-gray-600">No hidden fees, no credit card required. Access all features at no cost.</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Matching</h3>
                <p className="text-gray-600">Smart recommendations that learn from your preferences and choices.</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Agentic AI Processing</h3>
                <p className="text-gray-600">Advanced AI that extracts key information like contact details and eligibility requirements from complex grant documents.</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Who Uses Grantify?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {['Researchers', 'Grad Students', 'Nonprofits', 'Artists', 'Small Businesses', 'Educators'].map((role) => (
                <div key={role} className="bg-gray-50 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 hover:bg-gray-100">
                  <p className="font-medium text-gray-900">{role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Common Questions
            </h2>
            <div className="space-y-8">
              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">How is this different from Grants.gov?</h3>
                <p className="text-gray-600">While Grants.gov is a database, Grantify uses AI to actively match grants to your interests and needs. We filter out expired grants and provide personalized recommendations, saving you hours of manual searching.</p>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Is it really free? What's the catch?</h3>
                <p className="text-gray-600">Yes, Grantify is completely free. Our mission is to make grant discovery accessible to everyone. We believe in removing barriers between researchers and funding opportunities.</p>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">What makes the AI match me with better results?</h3>
                <p className="text-gray-600">Our AI analyzes multiple factors including your field of research, funding requirements, and past interactions. It learns from your preferences to provide increasingly accurate matches over time.</p>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">How does the agentic AI help with grant applications?</h3>
                <p className="text-gray-600">Our agentic AI automatically processes grant documentation to extract critical information like contact details, eligibility requirements, and submission guidelines. This saves you hours of reading through complex documents and helps you quickly determine if a grant is right for you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section - Full width blue background */}
        <section className="py-24 bg-primary-600">
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
      </div>
    </Layout>
  );
}
