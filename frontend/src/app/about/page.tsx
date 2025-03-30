"use client";

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';

export default function AboutUs() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">About Grantify.ai</h1>
          
          {/* Mission Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">The Mission</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-700 mb-4">
                Grantify.ai was born from a conversation with my dad. He had an innovative idea but was struggling to find
                appropriate grants to fund it. Hearing about his frustrations with navigating complex grant websites and
                understanding eligibility requirements, I realized this was a common problem that needed solving.
              </p>
              <p className="text-gray-700 mb-4">
                As a student at UC Riverside, I've experienced firsthand how difficult it can be to find and secure funding
                for projects and research. My mission is to democratize access to grant opportunities for researchers, students,
                non-profits, educational institutions, and businesses. I believe that finding and
                securing funding should be accessible to everyone with innovative ideas and impactful projects.
              </p>
              <p className="text-gray-700">
                Grantify.ai leverages advanced AI technology to match users with relevant grant opportunities,
                streamline the application process, and increase the chances of securing funding. By removing
                barriers to grant discovery and application, I aim to fuel innovation and positive change
                across all sectors, starting with my fellow students.
              </p>
            </div>
          </section>
          
          {/* Features Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <h3 className="text-xl font-medium text-blue-600 mb-2">Personalized Recommendations</h3>
                  <p className="text-gray-700">
                    My AI-powered system analyzes your preferences and profile to recommend grants
                    that match your interests, expertise, and eligibility criteria.
                  </p>
                </div>
                
                <div className="flex flex-col">
                  <h3 className="text-xl font-medium text-blue-600 mb-2">Agentic AI Processing</h3>
                  <p className="text-gray-700">
                    I've implemented advanced agentic AI that automatically filters out HTML and extracts
                    critical information like contact details, phone numbers, and eligibility requirements
                    from grant listings, making them easier to understand and apply for.
                  </p>
                </div>
                
                <div className="flex flex-col">
                  <h3 className="text-xl font-medium text-blue-600 mb-2">Comprehensive Database</h3>
                  <p className="text-gray-700">
                    Access thousands of grants from federal agencies, foundations, and private
                    organizations, all in one centralized platform I've designed specifically for students and researchers.
                  </p>
                </div>
                
                <div className="flex flex-col">
                  <h3 className="text-xl font-medium text-blue-600 mb-2">Application Tracking</h3>
                  <p className="text-gray-700">
                    Easily track your saved and applied grants, with deadline reminders and
                    application status updates to help you stay organized throughout the process.
                  </p>
                </div>
                
                <div className="flex flex-col">
                  <h3 className="text-xl font-medium text-blue-600 mb-2">User-Friendly Interface</h3>
                  <p className="text-gray-700">
                    Navigate through grants effortlessly with the intuitive design I've created,
                    featuring powerful search and filter capabilities based on my own experience as a student.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* How It Works Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-4">
                    <span className="text-blue-600 font-bold text-xl">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-1">Create Your Profile</h3>
                    <p className="text-gray-700">
                      Sign up and set your preferences including research topics, funding range, 
                      and eligible applicant types to receive tailored grant recommendations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-4">
                    <span className="text-blue-600 font-bold text-xl">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-1">Discover Opportunities</h3>
                    <p className="text-gray-700">
                      Browse through recommended grants or use our advanced search to find 
                      specific opportunities that match your criteria.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-4">
                    <span className="text-blue-600 font-bold text-xl">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-1">Save and Apply</h3>
                    <p className="text-gray-700">
                      Save interesting grants to your dashboard, track application deadlines, 
                      and mark grants as applied when you submit your application.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-4">
                    <span className="text-blue-600 font-bold text-xl">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-1">Secure Funding</h3>
                    <p className="text-gray-700">
                      Increase your chances of success with our targeted recommendations 
                      and streamlined application tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Founder Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">The Founder</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center mb-6">
                <div className="md:mr-6 mb-4 md:mb-0">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                    MC
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-1">Michael Chen</h3>
                  <p className="text-gray-600 mb-2">Third-year Computer Science Major, Entrepreneurship & Strategy Minor</p>
                  <p className="text-gray-600 mb-2">UC Riverside • Graduating Spring 2026</p>
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                      AMD Pervasive AI Contest Winner
                    </span>
                  </div>
                  <p className="text-gray-700">
                    Founder of AI at UCR (AIR) and passionate about making technology accessible to everyone.
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                Hi there! I created Grantify.ai after seeing how challenging it was for my dad and fellow students to navigate
                the complex world of grants. With my background in AI and web development, I wanted to build something that
                would make this process easier for everyone.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Looking for Opportunities!</h4>
                <p className="text-gray-700 mb-2">
                  I'm currently seeking paid internships and entry-level positions in software engineering, AI/ML,
                  and web development. If you're looking for a passionate developer with experience in these areas,
                  I'd love to connect!
                </p>
                <p className="text-gray-700">
                  Feel free to reach out via email or LinkedIn (contact details below) to discuss potential opportunities.
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Personal Interests & Achievements</h4>
                <p className="text-gray-700 mb-4">
                  When I'm not coding, you can find me reading light novels, gaming, watching sports, exploring algorithmic
                  sports betting, working on automation projects, or diving into web development.
                </p>
                <p className="text-gray-700 mb-4">
                  I was awarded the University Program Award at the AMD Pervasive AI Developer Contest for my project
                  PHiLIP (Personalized Human in Loop Image Production). This project was showcased at the AMD Advancing
                  AI Event in San Francisco, demonstrating practical AI applications that solve real-world problems.
                </p>
              </div>
            </div>
          </section>
          
          {/* Contact Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h3 className="text-xl font-bold text-blue-800 mb-2">Looking for New Opportunities!</h3>
                <p className="text-gray-700 mb-3">
                  I'm actively seeking paid internships and entry-level positions in:
                </p>
                <ul className="list-disc pl-5 mb-3 text-gray-700">
                  <li>Software Engineering</li>
                  <li>AI/ML Development</li>
                  <li>Web Development (Frontend/Backend/Full-Stack)</li>
                  <li>Data Science</li>
                </ul>
                <p className="text-gray-700 font-medium">
                  If your company is hiring or you know of any opportunities, please reach out! I'm passionate about
                  building impactful solutions and would love to bring my skills to your team.
                </p>
              </div>
              
              <p className="text-gray-700 mb-4">
                Have questions, feedback, or suggestions about Grantify.ai? Or want to discuss potential job opportunities?
                I'd love to hear from you!
              </p>
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a href="mailto:michaelluochen1@gmail.com" className="text-blue-600 hover:underline">michaelluochen1@gmail.com</a>
              </div>
              <div className="flex items-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <a href="https://www.linkedin.com/in/michael-luo-chen" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">linkedin.com/in/michael-luo-chen</a>
              </div>
              <div className="flex flex-col md:flex-row md:space-x-4">
                <Link
                  href="/"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors hover:bg-blue-700 text-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}