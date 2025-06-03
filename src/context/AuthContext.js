"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  auth, 
  getUserProfile, 
  createUserProfile, 
  createSubscription, 
  updateUserProfile,
  updateProfileImage,
  updateProfileName,
  addBlockedSite,
  getBlockedSites,
  updateBlockedSite,
  removeBlockedSite,
  logTimeSpent,
  resetDailyStats,
  logActivity,
  getUserActivities,
  getUserStats,
  logOut, 
  signUp, 
  logIn 
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [blockedSites, setBlockedSites] = useState([]);
  const authStatePromiseResolvers = useRef([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔄 Auth state changed:", firebaseUser ? "User logged in" : "User logged out");
      console.log("Firebase user object:", firebaseUser);
      
      setLoading(true); // Set loading to true during state transition
      
      if (firebaseUser) {
        try {
          console.log("📊 Fetching user profile for UID:", firebaseUser.uid);
          // Get additional user data from Firestore
          const userProfile = await getUserProfile(firebaseUser.uid);
          console.log("📊 User profile from Firestore:", userProfile);
          
          // Create new user object to ensure React detects the change
          const newUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName,
            ...(userProfile || {})
          };
          
          console.log("✅ Setting user state to:", newUser);
          setUser(newUser);

          // Load user's blocked sites and stats
          try {
            const [sites, stats] = await Promise.all([
              getBlockedSites(firebaseUser.uid),
              getUserStats(firebaseUser.uid)
            ]);
            setBlockedSites(sites);
            setUserStats(stats);
          } catch (error) {
            console.error("❌ Error loading user data:", error);
          }
          
          // Resolve any pending auth state promises
          authStatePromiseResolvers.current.forEach(resolve => resolve(newUser));
          authStatePromiseResolvers.current = [];
        } catch (error) {
          console.error("❌ Error getting user profile:", error);
          // Even if profile fetch fails, keep the Firebase user
          const fallbackUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName
          };
          console.log("⚠️ Setting fallback user state to:", fallbackUser);
          setUser(fallbackUser);
          
          // Resolve any pending auth state promises with fallback user
          authStatePromiseResolvers.current.forEach(resolve => resolve(fallbackUser));
          authStatePromiseResolvers.current = [];
        }
      } else {
        console.log("🚪 Clearing user state (logout)");
        setUser(null);
        setUserStats(null);
        setBlockedSites([]);
        
        authStatePromiseResolvers.current.forEach(resolve => resolve(null));
        authStatePromiseResolvers.current = [];
      }
      
      setLoading(false);
      console.log("✅ Auth state update complete");
    });

    return () => unsubscribe();
  }, []);

  const waitForAuthStateChange = () => {
    return new Promise((resolve) => {
      authStatePromiseResolvers.current = [...authStatePromiseResolvers.current, resolve];
    });
  };

  // Register new user
  const register = async (name, email, password, selectedPlan) => {
    try {
      console.log("📝 Starting user registration...");
      // Create the user in Firebase Auth
      const userCredential = await signUp(email, password);
      const user = userCredential.user;
      
      console.log("👤 Created Firebase user, creating profile...");
      // Create user profile in Firestore with extended data
      await createUserProfile(user.uid, {
        name,
        email,
        plan: selectedPlan || 'free',
        profileName: name,
        profileEmail: email,
        profileImage: null
      });
      
      console.log("📋 Creating subscription...");
      // Create subscription record
      await createSubscription(user.uid, selectedPlan || 'free');
      
      console.log("⏳ Waiting for auth state to update...");
      // Wait for auth state to update
      await waitForAuthStateChange();
      
      console.log("✅ Registration completed successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Registration error:", error);
      return { success: false, error: error.message };
    }
  };

  // Sign in existing user
  const login = async (email, password) => {
    try {
      console.log("🔐 Starting login process...");
      await logIn(email, password);
      console.log("✅ Login successful - Firebase auth completed");
      
      // Wait for the auth state to update
      console.log("⏳ Waiting for auth state to update...");
      await waitForAuthStateChange();
      console.log("✅ Auth state updated, login complete");
      
      return { success: true };
    } catch (error) {
      console.error("❌ Login error:", error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log("🚪 Starting logout process...");
      await logOut();
      setUser(null); // Explicitly clear the user state
      setUserStats(null);
      setBlockedSites([]);
      console.log("✅ Logout completed");
      return { success: true };
    } catch (error) {
      console.error("❌ Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  // Profile management functions
  const updateProfile = async (profileData) => {
    if (!user?.uid) return { success: false, error: "User not authenticated" };
    
    try {
      await updateUserProfile(user.uid, profileData);
      
      // Update local user state
      setUser(prev => ({ ...prev, ...profileData }));
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfileImage = async (imageUrl) => {
    if (!user?.uid) return { success: false, error: "User not authenticated" };
    
    try {
      await updateProfileImage(user.uid, imageUrl);
      
      // Update local user state
      setUser(prev => ({ ...prev, profileImage: imageUrl }));
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating profile image:", error);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfileName = async (name) => {
    if (!user?.uid) return { success: false, error: "User not authenticated" };
    
    try {
      await updateProfileName(user.uid, name);
      
      // Update local user state
      setUser(prev => ({ ...prev, profileName: name }));
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating profile name:", error);
      return { success: false, error: error.message };
    }
  };

  // Blocked sites management
  const addSite = async (siteData) => {
    if (!user?.uid) return { success: false, error: "User not authenticated" };
    
    try {
      const siteId = await addBlockedSite(user.uid, siteData);
      
      // Refresh blocked sites list
      const updatedSites = await getBlockedSites(user.uid);
      setBlockedSites(updatedSites);
      
      // Log activity
      await logActivity(user.uid, {
        action: 'site_blocked',
        details: `Added ${siteData.name || siteData.url} to blocked sites`,
        metadata: { siteId, siteData }
      });
      
      return { success: true, siteId };
    } catch (error) {
      console.error("❌ Error adding blocked site:", error);
      return { success: false, error: error.message };
    }
  };

  const updateSite = async (siteId, siteData) => {
    if (!user?.uid) return { success: false, error: "User not authenticated" };
    
    try {
      await updateBlockedSite(siteId, siteData);
      
      // Refresh blocked sites list
      const updatedSites = await getBlockedSites(user.uid);
      setBlockedSites(updatedSites);
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating blocked site:", error);
      return { success: false, error: error.message };
    }
  };

  const removeSite = async (siteId) => {
    if (!user?.uid) return { success: false, error: "User not authenticated" };
    
    try {
      await removeBlockedSite(user.uid, siteId);
      
      // Refresh blocked sites list
      const updatedSites = await getBlockedSites(user.uid);
      setBlockedSites(updatedSites);
      
      // Log activity
      await logActivity(user.uid, {
        action: 'site_unblocked',
        details: `Removed site from blocked sites`,
        metadata: { siteId }
      });
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error removing blocked site:", error);
      return { success: false, error: error.message };
    }
  };

  // Time tracking
  const trackTimeSpent = async (siteId, timeSpent) => {
    if (!user?.uid) return { success: false, error: "User not authenticated" };
    
    try {
      await logTimeSpent(user.uid, siteId, timeSpent);
      
      // Refresh stats
      const updatedStats = await getUserStats(user.uid);
      setUserStats(updatedStats);
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error tracking time spent:", error);
      return { success: false, error: error.message };
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (!user?.uid) return;
    
    try {
      const [sites, stats] = await Promise.all([
        getBlockedSites(user.uid),
        getUserStats(user.uid)
      ]);
      setBlockedSites(sites);
      setUserStats(stats);
    } catch (error) {
      console.error("❌ Error refreshing user data:", error);
    }
  };

  // Log the current user state whenever it changes
  useEffect(() => {
    console.log("🔍 Current user state:", user);
    console.log("🔍 Loading state:", loading);
    console.log("🔍 User stats:", userStats);
    console.log("🔍 Blocked sites count:", blockedSites.length);
  }, [user, loading, userStats, blockedSites]);

  const value = {
    // Auth state
    user,
    loading,
    userStats,
    blockedSites,
    
    // Auth functions
    register,
    login,
    logout,
    
    // Profile management
    updateProfile,
    updateUserProfileImage,
    updateUserProfileName,
    
    // Site management
    addSite,
    updateSite,
    removeSite,
    
    // Time tracking
    trackTimeSpent,
    
    // Data refresh
    refreshUserData,
    
    // Helper functions
    logActivity: (activityData) => user?.uid ? logActivity(user.uid, activityData) : null,
    getUserActivities: () => user?.uid ? getUserActivities(user.uid) : Promise.resolve([]),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 