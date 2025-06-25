import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function Features() {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6">
              Powerful features to <span className="gradient-text">boost your productivity</span>
            </h1>
            <p className="text-xl text-gray-dark dark:text-gray max-w-2xl mx-auto mb-8">
              Limitter comes packed with smart tools to help you stay focused and make the most of your time.
            </p>
          </div>
        </div>
      </section>
      
      {/* Smart Timers Feature */}
      <section className="py-16 bg-gray-light dark:bg-gray-dark/10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Smart Tracking
              </div>
              <h2 className="text-3xl font-bold mb-4">Intelligent timers that work the way you do</h2>
              <p className="text-gray-dark dark:text-gray mb-6">
                Our timers are designed to be fair and adaptive. They only count down when you&apos;re actively viewing a specific website, automatically pausing when you switch tabs and resuming when you return.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold">Domain-Specific Timers</h3>
                    <p className="text-gray-dark dark:text-gray text-sm">
                      Set different time limits for different websites. More time for useful sites, less for distracting ones.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold">Automatic Pause &amp; Resume</h3>
                    <p className="text-gray-dark dark:text-gray text-sm">
                      Timers only count down when you&apos;re actively using a site. Switch tabs, and the timer pauses automatically.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold">Cross-Session Memory</h3>
                    <p className="text-gray-dark dark:text-gray text-sm">
                      Your timer state is remembered even if you close and reopen tabs or your browser.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="relative h-[400px] rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-dark rounded-lg shadow-xl overflow-hidden max-w-sm w-full">
                  <div className="p-4 border-b border-gray-light dark:border-gray-dark">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md overflow-hidden gradient-bg flex items-center justify-center text-white font-bold text-xs">L</div>
                        <span className="text-sm font-bold text-foreground">Active Timers</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">YouTube</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">00:15</span>
                      </div>
                      <div className="w-full h-2 bg-gray-light dark:bg-gray-dark/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "30%" }}></div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Twitter</span>
                        <span className="text-xs bg-gray-light dark:bg-gray-dark/30 text-gray-dark dark:text-gray px-2 py-0.5 rounded">Paused</span>
                      </div>
                      <div className="w-full h-2 bg-gray-light dark:bg-gray-dark/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gray rounded-full" style={{ width: "70%" }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Reddit</span>
                        <span className="text-xs bg-gray-light dark:bg-gray-dark/30 text-gray-dark dark:text-gray px-2 py-0.5 rounded">Paused</span>
                      </div>
                      <div className="w-full h-2 bg-gray-light dark:bg-gray-dark/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gray rounded-full" style={{ width: "50%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Multi-Domain Support */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative h-[400px] rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-dark rounded-lg shadow-xl overflow-hidden max-w-sm w-full">
                  <div className="p-4 border-b border-gray-light dark:border-gray-dark">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md overflow-hidden gradient-bg flex items-center justify-center text-white font-bold text-xs">L</div>
                        <span className="text-sm font-bold text-foreground">Domain Management</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-4 p-3 border border-gray-light dark:border-gray-dark rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">youtube.com</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">30s</span>
                      </div>
                    </div>
                    
                    <div className="mb-4 p-3 border border-gray-light dark:border-gray-dark rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">twitter.com</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">20s</span>
                      </div>
                    </div>
                    
                    <div className="mb-4 p-3 border border-gray-light dark:border-gray-dark rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">reddit.com</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">45s</span>
                      </div>
                    </div>
                    
                    <div className="p-3 border border-dashed border-gray-light dark:border-gray-dark rounded-lg text-center text-gray">
                      <span className="text-sm">+ Add new domain</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                Multi-Domain Support
              </div>
              <h2 className="text-3xl font-bold mb-4">Block any website with custom time limits</h2>
              <p className="text-gray-dark dark:text-gray mb-6">
                Add any website to your block list and set custom time limits for each one. Premium plans allow for unlimited domains and longer timers.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold">Custom Time Limits</h3>
                    <p className="text-gray-dark dark:text-gray text-sm">
                      Set different timer durations for each domain, from 1 second up to 15 minutes (with Premium).
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold">Easy Management</h3>
                    <p className="text-gray-dark dark:text-gray text-sm">
                      Add, edit, or remove domains with just a few clicks. Simple interface makes configuration easy.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold">Domain Pattern Matching</h3>
                    <p className="text-gray-dark dark:text-gray text-sm">
                      Block entire domains and all subdomains with a single entry. Regex support coming soon.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Modern Blocking Modal */}
      <section className="py-16 bg-gray-light dark:bg-gray-dark/10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
                Modern UI
              </div>
              <h2 className="text-3xl font-bold mb-4">Beautiful, distraction-free blocking</h2>
              <p className="text-gray-dark dark:text-gray mb-6">
                When your time is up, Limitter displays a clean, modern blocking modal that can&apos;t be easily dismissed, helping you break the habit of mindless browsing.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold">Non-Dismissable Modal</h3>
                    <p className="text-gray-dark dark:text-gray text-sm">
                      Blocking modal can&apos;t be easily closed, forcing you to take a break or switch to a more productive task.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold">Motivational Content</h3>
                    <p className="text-gray-dark dark:text-gray text-sm">
                      Displays helpful productivity tips and motivational messages to keep you focused on what matters.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold">Premium Customization</h3>
                    <p className="text-gray-dark dark:text-gray text-sm">
                      Premium users can customize the appearance and content of their blocking modals.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="relative h-[400px] rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-dark rounded-lg shadow-xl overflow-hidden max-w-sm w-full">
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full gradient-bg flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Time&apos;s Up!</h3>
                    <p className="text-gray-dark dark:text-gray mb-6">
                      You&apos;ve reached your time limit for <span className="font-semibold">YouTube</span>. Time to focus on something more productive!
                    </p>
                    <div className="p-4 bg-gray-light dark:bg-gray-dark/30 rounded-lg mb-6">
                      <p className="text-sm italic">
                        The key is not to prioritize what&apos;s on your schedule, but to schedule your priorities. - Stephen Covey
                      </p>
                    </div>
                    <div>
                      <button className="text-sm text-primary">Learn more about Premium</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Analytics Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Premium Feature
            </div>
            <h2 className="text-3xl font-bold mb-4">Detailed usage analytics</h2>
            <p className="text-xl text-gray-dark dark:text-gray max-w-2xl mx-auto">
              Understand your browsing habits with comprehensive analytics and reports.
              Track your progress and see how much time you&apos;re saving.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-dark rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-light dark:border-gray-dark">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Weekly Usage Report</h3>
                <div className="text-sm text-gray-dark dark:text-gray">Last 7 days</div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-light dark:bg-gray-dark/30 rounded-lg p-4">
                  <div className="text-sm text-gray-dark dark:text-gray mb-1">Time Saved</div>
                  <div className="text-2xl font-bold">3.5 hours</div>
                  <div className="text-xs text-green-600">↑ 15% from last week</div>
                </div>
                
                <div className="bg-gray-light dark:bg-gray-dark/30 rounded-lg p-4">
                  <div className="text-sm text-gray-dark dark:text-gray mb-1">Blocks Triggered</div>
                  <div className="text-2xl font-bold">47 times</div>
                  <div className="text-xs text-green-600">↑ 8% from last week</div>
                </div>
                
                <div className="bg-gray-light dark:bg-gray-dark/30 rounded-lg p-4">
                  <div className="text-sm text-gray-dark dark:text-gray mb-1">Most Blocked Site</div>
                  <div className="text-2xl font-bold">YouTube</div>
                  <div className="text-xs text-gray-dark dark:text-gray">23 blocks</div>
                </div>
              </div>
              
              <div className="h-60 bg-gray-light dark:bg-gray-dark/30 rounded-lg flex items-center justify-center">
                <div className="text-gray-dark dark:text-gray">
                  [Usage Analytics Chart - Available in Premium]
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Grid */}
      <section className="py-16 bg-gray-light dark:bg-gray-dark/10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">More powerful features</h2>
            <p className="text-gray-dark dark:text-gray max-w-2xl mx-auto">
              Limitter is packed with features to help you stay focused and be more productive.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Activation</h3>
              <p className="text-gray-dark dark:text-gray">
                Timers start immediately when you visit a tracked site. No delay, no exceptions.
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Scheduled Blocking</h3>
              <p className="text-gray-dark dark:text-gray">
                Premium users can schedule blocks for specific times of day or days of the week.
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Tab Support</h3>
              <p className="text-gray-dark dark:text-gray">
                Open multiple tabs of the same site, and the timer still works perfectly across all of them.
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-gray-dark dark:text-gray">
                All data stays on your device. We don&apos;t track your browsing history or collect personal information.
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable</h3>
              <p className="text-gray-dark dark:text-gray">
                Adjust timer durations, customize blocking messages, and configure exceptions to match your workflow.
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Notifications</h3>
              <p className="text-gray-dark dark:text-gray">
                Get gentle reminders when you&apos;re spending too much time on distracting sites.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-background rounded-xl p-8 md:p-12 shadow-lg border border-gray-light dark:border-gray-dark/30 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to stay focused?</h2>
            <p className="text-gray-dark dark:text-gray max-w-xl mx-auto mb-8">
              Join thousands of users who have improved their productivity with Limitter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup" 
                className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-md text-center transition-colors font-medium"
              >
                Get Started Free
              </Link>
              <Link 
                href="/#pricing" 
                className="border border-gray hover:border-primary text-foreground px-6 py-3 rounded-md text-center transition-colors font-medium"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
} 