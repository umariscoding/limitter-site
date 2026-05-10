"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { 
  auth,
  signUp as firebaseSignUp,
  logIn as firebaseLogIn,
  logOut as firebaseLogOut,
  getUserProfile, 
  updateUserProfile,
  addBlockedSite,
  getBlockedSites,
  updateBlockedSite,
  removeBlockedSite,
  ensureUserProfile,
} from '../lib/firebase';
import { useRouter } from 'next/navigation';
const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [blockedSites, setBlockedSites] = useState([]);
  const authStatePromiseResolvers = useRef([]);
  const router = useRouter();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.emailVerified) {
          await handleAuthStateChange(firebaseUser);
        } else {
          setUser(null);
          setUserStats(null);
          setBlockedSites([]);
          setLoading(false);
          
          authStatePromiseResolvers.current.forEach(resolve => resolve(null));
          authStatePromiseResolvers.current = [];
        }
      } else {
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
      if (firebaseUser) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const newUser = {
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName,
        };

        let userProfile = null;
        try {
          const profileTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
          });
          userProfile = await Promise.race([
            ensureUserProfile(firebaseUser.uid),
            profileTimeout
          ]);
          if (userProfile) {
            newUser.displayName = userProfile.profile_name || newUser.displayName;
            Object.assign(newUser, userProfile);
          }
        } catch (profileError) {
          console.warn("⚠️ Could not load user profile, continuing with basic auth:", profileError.message);
        }

        setUser(newUser);

        try {
          const sites = await getBlockedSites(firebaseUser.uid, true);
          setBlockedSites(sites);

          const totalSites = sites.length;
          const activeSites = sites.filter(site => site.is_active !== false).length;
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
        } catch (dataError) {
          console.warn("⚠️ Could not load user data, continuing with basic auth:", dataError.message);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Error in auth state change:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const waitForAuthStateChange = (timeout = 5000) => {
    return new Promise((resolve, reject) => {
      if (!loading) {
        resolve(user);
        return;
      }

      const timeoutId = setTimeout(() => {
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

  const register = async (name, email, password, selectedPlan) => {
    try {
      const { user: newUser } = await firebaseSignUp(email, password, {
        name,
        plan: selectedPlan || 'free'
      });
      
      if (!newUser) {
        throw new Error('Failed to create user account');
      }
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error("❌ Registration error:", error);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      await firebaseLogIn(email, password);
      try {
        await waitForAuthStateChange();
      } catch (authError) {
        console.warn("⚠️ Auth state change timeout, but login may have succeeded:", authError.message);
      }
      router.push("/dashboard");
      return { success: true };
    } catch (error) {
      console.error("❌ Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await firebaseLogOut();
      return { success: true };
    } catch (error) {
      console.error("❌ Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      await updateUserProfile(user.uid, profileData);
      await refreshUserData();
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfileImage = async (imageUrl) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      await updateUserProfile(user.uid, {
        profile_image: imageUrl
      });
      
      await refreshUserData();
      
      return { success: true, imageUrl };
    } catch (error) {
      console.error("❌ Error updating profile image:", error);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfileName = async (name) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      await updateUserProfile(user.uid, {
        profile_name: name
      });
      
      await refreshUserData();
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating profile name:", error);
      return { success: false, error: error.message };
    }
  };

  const addSite = async (siteData) => {
    try {
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      const result = await addBlockedSite(user.uid, siteData);
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

  const updateSite = async (siteId, siteData) => {
    try {
      await updateBlockedSite(siteId, siteData);
      await refreshUserData();
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating blocked site:", error);
      return { success: false, error: error.message };
    }
  };

  const removeSite = async (siteId) => {
    try {
      await removeBlockedSite(siteId);
      await refreshUserData();
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error removing blocked site:", error);
      return { success: false, error: error.message };
    }
  };

  const trackTimeSpent = async (siteId, timeSpent) => {
    try {
      const site = blockedSites.find(s => s.id === siteId);
      if (site) {
        await updateBlockedSite(siteId, {
          time_spent_today: (site.time_spent_today || 0) + timeSpent,
          total_time_spent: (site.total_time_spent || 0) + timeSpent,
          access_count: (site.access_count || 0) + 1,
          last_accessed: new Date().toISOString(),
        });
        
        await refreshUserData();
      }
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error tracking time spent:", error);
      return { success: false, error: error.message };
    }
  };

  const refreshUserData = async () => {
    try {
      if (!user?.uid) return;

      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setUser(prev => ({ ...prev, ...userProfile }));
      }

      const sites = await getBlockedSites(user.uid, true);
      setBlockedSites(sites);
      
      const totalSites = sites.length;
      const activeSites = sites.length;
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
      console.error("❌ Error refreshing user data:", error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserStats(null);
      setBlockedSites([]);
    } catch (error) {
      console.error("Error signing out:", error);
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
    signOut,
    isEmailVerified: user?.emailVerified || false,
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
