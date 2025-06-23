"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Debug logging
  useEffect(() => {
    console.log("🏠 Home page: User state:", user);
    console.log("🏠 Home page: Loading state:", loading);
    console.log("🏠 Home page: Router available:", !!router);
  }, [user, loading, router]);

  // Function to handle plan selection
  const handlePlanSelection = (plan) => {
    console.log("💎 Home page: Plan selected:", plan);
    if (user) {
      // If user is logged in
      if (plan === 'free') {
        // Free plan - just go to dashboard (they already have access)
        console.log("📊 Home page: User logged in, free plan selected, going to dashboard");
        router.push('/dashboard');
      } else if (plan === 'pro' || plan === 'elite') {
        // Premium plan - take them to checkout to upgrade
        console.log("💳 Home page: User logged in, premium plan selected, going to checkout");
        router.push(`/checkout?plan=${plan}`);
      }
    } else {
      // If not logged in, go to signup with plan parameter
      console.log("📝 Home page: User not logged in, going to signup with plan:", plan);
      router.push(`/signup?plan=${plan}`);
    }
  };

  // Function to navigate to different sections (for internal page navigation only)
  const scrollToSection = (section) => {
    console.log("📍 Home page: Scrolling to section:", section);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn("⚠️ Home page: Section not found:", section);
    }
  };

  return (
    <>
      <Navbar />
      
      {/* Main marketing content */}
      <>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="gradient-text">Limit distractions,</span> boost productivity
                </h1>
                <p className="text-lg mb-8 text-gray-dark dark:text-gray">
                  Limiter helps you stay focused by blocking distracting websites with smart timers that pause when you switch tabs and resume when you return.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {user ? (
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-md text-center transition-colors font-medium"
                    >
                      Go to Dashboard
                    </button>
                  ) : (
                    <button 
                      onClick={() => router.push('/signup')}
                      className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-md text-center transition-colors font-medium"
                    >
                      Get Started Free
                    </button>
                  )}
                  <button 
                    onClick={() => scrollToSection('premium-plans')}
                    className="border border-gray hover:border-primary text-foreground px-6 py-3 rounded-md text-center transition-colors font-medium"
                  >
                    View Premium Plans
                  </button>
                </div>
              </div>
              <div className="relative h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full max-w-md bg-white dark:bg-gray-dark rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-light dark:border-gray-dark">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md overflow-hidden gradient-bg flex items-center justify-center text-white font-bold text-xs">L</div>
                          <span className="text-sm font-bold text-foreground">Limiter Active</span>
                        </div>
                        <span className="text-xs text-gray-dark dark:text-gray px-2 py-1 bg-gray-light dark:bg-gray-dark/30 rounded">00:30</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-2">YouTube has been blocked</h3>
                      <p className="text-sm text-gray-dark dark:text-gray mb-4">
                        You&apos;ve reached your time limit for this website. Time to focus on what matters!
                      </p>
                      <div className="flex justify-end">
                        <button className="text-sm text-primary">Learn more about Premium</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-gray-light dark:bg-gray-dark/10">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Smart features to boost your productivity</h2>
              <p className="text-gray-dark dark:text-gray max-w-2xl mx-auto">
                Limiter comes packed with powerful features designed to help you stay focused and make the most of your time.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Timers</h3>
                <p className="text-gray-dark dark:text-gray">
                  Set individual time limits for different websites. Timers pause when you switch tabs and resume when you return.
                </p>
              </div>
              
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Multi-Domain Support</h3>
                <p className="text-gray-dark dark:text-gray">
                  Block any distracting website with custom timer durations. Add unlimited domains with Premium.
                </p>
              </div>
              
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Usage Analytics</h3>
                <p className="text-gray-dark dark:text-gray">
                  Track your browsing habits and see how much time you&apos;re saving. Set goals and improve over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Plans Section */}
        <section id="premium-plans" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Choose your plan</h2>
              <p className="text-gray-dark dark:text-gray max-w-2xl mx-auto">
                Upgrade to Premium for advanced features and unlimited domain blocking.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <div className="border border-gray-light dark:border-gray-dark/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <p className="text-gray-dark dark:text-gray mb-4">Basic features for casual users </p>
                <div className="text-3xl font-bold mb-6">$0 <span className="text-sm font-normal text-gray-dark dark:text-gray">/month</span></div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>1 device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Track 3 websites/apps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>1-hour fixed lockout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>$1.99 per override</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>No AI features</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => handlePlanSelection('free')}
                  className="block w-full py-2 px-4 bg-gray-light dark:bg-gray-dark/30 text-foreground text-center rounded-md hover:bg-gray transition-colors"
                >
                  {user ? 'Go to Dashboard' : 'Sign Up Free'}
                </button>
              </div>
              
              {/* Pro Plan */}
              <div className="border-2 border-primary rounded-xl p-6 relative shadow-lg">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-gray-dark dark:text-gray mb-4">Advanced features for focused individuals</p>
                <div className="text-3xl font-bold mb-6">$4.99 <span className="text-sm font-normal text-gray-dark dark:text-gray">/month</span></div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Up to 3 devices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Unlimited time tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Custom lockout durations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>15 free overrides/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>AI nudges + sync + basic reports</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => handlePlanSelection('pro')}
                  className="block w-full py-2 px-4 bg-primary text-white text-center rounded-md hover:bg-primary-light transition-colors"
                >
                  {user ? 'Upgrade to Pro' : 'Get Pro'}
                </button>
              </div>
              
              {/* Elite Plan */}
              <div className="border border-gray-light dark:border-gray-dark/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-2">Elite</h3>
                <p className="text-gray-dark dark:text-gray mb-4">Ultimate features for power users</p>
                <div className="text-3xl font-bold mb-6">$11.99 <span className="text-sm font-normal text-gray-dark dark:text-gray">/month</span></div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Up to 10 devices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Unlimited overrides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>AI usage insights + journaling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>90-day encrypted usage history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Smart AI recommendations</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => handlePlanSelection('elite')}
                  className="block w-full py-2 px-4 bg-accent text-white text-center rounded-md hover:bg-accent/90 transition-colors"
                >
                  {user ? 'Upgrade to Elite' : 'Get Elite'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-gray-light dark:bg-gray-dark/10 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">What our users say</h2>
              <p className="text-gray-dark dark:text-gray max-w-2xl mx-auto">
                Thousands of users rely on Limiter to stay focused and productive.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-light text-white flex items-center justify-center font-bold">
                    JD
                  </div>
                  <div>
                    <h4 className="font-semibold">John Doe</h4>
                    <p className="text-xs text-gray-dark dark:text-gray">Software Developer</p>
                  </div>
                </div>
                <p className="text-gray-dark dark:text-gray">
                  Limiter has transformed how I work. I used to waste hours on social media, but now I&apos;m able to stay focused and get more done.
                </p>
                <div className="mt-4 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                    JS
                  </div>
                  <div>
                    <h4 className="font-semibold">Jane Smith</h4>
                    <p className="text-xs text-gray-dark dark:text-gray">Marketing Specialist</p>
                  </div>
                </div>
                <p className="text-gray-dark dark:text-gray">
                  The Premium plan is worth every penny. I love being able to customize schedules for different types of work days. Game changer!
                </p>
                <div className="mt-4 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                    RJ
                  </div>
                  <div>
                    <h4 className="font-semibold">Robert Johnson</h4>
                    <p className="text-xs text-gray-dark dark:text-gray">Student</p>
                  </div>
                </div>
                <p className="text-gray-dark dark:text-gray">
                  As a student, it&apos;s so easy to get distracted online. Limiter helps me stay on track with my studies and avoid procrastination.
                </p>
                <div className="mt-4 flex">
                  {[1, 2, 3, 4, 5].map((star, i) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${i < 4 ? 'text-yellow-400' : 'text-gray'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-background rounded-xl p-8 md:p-12 shadow-lg border border-gray-light dark:border-gray-dark/30 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to boost your productivity?</h2>
              <p className="text-gray-dark dark:text-gray max-w-xl mx-auto mb-8">
                Join thousands of users who have improved their focus and productivity with Limiter.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => user ? router.push('/dashboard') : router.push('/signup')}
                  className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-md text-center transition-colors font-medium"
                >
                  {user ? 'Go to Dashboard' : 'Get Started Free'}
                </button>
                <Link 
                  href="/chrome-extension" 
                  className="border border-gray hover:border-primary text-foreground px-6 py-3 rounded-md text-center transition-colors font-medium"
                >
                  Get Chrome Extension
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
      
      <Footer />
    </>
  );
}
