"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth,
  signUp as firebaseSignUp,
  logIn as firebaseLogIn,
  logOut as firebaseLogOut,
  getCurrentUser,
  createUserProfile, 
  updateUserProfile,
  getUserProfile,
  getUserSubscription,
  createSubscription,
  updateSubscription,
  updateUserAnalytics,
  exportAnalyticsData
} from '../lib/firebase';
import { 
  addBlockedSite, 
  updateBlockedSite, 
  removeBlockedSite, 
  getBlockedSites 
} from '../lib/realtimeDb';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [blockedSites, setBlockedSites] = useState([]);

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔄 Auth state changed:", firebaseUser ? "User logged in" : "User logged out");
      
      if (firebaseUser) {
        await handleAuthStateChange(firebaseUser);
      } else {
        console.log("🚪 Clearing user state (logout)");
        setUser(null);
        setUserStats(null);
        setBlockedSites([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthStateChange = async (firebaseUser) => {
    setLoading(true);

    try {
      console.log("📊 Fetching user profile for UID:", firebaseUser.uid);
      
      // Wait a bit for the auth session to be fully established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get additional user data from Firestore with timeout
      console.log("⏱️ Starting getUserProfile with 8 second timeout...");
      
      const profileTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
      });
      
      const userProfile = await Promise.race([
        getUserProfile(firebaseUser.uid),
        profileTimeout
      ]);
      
      console.log("📊 User profile from database:", userProfile);
      
      // Create new user object to ensure React detects the change
      const newUser = {
        uid: firebaseUser.uid,
        id: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: userProfile?.profile_name || firebaseUser.displayName,
        ...(userProfile || {})
      };
      
      console.log("✅ Setting user state to:", newUser);
      setUser(newUser);

      // Load user's blocked sites and calculate stats
      try {
        const sites = await getBlockedSites(firebaseUser.uid);
        setBlockedSites(sites);
        
        // Calculate stats from the data we already have
        const totalSites = sites.length;
        const activeSites = sites.filter(site => site.is_blocked).length;
        const totalTimeSpent = sites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
        const todayTimeSpent = sites.reduce((sum, site) => sum + (site.time_spent_today || 0), 0);
        
        const stats = {
          totalSitesBlocked: totalSites,
          activeSitesBlocked: activeSites,
          totalTimeSaved: userProfile?.total_time_saved || 0,
          totalTimeSpent: totalTimeSpent,
          todayTimeSpent: todayTimeSpent,
          lastUpdated: new Date(),
        };
        
        setUserStats(stats);
      } catch (error) {
        console.error("❌ Error loading user data:", error);
      }
    } catch (error) {
      console.error("❌ Error getting user profile:", error);
      
      // If it's a timeout, suggest database troubleshooting
      if (error.message.includes('timeout')) {
        console.log("🔧 Timeout detected - possible Firestore rules or connection issue");
        console.log("🔧 Check your Firestore security rules and Firebase configuration");
      }
      
      // Even if profile fetch fails, keep the Firebase user
      const fallbackUser = {
        uid: firebaseUser.uid,
        id: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName,
        plan: 'free' // Default plan
      };
      console.log("⚠️ Setting fallback user state to:", fallbackUser);
      setUser(fallbackUser);
    }
    
    setLoading(false);
    console.log("✅ Auth state update complete");
  };

  const waitForAuthStateChange = (timeout = 5000) => {
    return new Promise((resolve, reject) => {
      // If not loading and user state is already settled, resolve immediately
      if (!loading) {
        resolve(user);
        return;
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('Auth state change timeout'));
      }, timeout);

      const resolverWithTimeout = (userData) => {
        clearTimeout(timeoutId);
        resolve(userData);
      };

      authStatePromiseResolvers.current.push(resolverWithTimeout);
    });
  };

  // Register new user
  const register = async (name, email, password, selectedPlan) => {
    try {
      console.log("📝 Starting user registration...");
      // Create the user in Firebase Auth and profile in Firestore
      const { user: newUser } = await firebaseSignUp(email, password, {
        name,
        plan: selectedPlan || 'free'
      });
      
      if (!newUser) {
        throw new Error('Failed to create user account');
      }
      
      console.log("✅ User created successfully:", newUser.uid);
      return { success: true, user: newUser };
    } catch (error) {
      console.error("❌ Registration error:", error);
      return { success: false, error: error.message };
    }
  };

  // Sign in existing user
  const login = async (email, password) => {
    try {
      console.log("🔐 Starting login process...");
      await firebaseLogIn(email, password);
      console.log("✅ Login successful - Firebase auth completed");
      
      // Wait for the auth state to update
      console.log("⏳ Waiting for auth state to update...");
      try {
        await waitForAuthStateChange();
        console.log("✅ Login completed successfully");
      } catch (authError) {
        console.warn("⚠️ Auth state change timeout, but login may have succeeded:", authError.message);
      }
      
      return { success: true };
    } catch (error) {
      console.error("❌ Login error:", error);
      return { success: false, error: error.message };
    }
  };

  // Sign out user
  const logout = async () => {
    try {
      console.log("🚪 Starting logout process...");
      await firebaseLogOut();
      console.log("✅ Logout successful");
      return { success: true };
    } catch (error) {
      console.error("❌ Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      console.log("📝 Updating user profile...");
      await updateUserProfile(user.uid, profileData);
      
      // Refresh user data
      await refreshUserData();
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile image (URL only - no file upload)
  const updateUserProfileImage = async (imageUrl) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      console.log("🖼️ Updating profile image URL...");
      
      // Update user profile with image URL
      await updateUserProfile(user.uid, {
        profile_image: imageUrl
      });
      
      // Refresh user data
      await refreshUserData();
      
      return { success: true, imageUrl };
    } catch (error) {
      console.error("❌ Error updating profile image:", error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile name
  const updateUserProfileName = async (name) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      console.log("📝 Updating profile name...");
      await updateUserProfile(user.uid, {
        profile_name: name
      });
      
      // Refresh user data
      await refreshUserData();
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating profile name:", error);
      return { success: false, error: error.message };
    }
  };

  // Add blocked site
  const addSite = async (siteData) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      console.log("🚫 Adding blocked site to Realtime Database...");
      const result = await addBlockedSite(user.uid, siteData);
      
      // Refresh blocked sites and stats
      await refreshUserData();
      
      return { 
        success: true, 
        site: result,
        message: result.message,
        wasReactivated: result.wasReactivated
      };
    } catch (error) {
      console.error("❌ Error adding blocked site:", error);
      return { success: false, error: error.message };
    }
  };

  // Update blocked site
  const updateSite = async (siteId, siteData) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      console.log("📝 Updating blocked site in Realtime Database...");
      await updateBlockedSite(user.uid, siteId, siteData);
      
      // Refresh blocked sites and stats
      await refreshUserData();
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating blocked site:", error);
      return { success: false, error: error.message };
    }
  };

  // Remove blocked site
  const removeSite = async (siteId) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      console.log("🗑️ Removing blocked site from Realtime Database...");
      await removeBlockedSite(user.uid, siteId);
      
      // Refresh blocked sites and stats
      await refreshUserData();
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error removing blocked site:", error);
      return { success: false, error: error.message };
    }
  };

  // Track time spent (placeholder - implement based on your needs)
  const trackTimeSpent = async (siteId, timeSpent) => {
    try {
      console.log("⏱️ Tracking time spent...");
      // Update the site with new time spent
      const site = blockedSites.find(s => s.id === siteId);
      if (site) {
        await updateBlockedSite(siteId, {
          time_spent_today: (site.time_spent_today || 0) + timeSpent,
          total_time_spent: (site.total_time_spent || 0) + timeSpent,
          access_count: (site.access_count || 0) + 1,
          last_accessed: new Date().toISOString(),
        });
        
        // Refresh user data
        await refreshUserData();
      }
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error tracking time spent:", error);
      return { success: false, error: error.message };
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    try {
      if (!user?.uid) return;

      // Get user profile from Firestore
      const userProfile = await getUserProfile(user.uid);
      setUser(prev => ({ ...prev, ...userProfile }));

      // Get blocked sites from Realtime Database
      console.log("📥 Fetching blocked sites from Realtime Database...");
      const sites = await getBlockedSites(user.uid);
      setBlockedSites(sites);

      // Get subscription from Firestore
      const subscription = await getUserSubscription(user.uid);
      setSubscription(subscription);

      // Calculate stats
      const totalSites = sites.length;
      const activeSites = sites.filter(site => site.is_active).length;
      const totalTimeSpent = sites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
      const todayTimeSpent = sites.reduce((sum, site) => sum + (site.time_spent_today || 0), 0);
      
      const stats = {
        totalSitesBlocked: totalSites,
        activeSitesBlocked: activeSites,
        totalTimeSaved: userProfile?.total_time_saved || 0,
        totalTimeSpent: totalTimeSpent,
        todayTimeSpent: todayTimeSpent,
        lastUpdated: new Date(),
      };
      
      setUserStats(stats);

      console.log("✅ User data refreshed successfully");
      return { userProfile, sites, subscription, stats };
    } catch (error) {
      console.error("❌ Error refreshing user data:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    userStats,
    blockedSites,
    register,
    login,
    logout,
    updateProfile,
    updateUserProfileImage,
    updateUserProfileName,
    addSite,
    updateSite,
    removeSite,
    trackTimeSpent,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 