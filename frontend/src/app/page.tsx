import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout/Layout';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section - Softer gradient and rounded elements */}
      <section className="py-24 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-6 md:flex md:items-center md:justify-between">
          <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Find Grants That Match You – Instantly
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-2xl leading-relaxed text-blue-50">
              AI-powered grant matching tailored to your research & funding needs. Stop wasting time searching. Let AI find the best funding opportunities for you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-5">
              <Link
                href="/signup"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Find Grants Now
              </Link>
              <Link
                href="/search"
                className="bg-blue-700 bg-opacity-40 backdrop-blur-sm text-white hover:bg-opacity-60 border border-white border-opacity-30 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300"
              >
                Try Search
              </Link>
            </div>
            <div className="mt-8 text-blue-100 opacity-80">
              <p>Trusted by researchers & organizations worldwide</p>
            </div>
          </div>
          <div className="md:w-1/2 hidden md:block">
            {/* Placeholder for hero image with softer styling */}
            <div className="bg-blue-500 bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 shadow-xl mx-4">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto mb-6 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-lg text-blue-50">AI-powered grant matching visualization</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section - Softer cards and shadows */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            Stop Struggling with Grant Searches
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Problem Column */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 transition-all duration-300 hover:shadow-xl">
              <h3 className="text-2xl font-bold text-red-500 mb-8">The Problem</h3>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="bg-red-100 rounded-full p-1 mr-4 mt-1">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">Searching for grants is frustrating & time-consuming</p>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 rounded-full p-1 mr-4 mt-1">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">Most grants are irrelevant to your field</p>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 rounded-full p-1 mr-4 mt-1">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">You miss deadlines & funding opportunities</p>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 rounded-full p-1 mr-4 mt-1">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">Manual filtering wastes valuable research time</p>
                </li>
              </ul>
            </div>
            
            {/* Solution Column */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 transition-all duration-300 hover:shadow-xl">
              <h3 className="text-2xl font-bold text-green-500 mb-8">The Solution</h3>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-4 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">AI-powered matching finds relevant grants in seconds</p>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-4 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">Custom recommendations based on your research & preferences</p>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-4 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">Never miss a deadline with alerts & tracking</p>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-4 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 leading-relaxed">Focus on your research while we find your funding</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section - Softer cards with better spacing */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            How Grantify.ai Works For You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-8 border border-gray-100">
              <div className="bg-blue-50 text-blue-500 rounded-full w-16 h-16 flex items-center justify-center mb-8 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">AI-Powered Matching</h3>
              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                Our AI analyzes grant descriptions and matches them with your preferences to find the most relevant opportunities.
              </p>
              <ul className="text-gray-600 space-y-2 pl-5">
                <li className="flex items-center">
                  <div className="bg-blue-50 rounded-full h-2 w-2 mr-2"></div>
                  <span>Personalized recommendations</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-blue-50 rounded-full h-2 w-2 mr-2"></div>
                  <span>Semantic understanding of grant text</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-blue-50 rounded-full h-2 w-2 mr-2"></div>
                  <span>Continuous learning from your feedback</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-8 border border-gray-100">
              <div className="bg-blue-50 text-blue-500 rounded-full w-16 h-16 flex items-center justify-center mb-8 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">Smart Search & Filters</h3>
              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                Find opportunities instantly with our powerful search tools and customizable filters.
              </p>
              <ul className="text-gray-600 space-y-2 pl-5">
                <li className="flex items-center">
                  <div className="bg-blue-50 rounded-full h-2 w-2 mr-2"></div>
                  <span>Filter by funding amount, deadline, agency</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-blue-50 rounded-full h-2 w-2 mr-2"></div>
                  <span>Search by keywords or categories</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-blue-50 rounded-full h-2 w-2 mr-2"></div>
                  <span>Save your favorite search parameters</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-8 border border-gray-100">
              <div className="bg-blue-50 text-blue-500 rounded-full w-16 h-16 flex items-center justify-center mb-8 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">Personal Dashboard</h3>
              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                Track, save, and manage all your grant opportunities in one convenient place.
              </p>
              <ul className="text-gray-600 space-y-2 pl-5">
                <li className="flex items-center">
                  <div className="bg-blue-50 rounded-full h-2 w-2 mr-2"></div>
                  <span>Save grants for later review</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-blue-50 rounded-full h-2 w-2 mr-2"></div>
                  <span>Track application status</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-blue-50 rounded-full h-2 w-2 mr-2"></div>
                  <span>Get deadline reminders</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof & Testimonials Section - Softer cards and better spacing */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            Trusted by Researchers Everywhere
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center mb-6">
                <div className="bg-blue-50 text-blue-500 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="text-xl font-bold">JD</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Dr. Jane Doe</h4>
                  <p className="text-sm text-gray-500">Research Scientist, University of Science</p>
                </div>
              </div>
              <p className="text-gray-600 italic leading-relaxed">
                "Grantify.ai saved me countless hours of searching. I found a perfect grant match that I would have never discovered otherwise."
              </p>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center mb-6">
                <div className="bg-blue-50 text-blue-500 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="text-xl font-bold">MS</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Mark Smith</h4>
                  <p className="text-sm text-gray-500">Nonprofit Director, Community Health Initiative</p>
                </div>
              </div>
              <p className="text-gray-600 italic leading-relaxed">
                "The AI recommendations are surprisingly accurate. We've secured two major grants in just three months using Grantify.ai."
              </p>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center mb-6">
                <div className="bg-blue-50 text-blue-500 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="text-xl font-bold">AJ</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Dr. Alex Johnson</h4>
                  <p className="text-sm text-gray-500">Professor, Department of Engineering</p>
                </div>
              </div>
              <p className="text-gray-600 italic leading-relaxed">
                "The deadline alerts alone are worth it. I never miss an opportunity now, and the personalized recommendations keep getting better."
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <p className="text-4xl font-bold text-blue-500 mb-3">1,000+</p>
              <p className="text-gray-600">Grants Matched Successfully</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <p className="text-4xl font-bold text-blue-500 mb-3">98%</p>
              <p className="text-gray-600">User Satisfaction Rate</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <p className="text-4xl font-bold text-blue-500 mb-3">15+</p>
              <p className="text-gray-600">Hours Saved Per User Monthly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section - Softer gradient and rounded elements */}
      <section className="py-24 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Ready to Find Your Perfect Grant?
          </h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto text-blue-50 leading-relaxed">
            Join thousands of researchers who have found funding opportunities through Grantify.ai.
          </p>
          <Link
            href="/signup"
            className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-full font-bold text-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block"
          >
            Get Your AI Grant Recommendations
          </Link>
          <p className="mt-6 text-blue-100 opacity-80">
            Takes less than 2 minutes. No spam, cancel anytime.
          </p>
        </div>
      </section>

      {/* FAQ Section - Softer cards and better spacing */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-8">
            {/* FAQ Item 1 */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">How does Grantify.ai find grants for me?</h3>
              <p className="text-gray-600 leading-relaxed">
                Grantify.ai uses artificial intelligence to analyze thousands of grants from Grants.gov daily. Our AI matches grant descriptions with your research interests, experience, and preferences to find the most relevant opportunities for you.
              </p>
            </div>
            
            {/* FAQ Item 2 */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Is this really free?</h3>
              <p className="text-gray-600 leading-relaxed">
                Yes! We offer a free tier that includes basic grant matching and search functionality. We also offer premium plans with advanced features like email alerts, team collaboration, and enhanced AI recommendations.
              </p>
            </div>
            
            {/* FAQ Item 3 */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">How accurate are the AI recommendations?</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI recommendations improve over time as you interact with the platform. The more grants you save, apply for, or ignore, the better our system understands your preferences. Most users report finding highly relevant grants within their first week.
              </p>
            </div>
            
            {/* FAQ Item 4 */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Can I change my preferences later?</h3>
              <p className="text-gray-600 leading-relaxed">
                Absolutely! You can update your preferences anytime from your dashboard. Changes to your preferences will be reflected in your recommendations immediately.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
