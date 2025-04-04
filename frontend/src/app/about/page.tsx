"use client";

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';

export default function AboutUs() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">About Grantify.ai</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Democratizing access to grant opportunities for researchers, students, and organizations through AI-powered matching and streamlined applications.
            </p>
          </div>
          
          {/* Mission Section */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 shadow-sm">
              <h2 className="text-2xl font-bold text-blue-800 mb-6">Our Mission</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Grantify.ai was born from a conversation with my dad. He had an innovative idea but was struggling to find
                  appropriate grants to fund it. Hearing about his frustrations with navigating complex grant websites and
                  understanding eligibility requirements, I realized this was a common problem that needed solving.
                </p>
                <p>
                  As a student at UC Riverside, I've experienced firsthand how difficult it can be to find and secure funding
                  for projects and research. My mission is to democratize access to grant opportunities for researchers, students,
                  non-profits, educational institutions, and businesses.
                </p>
                <p className="font-medium text-blue-700">
                  By removing barriers to grant discovery and application, I aim to fuel innovation and positive change
                  across all sectors, starting with my fellow students.
                </p>
              </div>
            </div>
          </section>
          
          {/* Features Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Recommendations</h3>
                <p className="text-gray-600">
                  AI-powered system analyzes your preferences to recommend grants matching your interests and eligibility criteria.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Agentic AI Processing</h3>
                <p className="text-gray-600">
                  Advanced AI automatically extracts critical information from grant listings, making them easier to understand.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Database</h3>
                <p className="text-gray-600">
                  Access thousands of grants from federal agencies, foundations, and private organizations in one place.
                </p>
              </div>
            </div>
          </section>
          
          {/* How It Works Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Create Your Profile</h3>
                    <p className="text-gray-600">
                      Sign up and set your preferences including research topics, funding range,
                      and eligible applicant types to receive tailored grant recommendations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Discover Opportunities</h3>
                    <p className="text-gray-600">
                      Browse through recommended grants or use our advanced search to find
                      specific opportunities that match your criteria.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Save and Apply</h3>
                    <p className="text-gray-600">
                      Save interesting grants to your dashboard, track application deadlines,
                      and mark grants as applied when you submit your application.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 text-white font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Secure Funding</h3>
                    <p className="text-gray-600">
                      Increase your chances of success with our targeted recommendations
                      and streamlined application tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Founder Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Meet the Founder</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white flex flex-col items-center justify-center">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mb-4">
                    MC
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-center">Michael Chen</h3>
                  <p className="text-blue-100 text-center text-sm">Computer Science Major</p>
                  <p className="text-blue-100 text-center text-sm">UC Riverside '26</p>
                  <div className="mt-4">
                    <span className="bg-white text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full mr-2">
                      AMD Pervasive AI Contest Winner
                    </span>
                  </div>
                </div>
                
                <div className="md:w-2/3 p-8">
                  <p className="text-gray-700 mb-4">
                    Hi there! I created Grantify.ai after seeing how challenging it was for my dad and fellow students to navigate
                    the complex world of grants. With my background in AI and web development, I wanted to build something that
                    would make this process easier for everyone.
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Background</h4>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                      <li>Third-year Computer Science Major, Entrepreneurship & Strategy Minor</li>
                      <li>Founder of AI at UCR (AIR)</li>
                      <li>Passionate about making technology accessible to everyone</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Achievements</h4>
                    <p className="text-gray-600">
                      Awarded the University Program Award at the AMD Pervasive AI Developer Contest for my project
                      PHiLIP (Personalized Human in Loop Image Production), showcased at the AMD Advancing
                      AI Event in San Francisco.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Contact Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-8 text-center">Get in Touch</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <p className="text-gray-600 mb-6">
                    Have questions, feedback, or suggestions about Grantify.ai? I'd love to hear from you!
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a href="mailto:michaelluochen1@gmail.com" className="text-blue-600 hover:underline font-medium">
                          michaelluochen1@gmail.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">LinkedIn</p>
                        <a
                          href="https://www.linkedin.com/in/michael-luo-chen"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          linkedin.com/in/michael-luo-chen
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-1/2 md:border-l md:border-gray-200 md:pl-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Opportunities</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
                    <p className="text-gray-700 mb-3">
                      I'm actively seeking paid internships and entry-level positions in:
                    </p>
                    <ul className="list-disc pl-5 mb-3 text-gray-700 space-y-1">
                      <li>Software Engineering</li>
                      <li>AI/ML Development</li>
                      <li>Web Development</li>
                      <li>Data Science</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-center">
                    <Link
                      href="/"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors hover:bg-blue-700 text-center w-full md:w-auto"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
