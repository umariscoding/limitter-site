import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

// Firebase configuration using direct .env values
const firebaseConfig = {
    apiKey: "AIzaSyCRcKOOzsp_nX8auUOhAFR-UVhGqIgmOjU",
    authDomain: "test-ext-ad0b2.firebaseapp.com",
    projectId: "test-ext-ad0b2",
    storageBucket: "test-ext-ad0b2.firebasestorage.app",
    messagingSenderId: "642984588666",
    appId: "1:642984588666:web:dd1fcd739567df3a4d92c3",
    measurementId: "G-B0MC8CDXCK"
};

console.log('🔍 Firebase Config Check:', {
  apiKey: firebaseConfig.apiKey?.substring(0, 20) + '...',
  projectId: firebaseConfig.projectId,
  configured: !!firebaseConfig.apiKey && !!firebaseConfig.projectId
});

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Missing Firebase configuration');
  throw new Error('Missing Firebase configuration');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const signUp = async (email, password, metadata = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await createUserProfile(user.uid, {
      email: user.email,
      ...metadata
    });

    // Create initial subscription for the user
    await createSubscription(user.uid, metadata.plan || 'free');

    console.log("✅ User profile and subscription created successfully");
    return { user };
  } catch (error) {
    console.error("Firebase signup error:", error);
    
    // Provide more specific error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already in use. Please try a different email or sign in.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format. Please check your email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    } else {
      throw new Error(error.message || 'Failed to create account. Please try again.');
    }
  }
};

export const logIn = async (email, password) => {
  try {
    console.log("🔐 Starting login process...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    console.log("✅ Login successful");
    return { user: userCredential.user };
  } catch (error) {
    console.error("Firebase login error:", error);
    
    // Provide more specific error messages
    if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format. Please check your email address.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else {
      throw new Error(error.message || 'Failed to sign in. Please try again.');
    }
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error(error.message);
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve({ data: { user } });
    });
  });
};

export const getSession = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve({ data: { session: user ? { user } : null } });
    });
  });
};

// User profile functions
export const createUserProfile = async (userId, userData) => {
  try {
    const userDoc = {
      id: userId,
      profile_name: userData.name || userData.profileName || '',
      profile_email: userData.email || '',
      profile_image: userData.profileImage || null,
      plan: userData.plan || 'free',
      total_time_saved: 0,
      total_sites_blocked: 0,
      daily_stats: {},
      weekly_stats: {},
      monthly_stats: {},
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', userId), userDoc);
    return { ...userDoc, id: userId };
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    console.log("🔍 Attempting to get user profile for:", userId);
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log("👤 User profile not found");
      return null;
    }

    const data = { id: userDoc.id, ...userDoc.data() };
    console.log("✅ User profile found:", data);
    return data;
  } catch (error) {
    console.error("❌ Error in getUserProfile:", error);
    return null;
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...userData,
      updated_at: serverTimestamp(),
    });

    // Return updated document
    const updatedDoc = await getDoc(doc(db, 'users', userId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    throw error;
  }
};

// Helper function to update user's blocked sites count
export const updateUserBlockedSitesCount = async (userId) => {
  try {
    const q = query(
      collection(db, 'blocked_sites'),
      where('user_id', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const totalSitesBlocked = querySnapshot.size;
    
    await updateDoc(doc(db, 'users', userId), {
      total_sites_blocked: totalSitesBlocked,
      updated_at: serverTimestamp(),
    });
    
    console.log(`✅ Updated user ${userId} blocked sites count: ${totalSitesBlocked}`);
    return totalSitesBlocked;
  } catch (error) {
    console.error("Error updating blocked sites count:", error);
    throw error;
  }
};

// Blocked Sites Management
export const addBlockedSite = async (userId, siteData) => {
  try {
    const siteDoc = {
      user_id: userId,
      url: siteData.url,
      name: siteData.name || siteData.url,
      
      // Time Management
      time_limit: siteData.timeLimit || 1800, // Daily limit in seconds (default 30 minutes)
      time_remaining: siteData.timeLimit || 1800, // Current remaining time in seconds
      time_spent_today: 0, // Time spent today
      last_reset_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      
      // Blocking Status
      is_blocked: false, // Will be true when time runs out
      is_active: siteData.isActive !== false, // Site monitoring enabled/disabled
      blocked_until: null, // ISO string for when blocking expires (midnight)
      
      // Configuration  
      schedule: siteData.schedule || null,
      
      // Metadata
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'blocked_sites'), siteDoc);
    
    // Update user's total blocked sites count
    await updateUserBlockedSitesCount(userId);
    
    return { id: docRef.id, ...siteDoc };
  } catch (error) {
    console.error("Error in addBlockedSite:", error);
    throw error;
  }
};

export const getBlockedSites = async (userId) => {
  try {
    console.log("🔍 Attempting to get blocked sites for:", userId);
    const q = query(
      collection(db, 'blocked_sites'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const sites = [];
    
    querySnapshot.forEach((doc) => {
      sites.push({ id: doc.id, ...doc.data() });
    });

    return sites;
  } catch (error) {
    console.error("Error in getBlockedSites:", error);
    return [];
  }
};

export const updateBlockedSite = async (siteId, siteData) => {
  try {
    // Convert camelCase to snake_case for consistency with database schema
    const updateData = {
      name: siteData.name,
      url: siteData.url,
      time_limit: siteData.timeLimit, // Convert timeLimit -> time_limit
      is_active: siteData.isActive,
      updated_at: serverTimestamp(),
    };

    await updateDoc(doc(db, 'blocked_sites', siteId), updateData);

    // Return updated document
    const updatedDoc = await getDoc(doc(db, 'blocked_sites', siteId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error in updateBlockedSite:", error);
    throw error;
  }
};

export const removeBlockedSite = async (siteId) => {
  try {
    // Get the site first to get the user_id
    const siteDoc = await getDoc(doc(db, 'blocked_sites', siteId));
    const siteData = siteDoc.data();
    
    await deleteDoc(doc(db, 'blocked_sites', siteId));
    
    // Update user's total blocked sites count
    if (siteData?.user_id) {
      await updateUserBlockedSitesCount(siteData.user_id);
    }
    
    return true;
  } catch (error) {
    console.error("Error in removeBlockedSite:", error);
    throw error;
  }
};

// Subscription functions
export const getUserSubscription = async (userId) => {
  try {
    const subscriptionDoc = await getDoc(doc(db, 'subscriptions', userId));
    
    if (!subscriptionDoc.exists()) {
      return null;
    }

    return { id: subscriptionDoc.id, ...subscriptionDoc.data() };
  } catch (error) {
    console.error("Error in getUserSubscription:", error);
    return null;
  }
};

export const createSubscription = async (userId, plan) => {
  try {
    const subscriptionDoc = {
      user_id: userId,
      plan: plan,
      status: 'active',
      started_at: serverTimestamp(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(doc(db, 'subscriptions', userId), subscriptionDoc);
    return { id: userId, ...subscriptionDoc };
  } catch (error) {
    console.error("Error in createSubscription:", error);
    throw error;
  }
};

// Enhanced statistics functions
export const getUserStatistics = async (userId) => {
  try {
    console.log("📊 Calculating user statistics for:", userId);
    
    // Get all user data in parallel
    const [userProfile, blockedSites, subscription] = await Promise.all([
      getUserProfile(userId),
      getBlockedSites(userId),
      getUserSubscription(userId)
    ]);

    // Calculate comprehensive stats
    const totalSites = userProfile.total_sites_blocked;
    const activeSites = blockedSites.filter(site => site.is_blocked !== false).length;
    const inactiveSites = blockedSites.filter(site => site.is_blocked === false).length;
    
    // Time calculations
    const totalTimeSpent = blockedSites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
    const todayTimeSpent = blockedSites.reduce((sum, site) => sum + (site.time_spent_today || 0), 0);
    const totalTimeSaved = userProfile?.total_time_saved || 0;
    
    // Access counts
    const totalAccesses = blockedSites.reduce((sum, site) => sum + (site.access_count || 0), 0);
    const averageTimePerSite = totalSites > 0 ? Math.round(totalTimeSpent / totalSites) : 0;
    

    
    // Recent activity (sites accessed in last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentActivity = blockedSites.filter(site => 
      site.last_accessed && new Date(site.last_accessed.toDate ? site.last_accessed.toDate() : site.last_accessed) > lastWeek
    ).length;

    const stats = {
      // Core stats
      totalSitesBlocked: totalSites,
      activeSitesBlocked: activeSites,
      inactiveSitesBlocked: inactiveSites,
      
      // Time stats (in minutes)
      totalTimeSpent: totalTimeSpent,
      todayTimeSpent: todayTimeSpent,
      totalTimeSaved: totalTimeSaved,
      averageTimePerSite: averageTimePerSite,
      
      // Activity stats
      totalAccesses: totalAccesses,
      recentActivity: recentActivity,
      
      // Subscription info
      userPlan: subscription?.plan || userProfile?.plan || 'free',
      subscriptionStatus: subscription?.status || 'active',
      
      // Meta
      lastUpdated: new Date(),
      hasData: totalSites > 0
    };

    console.log("✅ User statistics calculated:", stats);
    return stats;
    
  } catch (error) {
    console.error("❌ Error calculating user statistics:", error);
    
    // Return default stats on error
    return {
      totalSitesBlocked: 0,
      activeSitesBlocked: 0,
      inactiveSitesBlocked: 0,
      totalTimeSpent: 0,
      todayTimeSpent: 0,
      totalTimeSaved: 0,
      averageTimePerSite: 0,
      totalAccesses: 0,
      recentActivity: 0,
      userPlan: 'free',
      subscriptionStatus: 'active',
      lastUpdated: new Date(),
      hasData: false
    };
  }
};

// Get dashboard summary data
export const getDashboardData = async (userId) => {
  try {
    console.log("📈 Loading dashboard data for:", userId);
    
    // Fetch data directly to avoid calling getUserStatistics (prevents redundant calls)
    const [userProfile, blockedSites, subscription] = await Promise.all([
      getUserProfile(userId),
      getBlockedSites(userId),
      getUserSubscription(userId)
    ]);
    
    console.log("User Profile in getDashboardData:", userProfile);
    // Calculate stats locally
    const totalSites = userProfile.total_sites_blocked;
    console.log(blockedSites, "\nFrom getDashboardData")
    const activeSites = blockedSites.filter(site => site.is_blocked !== false).length;
    const totalTimeSpent = blockedSites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
    const todayTimeSpent = blockedSites.reduce((sum, site) => sum + (site.time_spent_today || 0), 0);
    const totalTimeSaved = userProfile?.total_time_saved || 0;
    const totalAccesses = blockedSites.reduce((sum, site) => sum + (site.access_count || 0), 0);

    // Process blocked sites for dashboard display
    const sitesPreview = blockedSites.slice(0, 5).map(site => ({
      id: site.id,
      name: site.name || site.url,
      url: site.url,
      isActive: site.is_blocked !== false,
      timeLimit: site.time_limit || 30,
      timeSpent: site.total_time_spent || 0,
      lastAccessed: site.last_accessed
    }));

    const dashboardData = {
      // Stats for cards
      stats: {
        sitesBlocked: totalSites,
        timeSaved: Math.round(totalTimeSaved / 60 * 10) / 10, // Convert to hours
        activeSites: activeSites,
        todayTime: Math.round(todayTimeSpent) // In minutes
      },
      
      // Additional insights
      insights: {
        averagePerSite: Math.round(totalTimeSpent / (totalSites || 1)),
        totalAccesses: totalAccesses,
        recentActivity: 0, // Simplified for now
        categories: {} // Simplified for now
      },
      
      // Site data
      sites: {
        total: totalSites,
        active: activeSites,
        preview: sitesPreview,
        hasData: totalSites > 0
      },
      
      // Subscription data
      subscription: {
        plan: subscription?.plan || 'free',
        status: subscription?.status || 'active',
        features: getFeaturesByPlan(subscription?.plan || 'free')
      },
      
      lastUpdated: new Date()
    };

    console.log("✅ Dashboard data loaded:", dashboardData);
    return dashboardData;
    
  } catch (error) {
    console.error("❌ Error loading dashboard data:", error);
    return null;
  }
};

// Update user's total time saved in database
export const updateUserTimeSaved = async (userId, minutesSaved) => {
  try {
    const userProfile = await getUserProfile(userId);
    const newTimeSaved = (userProfile?.total_time_saved || 0) + minutesSaved;
    
    await updateUserProfile(userId, {
      total_time_saved: newTimeSaved
    });
    
    return newTimeSaved;
  } catch (error) {
    console.error("Error updating time saved:", error);
    throw error;
  }
};

// Helper function to get features by plan
const getFeaturesByPlan = (plan) => {
  const features = {
    free: {
      devices: 1,
      sitesLimit: 3,
      overridePrice: '$1.99',
      overrideLimit: 0,
      customLockout: false,
      aiFeatures: false,
      reports: false
    },
    pro: {
      devices: 3,
      sitesLimit: 'Unlimited',
      overridePrice: 'Free',
      overrideLimit: 15,
      customLockout: true,
      aiFeatures: true,
      reports: true
    },
    elite: {
      devices: 10,
      sitesLimit: 'Unlimited',
      overridePrice: 'Free',
      overrideLimit: 'Unlimited',
      customLockout: true,
      aiFeatures: true,
      reports: true,
      insights: true,
      history: true
    }
  };
  
  return features[plan] || features.free;
};

// Time Tracking Functions for Chrome Extension Integration

// Update time spent and remaining time for a site
export const updateSiteTimeTracking = async (siteId, timeSpentSeconds) => {
  try {
    const siteDoc = await getDoc(doc(db, 'blocked_sites', siteId));
    if (!siteDoc.exists()) {
      throw new Error('Site not found');
    }

    const siteData = siteDoc.data();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we need to reset for a new day
    let timeSpentToday = siteData.time_spent_today || 0;
    let timeRemaining = siteData.time_remaining || siteData.time_limit;
    
    if (siteData.last_reset_date !== today) {
      // New day - reset counters
      timeSpentToday = 0;
      timeRemaining = siteData.time_limit;
    }
    
    // Update time spent (convert seconds to minutes)
    const timeSpentMinutes = timeSpentSeconds / 60;
    timeSpentToday += timeSpentMinutes;
    timeRemaining = Math.max(0, siteData.time_limit - timeSpentToday);
    
    // Determine if site should be blocked
    const isBlocked = timeRemaining <= 0;
    const blockedUntil = isBlocked ? getNextMidnight().toISOString() : null;
    
    await updateDoc(doc(db, 'blocked_sites', siteId), {
      time_spent_today: timeSpentToday,
      time_remaining: timeRemaining,
      is_blocked: isBlocked,
      blocked_until: blockedUntil,
      last_reset_date: today,
      updated_at: serverTimestamp(),
    });
    
    console.log(`⏱️ Updated site ${siteId}: ${timeRemaining.toFixed(1)}min remaining`);
    
    return {
      timeSpentToday,
      timeRemaining,
      isBlocked,
      blockedUntil
    };
  } catch (error) {
    console.error("Error updating site time tracking:", error);
    throw error;
  }
};

// Get current time status for all user's sites (for Chrome extension)
export const getUserSitesTimeStatus = async (userId) => {
  try {
    const q = query(
      collection(db, 'blocked_sites'),
      where('user_id', '==', userId),
      where('is_active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const sitesStatus = {};
    const today = new Date().toISOString().split('T')[0];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if we need to reset for new day
      let timeRemaining = data.time_remaining || data.time_limit;
      let isBlocked = data.is_blocked || false;
      
      if (data.last_reset_date !== today) {
        // New day - reset
        timeRemaining = data.time_limit;
        isBlocked = false;
      }
      
      sitesStatus[data.url] = {
        siteId: doc.id,
        timeLimit: data.time_limit,
        timeRemaining: timeRemaining,
        timeSpentToday: data.last_reset_date === today ? data.time_spent_today : 0,
        isBlocked: isBlocked,
        blockedUntil: data.blocked_until
      };
    });
    
    return sitesStatus;
  } catch (error) {
    console.error("Error getting user sites time status:", error);
    return {};
  }
};

// Reset all sites for a new day (can be called by cron job or manually)
export const resetDailySiteTimes = async (userId) => {
  try {
    const q = query(
      collection(db, 'blocked_sites'),
      where('user_id', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const today = new Date().toISOString().split('T')[0];
    const batch = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (data.last_reset_date !== today) {
        batch.push(
          updateDoc(doc(db, 'blocked_sites', docSnapshot.id), {
            time_remaining: data.time_limit,
            time_spent_today: 0,
            is_blocked: false,
            blocked_until: null,
            last_reset_date: today,
            updated_at: serverTimestamp(),
          })
        );
      }
    });
    
    if (batch.length > 0) {
      await Promise.all(batch);
      console.log(`🌅 Reset ${batch.length} sites for new day`);
    }
    
    return batch.length;
  } catch (error) {
    console.error("Error resetting daily site times:", error);
    throw error;
  }
};

// Helper function to get next midnight
const getNextMidnight = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}; 