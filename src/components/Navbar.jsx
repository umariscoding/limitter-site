"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { checkAdminStatus } from "../lib/firebase";
import Loader from './Loader';

export default function Navbar({ onNavigate }) {
  const { user, logout, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const router = useRouter();

  // Debug logging for user state changes
  useEffect(() => {
    console.log("🧭 Navbar: User state changed:", user);
    console.log("🧭 Navbar: Loading state:", loading);
  }, [user, loading]);

  // Check admin status when user changes
  useEffect(() => {
    const verifyAdmin = async () => {
      if (user) {
        try {
          const adminStatus = await checkAdminStatus(user.uid);
          setIsAdmin(adminStatus);
          console.log("🛠️ Navbar: Admin status:", adminStatus);
        } catch (error) {
          console.error("❌ Navbar: Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAdminLoading(false);
    };

    verifyAdmin();
  }, [user]);

  const handleNavigation = (section) => {
    console.log("🚀 Navbar: Navigation clicked:", section);
    console.log("🚀 Navbar: onNavigate prop:", onNavigate);
    
    if (onNavigate) {
      // For single page navigation (still used in main page for internal sections)
      console.log("📍 Using onNavigate for section:", section);
      onNavigate(section);
    } else {
      // For direct navigation to pages
      console.log("📍 Using router.push for section:", section);
      if (section === 'home') {
        console.log("🏠 Navigating to home");
        router.push('/');
      } else if (section === 'dashboard') {
        console.log("📊 Navigating to dashboard");
        router.push('/dashboard');
      } else if (section === 'admin') {
        console.log("🛠️ Navigating to admin panel");
        router.push('/admin');
      } else if (section === 'analytics') {
        console.log("📈 Navigating to analytics");
        router.push('/analytics');
      } else if (section === 'login') {
        console.log("🔐 Navigating to login");
        router.push('/login');
      } else if (section === 'signup') {
        console.log("📝 Navigating to signup");
        router.push('/signup');
      } else if (section === 'features') {
        console.log("⚡ Navigating to features");
        router.push('/#features');
      } else if (section === 'premium-plans') {
        console.log("💎 Navigating to pricing");
        router.push('/#premium-plans');
      } else {
        // For any other anchor links within the current page
        console.log("🔗 Scrolling to element:", section);
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      console.log("🚪 Navbar: Logout clicked");
      const result = await logout();
      if (result.success) {
        console.log("✅ Navbar: Logout successful, redirecting to home");
        router.push("/");
      }
    } catch (error) {
      console.error("❌ Navbar: Error logging out:", error);
    }
  };

  return (
    <nav className="bg-background shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div 
          onClick={() => handleNavigation('home')} 
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 relative flex flex-col items-center justify-center">
            <Image
              src="/icon16.png"
              alt="Limitter Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold text-white">Limitter</span>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex gap-8 items-center">
          <button
            onClick={() => handleNavigation('features')}
            className="text-foreground hover:text-primary-light transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => handleNavigation('premium-plans')}
            className="text-foreground hover:text-primary-light transition-colors cursor-pointer"
          >
            Pricing
          </button>

          {user ? (
            <>
              <button
                onClick={() => {
                  console.log("📊 Dashboard button clicked!");
                  handleNavigation('dashboard');
                }}
                className="text-foreground hover:text-primary-light transition-colors cursor-pointer"
              >
                Dashboard
              </button>

              {/* Admin Panel Button - Only show for admin users */}
              {!adminLoading ? (
                isAdmin && (
                  <button
                    onClick={() => {
                      console.log("🛠️ Admin Panel button clicked!");
                      handleNavigation('admin');
                    }}
                    className="text-red-600 hover:text-red-700 transition-colors font-medium cursor-pointer"
                    title="Admin Panel"
                  >
                    🛠️ Admin
                  </button>
                )
              ) : (
                <Loader size="sm" color="red" />
              )}

              <button
                onClick={handleLogout}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  console.log("🔐 Login button clicked!");
                  handleNavigation('login');
                }}
                className="text-foreground hover:text-primary-light transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => {
                  console.log("📝 Signup button clicked!");
                  handleNavigation('signup');
                }}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-foreground cursor-pointer"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="container mx-auto px-4 flex flex-col gap-4">
            <button
              onClick={() => handleNavigation('features')}
              className="text-foreground hover:text-primary-light transition-colors cursor-pointer text-left"
            >
              Features
            </button>
            <button
              onClick={() => handleNavigation('premium-plans')}
              className="text-foreground hover:text-primary-light transition-colors cursor-pointer text-left"
            >
              Pricing
            </button>

            {user ? (
              <>
                <button
                  onClick={() => handleNavigation('dashboard')}
                  className="text-foreground hover:text-primary-light transition-colors cursor-pointer text-left"
                >
                  Dashboard
                </button>

                {/* Admin Panel Button - Mobile */}
                {!adminLoading ? (
                  isAdmin && (
                    <button
                      onClick={() => handleNavigation('admin')}
                      className="text-red-600 hover:text-red-700 transition-colors font-medium cursor-pointer text-left"
                    >
                      🛠️ Admin
                    </button>
                  )
                ) : (
                  <Loader size="sm" color="red" />
                )}

                <button
                  onClick={handleLogout}
                  className="text-foreground hover:text-primary-light transition-colors cursor-pointer text-left"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation('login')}
                  className="text-foreground hover:text-primary-light transition-colors cursor-pointer text-left"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('signup')}
                  className="text-foreground hover:text-primary-light transition-colors cursor-pointer text-left"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 