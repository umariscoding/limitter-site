"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth,
  signUp as firebaseSignUp,
  logIn as firebaseLogIn,
  logOut as firebaseLogOut,
  getCurrentUser,
  getUserProfile, 
  createUserProfile, 
  updateUserProfile,
  addBlockedSite,
  getBlockedSites,
  updateBlockedSite,
  removeBlockedSite,
  getUserSubscription,
  createSubscription,
} from '../lib/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [blockedSites, setBlockedSites] = useState([]);
  const authStatePromiseResolvers = useRef([]);

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
        
        authStatePromiseResolvers.current.forEach(resolve => resolve(null));
        authStatePromiseResolvers.current = [];
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
      
      // Resolve any pending auth state promises
      authStatePromiseResolvers.current.forEach(resolve => resolve(newUser));
      authStatePromiseResolvers.current = [];
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
      
      // Resolve any pending auth state promises with fallback user
      authStatePromiseResolvers.current.forEach(resolve => resolve(fallbackUser));
      authStatePromiseResolvers.current = [];
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
        // Remove this resolver from the array
        authStatePromiseResolvers.current = authStatePromiseResolvers.current.filter(
          r => r !== resolverWithTimeout
        );
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

      console.log("🚫 Adding blocked site...");
      const newSite = await addBlockedSite(user.uid, siteData);
      
      // Refresh blocked sites and stats
      await refreshUserData();
      
      return { success: true, site: newSite };
    } catch (error) {
      console.error("❌ Error adding blocked site:", error);
      return { success: false, error: error.message };
    }
  };

  // Update blocked site
  const updateSite = async (siteId, siteData) => {
    try {
      console.log("📝 Updating blocked site...");
      await updateBlockedSite(siteId, siteData);
      
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
      console.log("🗑️ Removing blocked site...");
      await removeBlockedSite(siteId);
      
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

      console.log("🔄 Refreshing user data...");
      
      // Reload user profile
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setUser(prev => ({ ...prev, ...userProfile }));
      }

      // Reload blocked sites
      const sites = await getBlockedSites(user.uid);
      setBlockedSites(sites);
      
      // Recalculate stats
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
      
      console.log("✅ User data refreshed");
    } catch (error) {
      console.error("❌ Error refreshing user data:", error);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 