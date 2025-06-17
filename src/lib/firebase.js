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
  serverTimestamp, 
  limit 
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
      isAdmin: false, // Initialize admin status as false
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

// Helper function to normalize domain
const normalizeDomain = (url) => {
  try {
    // Remove protocol
    let domain = url.replace(/^https?:\/\//, '');
    // Remove www prefix
    domain = domain.replace(/^www\./, '');
    // Remove trailing slash and path
    domain = domain.split('/')[0];
    // Convert to lowercase
    return domain.toLowerCase();
  } catch (error) {
    console.error('Error normalizing domain:', error);
    return url;
  }
};

// Helper function to update user's blocked sites count (only active sites)
export const updateUserBlockedSitesCount = async (userId) => {
  try {
    const q = query(
      collection(db, 'blocked_sites'),
      where('user_id', '==', userId),
      where('is_active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const totalSitesBlocked = querySnapshot.size;
    
    await updateDoc(doc(db, 'users', userId), {
      total_sites_blocked: totalSitesBlocked,
      updated_at: serverTimestamp(),
    });
    
    console.log(`✅ Updated user ${userId} blocked sites count: ${totalSitesBlocked} (active only)`);
    return totalSitesBlocked;
  } catch (error) {
    console.error("Error updating blocked sites count:", error);
    throw error;
  }
};

// Blocked Sites Management
export const addBlockedSite = async (userId, siteData) => {
  try {
    const normalizedDomain = normalizeDomain(siteData.url);
    const documentId = `${userId}_${normalizedDomain}`;
    
    // Check if site already exists (including inactive ones)
    const existingDoc = await getDoc(doc(db, 'blocked_sites', documentId));
    
    if (existingDoc.exists()) {
      const existingData = existingDoc.data();
      
      // If site exists but is inactive, reactivate it
      if (!existingData.is_active) {
        const updateData = {
          is_active: true,
          name: siteData.name || existingData.name || normalizedDomain,
          time_limit: siteData.timeLimit || existingData.time_limit || 1800,
          updated_at: serverTimestamp(),
        };
        
        // Reset daily time if needed
        const today = new Date().toISOString().split('T')[0];
        if (existingData.last_reset_date !== today) {
          updateData.time_remaining = updateData.time_limit;
          updateData.time_spent_today = 0;
          updateData.last_reset_date = today;
          updateData.is_blocked = false;
          updateData.blocked_until = null;
        }
        
        await updateDoc(doc(db, 'blocked_sites', documentId), updateData);
        
        // Update user's total blocked sites count (stored count for reference)
        await updateUserBlockedSitesCount(userId);
        
        return { 
          id: documentId, 
          ...existingData, 
          ...updateData,
          wasReactivated: true,
          message: 'Website already added in the past. Reactivated with preserved settings.'
        };
      } else {
        // Site exists and is already active
        return {
          id: documentId,
          ...existingData,
          wasReactivated: false,
          message: 'This website is already being tracked.'
        };
      }
    }
    
    // Create new site document
    const siteDoc = {
      user_id: userId,
      url: normalizedDomain,
      name: siteData.name || normalizedDomain,
      
      // Time Management
      time_limit: siteData.timeLimit || 1800, // Daily limit in seconds (default 30 minutes)
      time_remaining: siteData.timeLimit || 1800, // Current remaining time in seconds
      time_spent_today: 0, // Time spent today in seconds
      last_reset_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      
      // Status Fields
      is_blocked: false, // Whether the site is currently blocked
      is_active: siteData.isActive !== false, // Whether monitoring is enabled
      blocked_until: null, // ISO timestamp when blocking expires (null if not blocked)
      
      // Scheduling & Advanced Features
      schedule: siteData.schedule || null, // Time-based blocking schedule configuration
      
      // Usage Analytics
      daily_usage: {}, // Object tracking daily usage by date
      total_time_spent: 0, // Lifetime total time spent on this site
      access_count: 0, // Number of times the site was accessed
      last_accessed: null, // Last access timestamp
      
      // Override System
      override_active: false, // Whether an override is currently active
      override_initiated_by: null, // Device ID that initiated the override
      override_initiated_at: null, // When the override was initiated
      
      // Timestamps
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(doc(db, 'blocked_sites', documentId), siteDoc);
    
    // Update user's total blocked sites count (stored count for reference)
    await updateUserBlockedSitesCount(userId);
    
    return { 
      id: documentId, 
      ...siteDoc, 
      wasReactivated: false,
      message: 'Website added successfully.'
    };
  } catch (error) {
    console.error("Error in addBlockedSite:", error);
    throw error;
  }
};

export const getBlockedSites = async (userId, includeInactive = false) => {
  try {
    console.log("🔍 Attempting to get blocked sites for:", userId);
    
    let q;
    if (includeInactive) {
      // Get all sites (active and inactive)
      q = query(
        collection(db, 'blocked_sites'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
    } else {
      // Get only active sites (default behavior)
      q = query(
        collection(db, 'blocked_sites'),
        where('user_id', '==', userId),
        where('is_active', '==', true),
        orderBy('created_at', 'desc')
      );
    }
    
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
      ...siteData,
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
    if (!siteDoc.exists()) {
      throw new Error('Site not found');
    }
    
    const siteData = siteDoc.data();
    
    // Soft delete: set is_active to false instead of deleting document
    await updateDoc(doc(db, 'blocked_sites', siteId), {
      is_active: false,
      updated_at: serverTimestamp(),
    });
    
    // Update user's total blocked sites count (count only active sites)
    if (siteData?.user_id) {
      await updateUserBlockedSitesCount(siteData.user_id);
    }
    
    return true;
  } catch (error) {
    console.error("Error in removeBlockedSite:", error);
    throw error;
  }
};

// Get all blocked sites including inactive ones (for admin/debugging)
export const getAllBlockedSites = async (userId) => {
  return await getBlockedSites(userId, true);
};

// Get blocked site by domain
export const getBlockedSiteByDomain = async (userId, domain) => {
  try {
    const normalizedDomain = normalizeDomain(domain);
    const documentId = `${userId}_${normalizedDomain}`;
    
    const siteDoc = await getDoc(doc(db, 'blocked_sites', documentId));
    if (siteDoc.exists()) {
      return { id: siteDoc.id, ...siteDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error in getBlockedSiteByDomain:", error);
    return null;
  }
};

// Update site usage analytics
export const updateSiteUsageAnalytics = async (userId, domain, timeSpentSeconds) => {
  try {
    const normalizedDomain = normalizeDomain(domain);
    const documentId = `${userId}_${normalizedDomain}`;
    
    const siteDoc = await getDoc(doc(db, 'blocked_sites', documentId));
    if (!siteDoc.exists()) {
      console.warn(`Site ${domain} not found for user ${userId}`);
      return null;
    }

    const siteData = siteDoc.data();
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily usage
    const dailyUsage = siteData.daily_usage || {};
    dailyUsage[today] = (dailyUsage[today] || 0) + timeSpentSeconds;
    
    // Update other analytics
    const updateData = {
      daily_usage: dailyUsage,
      total_time_spent: (siteData.total_time_spent || 0) + timeSpentSeconds,
      access_count: (siteData.access_count || 0) + 1,
      last_accessed: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await updateDoc(doc(db, 'blocked_sites', documentId), updateData);
    
    return updateData;
  } catch (error) {
    console.error("Error updating site usage analytics:", error);
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
    console.log(`📝 Creating subscription for user ${userId} with plan: ${plan}`);
    
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
    
    console.log(`✅ Subscription document created for user ${userId}`);
    return { id: userId, ...subscriptionDoc };
  } catch (error) {
    console.error("Error in createSubscription:", error);
    throw error;
  }
};

export const updateUserSubscription = async (userId, plan) => {
  try {
    console.log(`🔄 Updating subscription for user ${userId} to ${plan} plan`);
    
    // Get current plan for comparison
    const currentUser = await getUserProfile(userId);
    const previousPlan = currentUser?.plan || 'free';
    
    // First check if subscription exists
    const existingSubscription = await getUserSubscription(userId);
    
    if (existingSubscription) {
      // Update existing subscription
      const updateData = {
        plan: plan,
        status: 'active',
        updated_at: serverTimestamp(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };
      
      await updateDoc(doc(db, 'subscriptions', userId), updateData);
      
      // Update user profile with new plan
      await updateDoc(doc(db, 'users', userId), {
        plan: plan,
        updated_at: serverTimestamp(),
      });
      
      // Grant full plan benefits (like buying the package)
      await grantPlanBenefits(userId, plan, previousPlan, "Website plan upgrade");
      
      // Log activity for user about plan change
      const planNames = { 
        free: 'Free', 
        pro: 'Pro', 
        elite: 'Elite' 
      };
      
      const benefitsText = plan === 'elite' 
        ? 'unlimited overrides'
        : plan === 'pro' 
          ? '15 free overrides/month'
          : 'basic features';
      
      await addUserActivity(userId, {
        type: 'plan_upgrade',
        description: `Plan upgraded to ${planNames[plan]} (${benefitsText})`,
        icon: '💎',
        color: 'purple',
        data: {
          previousPlan,
          newPlan: plan,
          upgradedBy: 'user',
          upgradeSource: 'website',
          benefits: benefitsText
        }
      });
      
      console.log("✅ Subscription updated successfully with full plan benefits granted");
      return { id: userId, ...existingSubscription, ...updateData };
    } else {
      // Create new subscription if doesn't exist
      console.log(`📝 Creating new subscription for user ${userId}`);
      const newSubscription = await createSubscription(userId, plan);
      
      // Update user profile with new plan
      await updateDoc(doc(db, 'users', userId), {
        plan: plan,
        updated_at: serverTimestamp(),
      });
      
      // Grant full plan benefits for new subscription
      await grantPlanBenefits(userId, plan, previousPlan, "New plan subscription");
      
      // Log activity for user about plan change
      const planNames = { 
        free: 'Free', 
        pro: 'Pro', 
        elite: 'Elite' 
      };
      
      const benefitsText = plan === 'elite' 
        ? 'unlimited overrides'
        : plan === 'pro' 
          ? '15 free overrides/month'
          : 'basic features';
      
      await addUserActivity(userId, {
        type: 'plan_subscription',
        description: `Subscribed to ${planNames[plan]} plan (${benefitsText})`,
        icon: '🎉',
        color: 'green',
        data: {
          previousPlan,
          newPlan: plan,
          upgradedBy: 'user',
          upgradeSource: 'website',
          benefits: benefitsText
        }
      });
      
      console.log("✅ New subscription created successfully with full plan benefits granted");
      return newSubscription;
    }
  } catch (error) {
    console.error("Error in updateUserSubscription:", error);
    throw error;
  }
};

// Override Management Functions
export const getUserOverrideStats = async (userId) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const overrideDoc = await getDoc(doc(db, 'user_overrides', userId));
    
    if (!overrideDoc.exists()) {
      // Create initial override document
      const initialData = {
        user_id: userId,
        // Override tracking
        overrides: 0,                    // Current override balance (all overrides available)
        total_overrides_purchased: 0,   // Total overrides ever purchased (for history)
        overrides_used_total: 0,        // Total overrides ever used (for history)
        // Monthly usage tracking
        monthly_stats: {
          [currentMonth]: {
            overrides_used: 0,
            total_spent_this_month: 0
          }
        },
        // Overall stats
        total_spent: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      await setDoc(doc(db, 'user_overrides', userId), initialData);
      return initialData;
    }
    
    const data = overrideDoc.data();
    
    // Ensure current month exists
    if (!data.monthly_stats || !data.monthly_stats[currentMonth]) {
      const updatedMonthlyStats = {
        ...data.monthly_stats,
        [currentMonth]: {
          free_overrides_used: 0,
          purchased_overrides_used: 0,
          total_spent_this_month: 0
        }
      };
      
      await updateDoc(doc(db, 'user_overrides', userId), {
        monthly_stats: updatedMonthlyStats,
        // Ensure override fields exist - preserve unlimited (-1) values
        overrides: data.overrides !== undefined ? data.overrides : (data.purchased_overrides || data.override_credits || 0),
        overrides_left: data.overrides_left !== undefined ? data.overrides_left : data.overrides,
        total_overrides_purchased: data.total_overrides_purchased || data.credits_purchased_total || 0,
        overrides_used_total: data.overrides_used_total || 0,
        updated_at: serverTimestamp()
      });
      
      return { 
        ...data, 
        monthly_stats: updatedMonthlyStats,
        overrides: data.overrides !== undefined ? data.overrides : (data.purchased_overrides || data.override_credits || 0),
        overrides_left: data.overrides_left !== undefined ? data.overrides_left : data.overrides,
        purchased_overrides: data.purchased_overrides || data.override_credits || 0,
        overrides_used_total: data.overrides_used_total || 0
      };
    }
    
    return {
      ...data,
      overrides: data.overrides !== undefined ? data.overrides : (data.purchased_overrides || data.override_credits || 0),
      overrides_left: data.overrides_left !== undefined ? data.overrides_left : data.overrides,
      total_overrides_purchased: data.total_overrides_purchased || data.credits_purchased_total || 0,
      overrides_used_total: data.overrides_used_total || 0
    };
  } catch (error) {
    console.error("Error in getUserOverrideStats:", error);
    throw error;
  }
};



// Purchase overrides - add to existing purchased overrides
export const purchaseOverrides = async (userId, quantity, paymentData) => {
  try {
    const pricePerOverride = 1.99;
    const totalPrice = quantity * pricePerOverride;
    
    console.log(`💳 Processing override purchase: ${quantity} overrides for $${totalPrice}`);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get current override stats
    const overrideStats = await getUserOverrideStats(userId);
    
    // Update override balance
    const newOverrideBalance = (overrideStats.overrides || 0) + quantity;
    const newTotalPurchased = (overrideStats.total_overrides_purchased || 0) + quantity;
    
    await updateDoc(doc(db, 'user_overrides', userId), {
      overrides: newOverrideBalance,
      total_overrides_purchased: newTotalPurchased,
      total_spent: (overrideStats.total_spent || 0) + totalPrice,
      updated_at: serverTimestamp()
    });
    
    // Create purchase history entry
    const purchaseHistoryData = {
      user_id: userId,
      overrides_purchased: quantity,
      amount_paid: totalPrice,
      price_per_override: pricePerOverride,
      transaction_id: `ovr_buy_${Date.now()}_${userId.substring(0, 8)}`,
      payment_method: paymentData.paymentMethod || 'card',
      timestamp: serverTimestamp(),
      created_at: serverTimestamp()
    };
    
    await addDoc(collection(db, 'override_purchases'), purchaseHistoryData);
    
    console.log(`✅ Overrides purchased successfully: ${quantity} overrides`);
    
    return {
      success: true,
      transactionId: purchaseHistoryData.transaction_id,
      overridesAdded: quantity,
      newOverrideBalance,
      amount: totalPrice,
      message: `Successfully purchased ${quantity} override${quantity > 1 ? 's' : ''}!`
    };
    
  } catch (error) {
    console.error("Error in purchaseOverrides:", error);
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
    const totalSites = blockedSites.length; // Live count of active tracking sites
    const activeSites = blockedSites.length; // All returned sites are active (getBlockedSites filters for is_active == true)
    const currentlyBlockedSites = blockedSites.filter(site => site.is_blocked === true).length;
    const currentlyUnblockedSites = blockedSites.filter(site => site.is_blocked !== true).length;
    
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
      totalSitesBlocked: totalSites, // Total active tracking sites
      activeSitesBlocked: activeSites, // Same as total (all returned sites are active)
      currentlyBlockedSites: currentlyBlockedSites, // Sites currently blocked due to time limit
      currentlyUnblockedSites: currentlyUnblockedSites, // Sites not currently blocked
      
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
      currentlyBlockedSites: 0,
      currentlyUnblockedSites: 0,
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
    // Calculate stats locally - use actual active sites count (not stored count which may be stale)
    const totalSites = blockedSites.length; // Live count of active tracking sites
    console.log(blockedSites, "\nFrom getDashboardData")
    const activeSites = blockedSites.length; // All returned sites are active (getBlockedSites filters for is_active == true)
    const totalTimeSpent = blockedSites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
    const todayTimeSpent = blockedSites.reduce((sum, site) => sum + (site.time_spent_today || 0), 0);
    const totalTimeSaved = userProfile?.total_time_saved || 0;
    const totalAccesses = blockedSites.reduce((sum, site) => sum + (site.access_count || 0), 0);

    // Process blocked sites for dashboard display
    const sitesPreview = blockedSites.slice(0, 5).map(site => ({
      id: site.id,
      name: site.name || site.url,
      url: site.url,
      isActive: site.is_active !== false, // Use is_active field for tracking status
      isCurrentlyBlocked: site.is_blocked === true, // Separate field for current block status
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
export const updateSiteTimeTracking = async (userId, domain, timeSpentSeconds) => {
  try {
    const normalizedDomain = normalizeDomain(domain);
    const documentId = `${userId}_${normalizedDomain}`;
    
    const siteDoc = await getDoc(doc(db, 'blocked_sites', documentId));
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
    
    // Update time spent (timeSpentSeconds is already in seconds)
    timeSpentToday += timeSpentSeconds;
    timeRemaining = Math.max(0, siteData.time_limit - timeSpentToday);
    
    // Determine if site should be blocked
    const isBlocked = timeRemaining <= 0;
    const blockedUntil = isBlocked ? getNextMidnight().toISOString() : null;
    
    // Update daily usage analytics
    const dailyUsage = siteData.daily_usage || {};
    dailyUsage[today] = (dailyUsage[today] || 0) + timeSpentSeconds;
    
    await updateDoc(doc(db, 'blocked_sites', documentId), {
      time_spent_today: timeSpentToday,
      time_remaining: timeRemaining,
      is_blocked: isBlocked,
      blocked_until: blockedUntil,
      last_reset_date: today,
      daily_usage: dailyUsage,
      total_time_spent: (siteData.total_time_spent || 0) + timeSpentSeconds,
      access_count: (siteData.access_count || 0) + 1,
      last_accessed: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    
    console.log(`⏱️ Updated site ${documentId}: ${Math.floor(timeRemaining/60)}min remaining`);
    
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
        blockedUntil: data.blocked_until,
        overrideActive: data.override_active || false,
        overrideInitiatedBy: data.override_initiated_by,
        overrideInitiatedAt: data.override_initiated_at
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
            // Reset override status for new day
            override_active: false,
            override_initiated_by: null,
            override_initiated_at: null,
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

// Grant monthly free overrides based on subscription plan
export const grantMonthlyFreeOverrides = async (userId) => {
  try {
    const subscription = await getUserSubscription(userId);
    const userPlan = subscription?.plan || 'free';
    
    // Only Pro plan gets monthly free overrides (Elite has unlimited, Free gets none)
    if (userPlan !== 'pro') {
      return { success: true, message: 'No monthly overrides for this plan' };
    }
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const overrideStats = await getUserOverrideStats(userId);
    const monthlyStats = overrideStats.monthly_stats?.[currentMonth] || {};
    
    // Check if monthly overrides already granted
    if (monthlyStats.monthly_grant_given) {
      return { success: true, message: 'Monthly overrides already granted' };
    }
    
    const freeOverridesToGrant = 15;
    const newOverrideBalance = (overrideStats.overrides || 0) + freeOverridesToGrant;
    const newTotalOverrides = (overrideStats.total_overrides_purchased || 0) + freeOverridesToGrant;
    
    await updateDoc(doc(db, 'user_overrides', userId), {
      overrides: newOverrideBalance,
      total_overrides_purchased: newTotalOverrides, // Track free + purchased combined
      monthly_stats: {
        ...overrideStats.monthly_stats,
        [currentMonth]: {
          ...monthlyStats,
          monthly_grant_given: true,
          free_overrides_granted: freeOverridesToGrant,
          grant_date: serverTimestamp()
        }
      },
      updated_at: serverTimestamp()
    });
    
    console.log(`✅ Granted ${freeOverridesToGrant} monthly overrides to Pro user ${userId}`);
    
    return {
      success: true,
      overridesGranted: freeOverridesToGrant,
      newBalance: newOverrideBalance,
      message: `Granted ${freeOverridesToGrant} monthly overrides for Pro plan`
    };
    
  } catch (error) {
    console.error('Error granting monthly free overrides:', error);
    throw error;
  }
};

// Migration function to convert old schema to new schema
export const migrateBlockedSitesToNewSchema = async (userId) => {
  try {
    console.log(`🔄 Starting migration for user ${userId}`);
    
    // Get all existing blocked sites
    const q = query(
      collection(db, 'blocked_sites'),
      where('user_id', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const migrationTasks = [];
    const sitesToDelete = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const oldData = docSnapshot.data();
      const oldDocId = docSnapshot.id;
      
      // Generate new document ID
      const normalizedDomain = normalizeDomain(oldData.url);
      const newDocId = `${userId}_${normalizedDomain}`;
      
      // Check if new document already exists
      const newDocRef = doc(db, 'blocked_sites', newDocId);
      const newDocSnapshot = await getDoc(newDocRef);
      
      if (!newDocSnapshot.exists()) {
        // Create new document with enhanced schema
        const newSiteDoc = {
          user_id: userId,
          url: normalizedDomain,
          name: oldData.name || normalizedDomain,
          
          // Time Management (preserve existing values)
          time_limit: oldData.time_limit || 1800,
          time_remaining: oldData.time_remaining || oldData.time_limit || 1800,
          time_spent_today: oldData.time_spent_today || 0,
          last_reset_date: oldData.last_reset_date || new Date().toISOString().split('T')[0],
          
          // Status Fields (preserve existing values)
          is_blocked: oldData.is_blocked || false,
          is_active: oldData.is_active !== false,
          blocked_until: oldData.blocked_until || null,
          
          // Scheduling & Advanced Features (preserve existing)
          schedule: oldData.schedule || null,
          
          // Usage Analytics (initialize new fields)
          daily_usage: oldData.daily_usage || {},
          total_time_spent: oldData.total_time_spent || 0,
          access_count: oldData.access_count || 0,
          last_accessed: oldData.last_accessed || null,
          
          // Override System (initialize new fields)
          override_active: oldData.override_active || false,
          override_initiated_by: oldData.override_initiated_by || null,
          override_initiated_at: oldData.override_initiated_at || null,
          
          // Timestamps (preserve existing or use current)
          created_at: oldData.created_at || serverTimestamp(),
          updated_at: serverTimestamp(),
        };
        
        migrationTasks.push(setDoc(newDocRef, newSiteDoc));
        sitesToDelete.push(oldDocId);
        
        console.log(`📝 Migrating: ${oldData.url} -> ${newDocId}`);
      } else {
        console.log(`⚠️ Document already exists with new ID: ${newDocId}, skipping migration for ${oldDocId}`);
        // Still add to delete list if it's a different document
        if (oldDocId !== newDocId) {
          sitesToDelete.push(oldDocId);
        }
      }
    }
    
    // Execute all migrations
    if (migrationTasks.length > 0) {
      await Promise.all(migrationTasks);
      console.log(`✅ Created ${migrationTasks.length} new documents`);
    }
    
    // Mark old documents as inactive instead of deleting (soft delete approach)
    const deactivateOldTasks = sitesToDelete
      .filter(oldId => !oldId.includes('_')) // Only deactivate if it doesn't already have the new format
      .map(oldId => updateDoc(doc(db, 'blocked_sites', oldId), {
        is_active: false,
        updated_at: serverTimestamp(),
      }));
    
    if (deactivateOldTasks.length > 0) {
      await Promise.all(deactivateOldTasks);
      console.log(`🚫 Deactivated ${deactivateOldTasks.length} old documents (soft delete)`);
    }
    
    console.log(`✅ Migration completed for user ${userId}`);
    return {
      migrated: migrationTasks.length,
      deactivated: deactivateOldTasks.length,
      skipped: querySnapshot.size - migrationTasks.length - deactivateOldTasks.length
    };
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Helper function to check if a user needs migration
export const checkIfUserNeedsMigration = async (userId) => {
  try {
    const q = query(
      collection(db, 'blocked_sites'),
      where('user_id', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    let needsMigration = false;
    
    querySnapshot.forEach((doc) => {
      const docId = doc.id;
      const data = doc.data();
      
      // Check if document ID follows new format
      const expectedId = `${userId}_${normalizeDomain(data.url)}`;
      if (docId !== expectedId) {
        needsMigration = true;
      }
      
      // Check if new fields are missing
      if (!data.hasOwnProperty('daily_usage') || 
          !data.hasOwnProperty('total_time_spent') || 
          !data.hasOwnProperty('access_count') || 
          !data.hasOwnProperty('override_active')) {
        needsMigration = true;
      }
    });
    
    return needsMigration;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};

// Analytics Functions

// Get user's analytics based on their subscription plan
export const getUserAnalytics = async (userId) => {
  try {
    console.log("📊 Fetching user analytics for:", userId);
    
    // Get user profile and subscription info
    const [userProfile, subscription] = await Promise.all([
      getUserProfile(userId),
      getUserSubscription(userId)
    ]);
    
    const plan = subscription?.plan || userProfile?.plan || 'free';
    const planLimits = getPlanAnalyticsLimits(plan);
    
    // Fetch analytics data based on plan limits
    const [
      siteAnalytics,
      overrideStats,
      usageHistory,
      timeSpentAnalytics
    ] = await Promise.all([
      getSiteAnalytics(userId, planLimits.historyDays),
      getOverrideAnalytics(userId, plan),
      getUsageHistory(userId, planLimits.historyDays),
      getTimeSpentAnalytics(userId, planLimits.historyDays)
    ]);
    
    return {
      plan,
      planLimits,
      user: {
        totalTimeSaved: userProfile?.total_time_saved || 0,
        totalSitesBlocked: userProfile?.total_sites_blocked || 0,
        dailyStats: userProfile?.daily_stats || {},
        weeklyStats: userProfile?.weekly_stats || {},
        monthlyStats: userProfile?.monthly_stats || {}
      },
      sites: siteAnalytics,
      overrides: overrideStats,
      history: usageHistory,
      timeSpent: timeSpentAnalytics,
      lastUpdated: new Date()
    };
    
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    throw error;
  }
};

// Get plan-specific analytics limitations
const getPlanAnalyticsLimits = (plan) => {
  const limits = {
    free: {
      historyDays: 7,
      detailedHistory: false,
      journaling: false,
      overrideHistory: false,
      siteBreakdown: false
    },
    pro: {
      historyDays: 30,
      detailedHistory: true,
      journaling: false,
      overrideHistory: true,
      siteBreakdown: true
    },
    elite: {
      historyDays: 90,
      detailedHistory: true,
      journaling: true,
      overrideHistory: true,
      siteBreakdown: true
    }
  };
  
  return limits[plan] || limits.free;
};

// Get site-specific analytics
export const getSiteAnalytics = async (userId, historyDays = 7) => {
  try {
    const sites = await getBlockedSites(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - historyDays);
    
    const siteAnalytics = sites.map(site => {
      // Filter daily usage to plan limits
      const filteredDailyUsage = {};
      const dailyUsage = site.daily_usage || {};
      
      Object.keys(dailyUsage).forEach(date => {
        const usageDate = new Date(date);
        if (usageDate >= cutoffDate) {
          filteredDailyUsage[date] = dailyUsage[date];
        }
      });
      
      // Calculate recent analytics
      const recentTimeSpent = Object.values(filteredDailyUsage).reduce((sum, time) => sum + time, 0);
      const averageDailyTime = recentTimeSpent / Math.max(1, Object.keys(filteredDailyUsage).length);
      
      return {
        id: site.id,
        name: site.name,
        url: site.url,
        isActive: site.is_active,
        timeLimit: site.time_limit,
        timeRemaining: site.time_remaining,
        timeSpentToday: site.time_spent_today,
        totalTimeSpent: site.total_time_spent,
        accessCount: site.access_count,
        lastAccessed: site.last_accessed,
        recentTimeSpent,
        averageDailyTime,
        dailyUsage: filteredDailyUsage,
        efficiency: calculateSiteEfficiency(site)
      };
    });
    
    return siteAnalytics.sort((a, b) => b.recentTimeSpent - a.recentTimeSpent);
    
  } catch (error) {
    console.error("Error fetching site analytics:", error);
    return [];
  }
};

// Calculate site efficiency (how well user sticks to limits)
const calculateSiteEfficiency = (site) => {
  if (!site.time_limit || site.time_limit === 0) return 100;
  
  const today = new Date().toISOString().split('T')[0];
  const todayUsage = site.daily_usage?.[today] || site.time_spent_today || 0;
  
  if (todayUsage === 0) return 100;
  
  const efficiency = Math.max(0, ((site.time_limit - todayUsage) / site.time_limit) * 100);
  return Math.round(efficiency);
};

// Get override analytics
export const getOverrideAnalytics = async (userId, plan) => {
  try {
    // Get override stats from user_overrides collection
    const overrideDoc = await getDoc(doc(db, 'user_overrides', userId));
    const overrideData = overrideDoc.exists() ? overrideDoc.data() : {};
    
    const stats = {
      currentBalance: overrideData.overrides || 0,
      creditBalance: overrideData.override_credits || 0,
      totalUsed: overrideData.overrides_used_total || 0,
      totalSpent: overrideData.total_spent || 0,
      totalPurchased: overrideData.total_overrides_purchased || 0,
      monthlyStats: overrideData.monthly_stats || {}
    };
    
    // Get detailed override history for Pro+ plans
    if (plan !== 'free') {
      try {
        const historyQuery = query(
          collection(db, 'override_history'),
          where('user_id', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        const historySnapshot = await getDocs(historyQuery);
        stats.recentHistory = historySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.warn("Override history not available:", error);
        stats.recentHistory = [];
      }
    }
    
    return stats;
    
  } catch (error) {
    console.error("Error fetching override analytics:", error);
    return {
      currentBalance: 0,
      creditBalance: 0,
      totalUsed: 0,
      totalSpent: 0,
      totalPurchased: 0,
      monthlyStats: {},
      recentHistory: []
    };
  }
};

// Get usage history analytics
export const getUsageHistory = async (userId, historyDays = 7) => {
  try {
    const sites = await getBlockedSites(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - historyDays);
    
    // Aggregate daily usage across all sites
    const dailyTotals = {};
    const siteBreakdown = {};
    
    sites.forEach(site => {
      const dailyUsage = site.daily_usage || {};
      
      Object.entries(dailyUsage).forEach(([date, timeSpent]) => {
        const usageDate = new Date(date);
        if (usageDate >= cutoffDate) {
          // Add to daily totals
          dailyTotals[date] = (dailyTotals[date] || 0) + timeSpent;
          
          // Add to site breakdown
          if (!siteBreakdown[site.name]) {
            siteBreakdown[site.name] = {};
          }
          siteBreakdown[site.name][date] = timeSpent;
        }
      });
    });
    
    // Calculate trends
    const dates = Object.keys(dailyTotals).sort();
    const totalTime = Object.values(dailyTotals).reduce((sum, time) => sum + time, 0);
    const averageDaily = totalTime / Math.max(1, dates.length);
    
    // Calculate trend (comparing first half vs second half of period)
    const midPoint = Math.floor(dates.length / 2);
    const firstHalf = dates.slice(0, midPoint);
    const secondHalf = dates.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, date) => sum + (dailyTotals[date] || 0), 0) / Math.max(1, firstHalf.length);
    const secondHalfAvg = secondHalf.reduce((sum, date) => sum + (dailyTotals[date] || 0), 0) / Math.max(1, secondHalf.length);
    
    const trend = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    
    return {
      dailyTotals,
      siteBreakdown,
      totalTime,
      averageDaily,
      trend: Math.round(trend),
      periodDays: dates.length
    };
    
  } catch (error) {
    console.error("Error fetching usage history:", error);
    return {
      dailyTotals: {},
      siteBreakdown: {},
      totalTime: 0,
      averageDaily: 0,
      trend: 0,
      periodDays: 0
    };
  }
};

// Get time spent analytics with productivity insights
export const getTimeSpentAnalytics = async (userId, historyDays = 7) => {
  try {
    const sites = await getBlockedSites(userId);
    
    // Calculate total time limits vs actual usage
    const totalLimits = sites.reduce((sum, site) => sum + (site.time_limit || 0), 0);
    const totalSpentToday = sites.reduce((sum, site) => sum + (site.time_spent_today || 0), 0);
    const totalLifetimeSpent = sites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
    
    // Calculate productivity score (how well user stays within limits)
    const productivityScore = totalLimits > 0 ? Math.max(0, ((totalLimits - totalSpentToday) / totalLimits) * 100) : 100;
    
    // Get most used sites
    const mostUsedSites = sites
      .filter(site => site.total_time_spent > 0)
      .sort((a, b) => b.total_time_spent - a.total_time_spent)
      .slice(0, 5)
      .map(site => ({
        name: site.name,
        timeSpent: site.total_time_spent,
        percentage: totalLifetimeSpent > 0 ? (site.total_time_spent / totalLifetimeSpent) * 100 : 0
      }));
    
    // Calculate time saved (theoretical time that would have been wasted)
    const estimatedTimeSaved = calculateTimeSaved(sites, historyDays);
    
    return {
      totalLimits,
      totalSpentToday,
      totalLifetimeSpent,
      productivityScore: Math.round(productivityScore),
      mostUsedSites,
      timeSaved: estimatedTimeSaved,
      averageSessionLength: calculateAverageSessionLength(sites),
      blockedSessions: calculateBlockedSessions(sites)
    };
    
  } catch (error) {
    console.error("Error fetching time spent analytics:", error);
    return {
      totalLimits: 0,
      totalSpentToday: 0,
      totalLifetimeSpent: 0,
      productivityScore: 100,
      mostUsedSites: [],
      timeSaved: 0,
      averageSessionLength: 0,
      blockedSessions: 0
    };
  }
};

// Calculate estimated time saved by blocking
const calculateTimeSaved = (sites, historyDays) => {
  const totalTimeSpent = sites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
  const totalLimits = sites.reduce((sum, site) => sum + (site.time_limit || 0), 0) * historyDays;
  
  // Estimate that users would spend 2-3x their limit without blocking
  const estimatedUnblockedUsage = totalLimits * 2.5;
  const timeSaved = Math.max(0, estimatedUnblockedUsage - totalTimeSpent);
  
  return Math.round(timeSaved);
};

// Calculate average session length
const calculateAverageSessionLength = (sites) => {
  const totalSessions = sites.reduce((sum, site) => sum + (site.access_count || 0), 0);
  const totalTime = sites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
  
  return totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;
};

// Calculate number of blocked sessions (when user hit time limit)
const calculateBlockedSessions = (sites) => {
  return sites.reduce((count, site) => {
    // Estimate blocked sessions based on how often they hit limits
    const dailyUsage = site.daily_usage || {};
    const blockedDays = Object.values(dailyUsage).filter(usage => usage >= (site.time_limit || Infinity)).length;
    return count + blockedDays;
  }, 0);
};

// Export analytics data (for Pro+ users)
export const exportAnalyticsData = async (userId, format = 'json') => {
  try {
    const analytics = await getUserAnalytics(userId);
    
    // Check if user has access to export feature
    if (analytics.plan === 'free') {
      throw new Error('Analytics export is only available for Pro and Elite subscribers');
    }
    
    const exportData = {
      exportDate: new Date().toISOString(),
      plan: analytics.plan,
      user: analytics.user,
      sites: analytics.sites,
      overrides: analytics.overrides,
      summary: {
        totalSites: analytics.sites.length,
        totalTimeSpent: analytics.timeSpent.totalLifetimeSpent,
        timeSaved: analytics.timeSpent.timeSaved,
        productivityScore: analytics.timeSpent.productivityScore
      }
    };
    
    if (format === 'csv') {
      return convertAnalyticsToCSV(exportData);
    }
    
    return exportData;
    
  } catch (error) {
    console.error("Error exporting analytics data:", error);
    throw error;
  }
};

// Convert analytics to CSV format
const convertAnalyticsToCSV = (data) => {
  const headers = Object.keys(data).join(',');
  const values = Object.values(data).map(val => 
    typeof val === 'object' ? JSON.stringify(val) : val
  ).join(',');
  return `${headers}\n${values}`;
};

// ========================================
// ADMIN FUNCTIONS
// ========================================

// Admin user management
export const getAllUsers = async () => {
  try {
    console.log("🔍 Admin: Fetching all users...");
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Admin: Found ${users.length} users`);
    return users;
  } catch (error) {
    console.error("❌ Admin error fetching users:", error);
    throw error;
  }
};

export const getUserDetails = async (userId) => {
  try {
    console.log("🔍 Admin: Fetching user details for:", userId);
    
    // Get user profile
    const userProfile = await getUserProfile(userId);
    
    // Get user subscription
    const subscription = await getUserSubscription(userId);
    
    // Get user blocked sites
    const blockedSites = await getBlockedSites(userId, true); // Include inactive
    
    // Get user override stats
    const overrideStats = await getUserOverrideStats(userId);
    
    // Get user analytics
    const analytics = await getUserAnalytics(userId);
    
    const userDetails = {
      profile: userProfile,
      subscription: subscription,
      blockedSites: blockedSites,
      overrideStats: overrideStats,
      analytics: analytics,
      summary: {
        totalSites: blockedSites?.length || 0,
        activeSites: blockedSites?.filter(site => site.is_active !== false)?.length || 0,
        currentPlan: subscription?.plan || 'free',
        overridesLeft: overrideStats?.overrides || 0,
        totalSpent: overrideStats?.total_spent || 0
      }
    };
    
    console.log("✅ Admin: User details compiled");
    return userDetails;
  } catch (error) {
    console.error("❌ Admin error fetching user details:", error);
    throw error;
  }
};

export const adminUpdateUserProfile = async (userId, updateData) => {
  try {
    console.log("🔧 Admin: Updating user profile:", userId, updateData);
    
    const userRef = doc(db, 'users', userId);
    
    // First check if user exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error(`User ${userId} not found in users collection`);
    }
    
    console.log(`📋 Current user data before update:`, userDoc.data());
    
    await updateDoc(userRef, {
      ...updateData,
      updated_at: serverTimestamp(),
    });
    
    // Verify the update worked
    const updatedDoc = await getDoc(userRef);
    console.log(`✅ Admin: User profile updated successfully. New data:`, updatedDoc.data());
    
    return await getUserProfile(userId);
  } catch (error) {
    console.error("❌ Admin error updating user profile:", error);
    throw error;
  }
};

export const adminGrantOverrides = async (userId, quantity, reason = "Admin granted") => {
  try {
    console.log(`🎁 Admin: Granting ${quantity} overrides to user ${userId}`);
    
    const overrideStatsRef = doc(db, 'user_overrides', userId);
    const overrideStatsDoc = await getDoc(overrideStatsRef);
    
    if (overrideStatsDoc.exists()) {
      const currentData = overrideStatsDoc.data();
      await updateDoc(overrideStatsRef, {
        overrides: (currentData.overrides || 0) + quantity,
        total_overrides_purchased: (currentData.total_overrides_purchased || 0) + quantity,
        updated_at: serverTimestamp(),
        last_admin_grant: {
          quantity: quantity,
          reason: reason,
          granted_at: serverTimestamp()
        }
      });
    } else {
      await setDoc(overrideStatsRef, {
        user_id: userId,
        overrides: quantity,
        total_overrides_purchased: quantity,
        overrides_used_total: 0,
        total_spent: 0,
        monthly_stats: {},
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        last_admin_grant: {
          quantity: quantity,
          reason: reason,
          granted_at: serverTimestamp()
        }
      });
    }
    
    // Log activity for user
    await addUserActivity(userId, {
      type: 'admin_override_grant',
      description: `Received ${quantity} override${quantity > 1 ? 's' : ''} from admin`,
      icon: '🎁',
      color: 'green',
      data: {
        overrides_granted: quantity,
        reason: reason,
        granted_by: 'admin'
      }
    });
    
    console.log("✅ Admin: Overrides granted successfully with activity logged");
    return await getUserOverrideStats(userId);
  } catch (error) {
    console.error("❌ Admin error granting overrides:", error);
    throw error;
  }
};

export const adminChangeUserPlan = async (userId, newPlan, reason = "Admin changed") => {
  try {
    console.log(`🔄 Admin: Changing user ${userId} plan to ${newPlan}`);
    
    // Get current plan for comparison
    const currentUser = await getUserProfile(userId);
    const previousPlan = currentUser?.plan || 'free';
    
    // Update user profile
    await adminUpdateUserProfile(userId, { plan: newPlan });
    
    // Update subscription
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (subscriptionDoc.exists()) {
      await updateDoc(subscriptionRef, {
        plan: newPlan,
        status: 'active',
        updated_at: serverTimestamp(),
        admin_change: {
          previous_plan: subscriptionDoc.data().plan,
          new_plan: newPlan,
          reason: reason,
          changed_at: serverTimestamp()
        }
      });
    } else {
      await createSubscription(userId, newPlan);
    }
    
    // Grant plan benefits including overrides (like buying the package for free)
    await grantPlanBenefits(userId, newPlan, previousPlan, reason);
    
    // Log activity for user about plan change
    const planNames = { 
      free: 'Free', 
      pro: 'Pro', 
      elite: 'Elite' 
    };
    
    const benefitsText = newPlan === 'elite' 
      ? 'unlimited overrides'
      : newPlan === 'pro' 
        ? '15 free overrides/month'
        : 'basic features';
    
    await addUserActivity(userId, {
      type: 'admin_plan_change',
      description: `Plan upgraded to ${planNames[newPlan]} by admin (${benefitsText})`,
      icon: '💎',
      color: 'purple',
      data: {
        previousPlan,
        newPlan,
        upgradedBy: 'admin',
        upgradeReason: reason,
        benefits: benefitsText
      }
    });
    
    console.log("✅ Admin: User plan changed successfully with benefits granted and activity logged");
    return await getUserSubscription(userId);
  } catch (error) {
    console.error("❌ Admin error changing user plan:", error);
    throw error;
  }
};

// Grant all benefits when plan is changed by admin (like buying the package for free)
export const grantPlanBenefits = async (userId, newPlan, previousPlan = 'free', reason = "Plan upgrade benefits") => {
  try {
    console.log(`🎁 Admin: Granting ${newPlan} plan benefits to user ${userId}`);
    
    // Define plan benefits according to specifications
    const planBenefits = {
      free: {
        overrides: 0,
        monthly_overrides: 0,
        sites_limit: 3,
        devices_limit: 1,
        lockout_duration: 3600, // 1 hour fixed
        features: ['Basic site blocking', 'Community support', '$1.99 per override']
      },
      pro: {
        overrides: 15, // Initial grant - corrected to 15
        monthly_overrides: 15, // Monthly recurring - corrected to 15
        sites_limit: -1, // unlimited
        devices_limit: 3,
        lockout_duration: -1, // custom duration/end time
        features: ['Unlimited time tracking', 'Custom lockout durations', '15 free overrides/month', 'AI nudges', 'Sync + basic reports']
      },
      elite: {
        overrides: -1, // Unlimited - special case
        monthly_overrides: -1, // Unlimited
        sites_limit: -1, // unlimited
        devices_limit: 10,
        lockout_duration: -1, // custom duration/end time
        features: ['Unlimited overrides', 'AI usage insights', 'Journaling', '90-day encrypted history', 'Smart AI recommendations']
      }
    };
    
    const newBenefits = planBenefits[newPlan] || planBenefits.free;
    const previousBenefits = planBenefits[previousPlan] || planBenefits.free;
    
    // Handle override granting logic based on plan changes
    let overridesToGrant = 0;
    let setUnlimited = false;
    let resetToZero = false;
    
    if (newPlan === 'elite') {
      // Elite gets unlimited overrides
      setUnlimited = true;
    } else if (newPlan === 'pro') {
      // Pro gets 15 overrides
      overridesToGrant = 15;
    } else if (newPlan === 'free' && previousPlan === 'elite') {
      // Downgrade from Elite to Free: reset to 0 (lose unlimited)
      resetToZero = true;
    }
    // If downgrading from Pro to Free, preserve existing override balance (don't decrease)
    
    // Apply override changes
    if (setUnlimited) {
      // For Elite plan, set unlimited overrides (represented as -1)
      console.log(`🌟 Setting unlimited overrides for Elite plan user ${userId}`);
      const overrideRef = doc(db, 'user_overrides', userId);
      await setDoc(overrideRef, {
        user_id: userId,
        overrides: -1,
        overrides_left: -1, // Unlimited
        monthly_limit: -1, // Unlimited
        total_overrides_received: -1, // Unlimited
        current_plan: newPlan,
        plan_activated_at: serverTimestamp(),
        created_at: serverTimestamp()
      }, { merge: true });
      console.log(`✅ Elite plan unlimited overrides set for user ${userId}`);
    } else if (resetToZero) {
      // Reset overrides when downgrading from Elite
      const overrideRef = doc(db, 'user_overrides', userId);
      await updateDoc(overrideRef, {
        overrides_left: 0,
        monthly_limit: 0,
        current_plan: newPlan,
        plan_downgraded_at: serverTimestamp(),
        downgrade_from: previousPlan
      });
    } else if (overridesToGrant > 0) {
      // Grant specific number of overrides
      await adminGrantOverrides(
        userId, 
        overridesToGrant, 
        `${reason} - ${newPlan.toUpperCase()} plan activation (like purchasing package)`
      );
    }
    
    // Update user profile with plan features and limits
    const userRef = doc(db, 'users', userId);
    
    console.log(`📝 Updating user profile with plan: ${newPlan} and benefits:`, newBenefits);
    
    await updateDoc(userRef, {
      plan: newPlan, // ENSURE plan is updated in users collection
      plan_features: newBenefits.features,
      sites_limit: newBenefits.sites_limit,
      devices_limit: newBenefits.devices_limit,
      lockout_duration: newBenefits.lockout_duration,
      monthly_overrides: newBenefits.monthly_overrides,
      plan_benefits_granted_at: serverTimestamp(),
      last_plan_change: {
        from: previousPlan,
        to: newPlan,
        changed_at: serverTimestamp(),
        benefits_granted: newBenefits,
        override_action: setUnlimited ? 'unlimited' : resetToZero ? 'reset' : overridesToGrant > 0 ? 'granted' : 'preserved'
      },
      updated_at: serverTimestamp()
    });
    
    // Verify the plan was updated
    const updatedUserDoc = await getDoc(userRef);
    console.log(`✅ User plan updated verification:`, updatedUserDoc.data().plan);
    
    // Update override stats to reflect new monthly allowance (only if Elite plan wasn't already set)
    if (!setUnlimited) {
      const overrideRef = doc(db, 'user_overrides', userId);
      const overrideDoc = await getDoc(overrideRef);
      
      if (overrideDoc.exists()) {
        await updateDoc(overrideRef, {
          monthly_limit: newBenefits.monthly_overrides,
          plan_upgraded_at: serverTimestamp(),
          previous_plan: previousPlan,
          current_plan: newPlan
        });
      } else {
        // Create override document if it doesn't exist
        await setDoc(overrideRef, {
          user_id: userId,
          overrides_left: newBenefits.overrides,
          monthly_limit: newBenefits.monthly_overrides,
          total_overrides_received: newBenefits.overrides,
          total_overrides_used: 0,
          current_plan: newPlan,
          plan_activated_at: serverTimestamp(),
          created_at: serverTimestamp()
        });
      }
    }
    
    // Create audit log for plan benefits
    const auditRef = collection(db, 'admin_audit');
    await addDoc(auditRef, {
      action: 'GRANT_PLAN_BENEFITS',
      admin_id: 'system', // Could be updated to actual admin ID
      target_user_id: userId,
      details: {
        previous_plan: previousPlan,
        new_plan: newPlan,
        overrides_granted: newBenefits.overrides,
        monthly_overrides: newBenefits.monthly_overrides,
        features: newBenefits.features,
        sites_limit: newBenefits.sites_limit,
        reason: reason
      },
      timestamp: serverTimestamp()
    });
    
    console.log(`✅ Admin: Successfully granted ${newPlan} benefits to user ${userId}:`, {
      overrides: newBenefits.overrides,
      monthly_overrides: newBenefits.monthly_overrides,
      sites_limit: newBenefits.sites_limit
    });
    
    return { success: true, benefits: newBenefits };
    
  } catch (error) {
    console.error("❌ Admin error granting plan benefits:", error);
    throw error;
  }
};

// Admin site management
export const adminGetAllSites = async () => {
  try {
    console.log("🔍 Admin: Fetching all blocked sites...");
    const sitesCollection = collection(db, 'blocked_sites');
    const sitesSnapshot = await getDocs(sitesCollection);
    
    const sites = [];
    sitesSnapshot.forEach((doc) => {
      sites.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Admin: Found ${sites.length} total sites`);
    return sites;
  } catch (error) {
    console.error("❌ Admin error fetching all sites:", error);
    throw error;
  }
};

export const adminSoftDeleteSite = async (siteId, reason = "Admin soft deleted") => {
  try {
    console.log(`🗑️ Admin: Soft deleting site ${siteId}`);
    
    await updateDoc(doc(db, 'blocked_sites', siteId), {
      is_active: false,
      soft_deleted_at: serverTimestamp(),
      soft_delete_reason: reason,
      updated_at: serverTimestamp()
    });
    
    console.log("✅ Admin: Site soft deleted successfully");
    return { success: true, message: "Site soft deleted" };
  } catch (error) {
    console.error("❌ Admin error soft deleting site:", error);
    throw error;
  }
};

export const adminHardDeleteSite = async (siteId, reason = "Admin hard deleted") => {
  try {
    console.log(`💥 Admin: Hard deleting site ${siteId}`);
    
    // Get site data before deletion for logging
    const siteDoc = await getDoc(doc(db, 'blocked_sites', siteId));
    const siteData = siteDoc.exists() ? siteDoc.data() : null;
    
    // Log deletion for audit trail
    if (siteData) {
      await addDoc(collection(db, 'admin_audit_log'), {
        action: 'hard_delete_site',
        site_id: siteId,
        site_data: siteData,
        reason: reason,
        deleted_at: serverTimestamp()
      });
    }
    
    // Delete the site
    await deleteDoc(doc(db, 'blocked_sites', siteId));
    
    console.log("✅ Admin: Site hard deleted successfully");
    return { success: true, message: "Site permanently deleted" };
  } catch (error) {
    console.error("❌ Admin error hard deleting site:", error);
    throw error;
  }
};

export const adminUpdateSite = async (siteId, updateData) => {
  try {
    console.log("🔧 Admin: Updating site:", siteId, updateData);
    
    await updateDoc(doc(db, 'blocked_sites', siteId), {
      ...updateData,
      updated_at: serverTimestamp(),
      admin_modified: true,
      admin_modified_at: serverTimestamp()
    });
    
    console.log("✅ Admin: Site updated successfully");
    
    // Return updated site data
    const updatedDoc = await getDoc(doc(db, 'blocked_sites', siteId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("❌ Admin error updating site:", error);
    throw error;
  }
};

// Admin database direct access
export const adminGetCollection = async (collectionName) => {
  try {
    console.log(`🔍 Admin: Fetching collection ${collectionName}...`);
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    const documents = [];
    snapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Admin: Found ${documents.length} documents in ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`❌ Admin error fetching collection ${collectionName}:`, error);
    throw error;
  }
};

export const adminUpdateDocument = async (collectionName, documentId, updateData) => {
  try {
    console.log(`🔧 Admin: Updating document ${documentId} in ${collectionName}`);
    
    await updateDoc(doc(db, collectionName, documentId), {
      ...updateData,
      admin_modified: true,
      admin_modified_at: serverTimestamp()
    });
    
    console.log("✅ Admin: Document updated successfully");
    
    // Return updated document
    const updatedDoc = await getDoc(doc(db, collectionName, documentId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error(`❌ Admin error updating document:`, error);
    throw error;
  }
};

export const adminDeleteDocument = async (collectionName, documentId, createAuditLog = true) => {
  try {
    console.log(`💥 Admin: Deleting document ${documentId} from ${collectionName}`);
    
    // Get document data before deletion for audit log
    let documentData = null;
    if (createAuditLog) {
      const docSnapshot = await getDoc(doc(db, collectionName, documentId));
      documentData = docSnapshot.exists() ? docSnapshot.data() : null;
    }
    
    // Delete the document
    await deleteDoc(doc(db, collectionName, documentId));
    
    // Create audit log
    if (createAuditLog && documentData) {
      await addDoc(collection(db, 'admin_audit_log'), {
        action: 'delete_document',
        collection: collectionName,
        document_id: documentId,
        document_data: documentData,
        deleted_at: serverTimestamp()
      });
    }
    
    console.log("✅ Admin: Document deleted successfully");
    return { success: true, message: "Document deleted" };
  } catch (error) {
    console.error(`❌ Admin error deleting document:`, error);
    throw error;
  }
};

export const adminCreateDocument = async (collectionName, documentData, customId = null) => {
  try {
    console.log(`➕ Admin: Creating document in ${collectionName}`);
    
    const dataWithTimestamp = {
      ...documentData,
      admin_created: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    let docRef;
    if (customId) {
      docRef = doc(db, collectionName, customId);
      await setDoc(docRef, dataWithTimestamp);
    } else {
      docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
    }
    
    console.log("✅ Admin: Document created successfully");
    
    // Return created document
    const createdDoc = await getDoc(docRef);
    return { id: createdDoc.id, ...createdDoc.data() };
  } catch (error) {
    console.error(`❌ Admin error creating document:`, error);
    throw error;
  }
};

// Admin analytics and statistics
export const adminGetSystemStats = async () => {
  try {
    console.log("📊 Admin: Gathering system statistics...");
    
    // Get counts from all collections
    const [users, subscriptions, blockedSites, userOverrides, auditLogs] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'subscriptions')),
      getDocs(collection(db, 'blocked_sites')),
      getDocs(collection(db, 'user_overrides')),
      getDocs(collection(db, 'admin_audit_log'))
    ]);
    
    // Calculate subscription plan distribution
    const planCounts = { free: 0, pro: 0, elite: 0 };
    subscriptions.forEach(doc => {
      const plan = doc.data().plan || 'free';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });
    
    // Calculate site statistics
    let activeSites = 0;
    let inactiveSites = 0;
    blockedSites.forEach(doc => {
      if (doc.data().is_active === false) {
        inactiveSites++;
      } else {
        activeSites++;
      }
    });
    
    // Calculate override statistics
    let totalOverrides = 0;
    let totalSpent = 0;
    userOverrides.forEach(doc => {
      const data = doc.data();
      totalOverrides += data.overrides || 0;
      totalSpent += data.total_spent || 0;
    });
    
    const stats = {
      users: {
        total: users.size,
        withSubscriptions: subscriptions.size
      },
      subscriptions: {
        total: subscriptions.size,
        byPlan: planCounts
      },
      sites: {
        total: blockedSites.size,
        active: activeSites,
        inactive: inactiveSites
      },
      overrides: {
        totalAvailable: totalOverrides,
        totalMoneySpent: totalSpent,
        usersWithOverrides: userOverrides.size
      },
      audit: {
        totalLogs: auditLogs.size
      },
      generatedAt: new Date().toISOString()
    };
    
    console.log("✅ Admin: System statistics compiled");
    return stats;
  } catch (error) {
    console.error("❌ Admin error gathering system stats:", error);
    throw error;
  }
};

// Admin search and filter functions
export const adminSearchUsers = async (searchTerm) => {
  try {
    console.log(`🔍 Admin: Searching users for: ${searchTerm}`);
    
    const users = await getAllUsers();
    
    const filteredUsers = users.filter(user => 
      user.profile_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`✅ Admin: Found ${filteredUsers.length} matching users`);
    return filteredUsers;
  } catch (error) {
    console.error("❌ Admin error searching users:", error);
    throw error;
  }
};

export const adminSearchSites = async (searchTerm) => {
  try {
    console.log(`🔍 Admin: Searching sites for: ${searchTerm}`);
    
    const sites = await adminGetAllSites();
    
    const filteredSites = sites.filter(site => 
      site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`✅ Admin: Found ${filteredSites.length} matching sites`);
    return filteredSites;
  } catch (error) {
    console.error("❌ Admin error searching sites:", error);
    throw error;
  }
};

// Check if user is admin (using isAdmin field in users collection)
export const checkAdminStatus = async (userId) => {
  try {
    console.log("🔍 Checking admin status for user:", userId);
    const userProfile = await getUserProfile(userId);
    
    // Check the isAdmin field in the user profile
    const isAdmin = userProfile?.isAdmin === true;
    
    console.log("🛠️ Admin status result:", isAdmin);
    return isAdmin;
  } catch (error) {
    console.error("❌ Error checking admin status:", error);
    return false;
  }
}; 

// Get user's recent activity for admin panel
export const getUserRecentActivity = async (userId) => {
  try {
    console.log("🔍 Admin: Fetching recent activity for user:", userId);
    
    const activities = [];
    
    // Get activities from user_activity collection (admin actions, etc.)
    const activityRef = collection(db, 'user_activity');
    const activityQuery = query(
      activityRef,
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(10)
    );
    
    try {
      const activitySnapshot = await getDocs(activityQuery);
      activitySnapshot.forEach(doc => {
        const activityData = doc.data();
        activities.push({
          type: activityData.type,
          description: activityData.description,
          timestamp: activityData.created_at,
          icon: activityData.icon || '📋',
          color: activityData.color || 'blue',
          data: activityData.data
        });
      });
    } catch (activityError) {
      console.log("No user_activity collection yet or index needed:", activityError.message);
    }
    
    // Get recent blocked sites (last 10)
    const sitesRef = collection(db, 'blocked_sites');
    const sitesQuery = query(
      sitesRef, 
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(5)
    );
    const sitesSnapshot = await getDocs(sitesQuery);
    
    sitesSnapshot.forEach(doc => {
      const site = doc.data();
      if (site.created_at) {
        activities.push({
          type: 'site_added',
          description: `Added site: ${site.name || site.url}`,
          timestamp: site.created_at,
          icon: '🌐',
          color: 'blue'
        });
      }
    });
    
    // Get recent override purchases
    const overrideRef = doc(db, 'user_overrides', userId);
    const overrideDoc = await getDoc(overrideRef);
    
    if (overrideDoc.exists()) {
      const overrideData = overrideDoc.data();
      
      // Check for recent admin grants
      if (overrideData.last_admin_grant && overrideData.last_admin_grant.granted_at) {
        activities.push({
          type: 'admin_grant',
          description: `Received ${overrideData.last_admin_grant.quantity} overrides (Admin)`,
          timestamp: overrideData.last_admin_grant.granted_at,
          icon: '🎁',
          color: 'green'
        });
      }
      
      // Add monthly stats activities
      if (overrideData.monthly_stats) {
        Object.entries(overrideData.monthly_stats).slice(-3).forEach(([month, stats]) => {
          if (stats.overrides_used > 0) {
            activities.push({
              type: 'override_used',
              description: `Used ${stats.overrides_used} override${stats.overrides_used > 1 ? 's' : ''} in ${month}`,
              timestamp: { seconds: new Date(month + '-01').getTime() / 1000 },
              icon: '⚡',
              color: 'purple'
            });
          }
        });
      }
    }
    
    // Get user profile to check last update
    const userProfile = await getUserProfile(userId);
    if (userProfile && userProfile.updated_at) {
      activities.push({
        type: 'profile_updated',
        description: 'Profile information updated',
        timestamp: userProfile.updated_at,
        icon: '👤',
        color: 'gray'
      });
    }
    
    // Sort activities by timestamp (newest first)
    activities.sort((a, b) => {
      const aTime = a.timestamp?.seconds || a.timestamp?.getTime?.() / 1000 || 0;
      const bTime = b.timestamp?.seconds || b.timestamp?.getTime?.() / 1000 || 0;
      return bTime - aTime;
    });
    
    // Return only the 5 most recent activities
    const recentActivities = activities.slice(0, 5);
    
    console.log("✅ Admin: Recent activity fetched:", recentActivities.length, "activities");
    return recentActivities;
    
  } catch (error) {
    console.error("❌ Admin error fetching recent activity:", error);
    return [];
  }
};

// Get enhanced user details with recent activity
export const getUserDetailsWithActivity = async (userId) => {
  try {
    console.log("🔍 Admin: Fetching enhanced user details for:", userId);
    
    // Get existing user details
    const userDetails = await getUserDetails(userId);
    
    // Get recent activity
    const recentActivity = await getUserRecentActivity(userId);
    
    // Get subscription history
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    let subscriptionHistory = [];
    
    if (subscriptionDoc.exists()) {
      const subData = subscriptionDoc.data();
      if (subData.admin_change) {
        subscriptionHistory.push({
          type: 'plan_changed',
          description: `Plan changed from ${subData.admin_change.previous_plan} to ${subData.admin_change.new_plan}`,
          timestamp: subData.admin_change.changed_at,
          reason: subData.admin_change.reason,
          icon: '💎',
          color: 'blue'
        });
      }
    }
    
    // Enhance user details with activity data
    const enhancedDetails = {
      ...userDetails,
      recentActivity: recentActivity,
      subscriptionHistory: subscriptionHistory,
      lastActivity: recentActivity.length > 0 ? recentActivity[0] : null
    };
    
    console.log("✅ Admin: Enhanced user details compiled");
    return enhancedDetails;
    
  } catch (error) {
    console.error("❌ Admin error fetching enhanced user details:", error);
    return await getUserDetails(userId); // Fallback to basic details
  }
};

// Format timestamp for display
export const formatActivityTimestamp = (timestamp) => {
  try {
    let date;
    if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp?.getTime) {
      date = timestamp;
    } else {
      return 'Unknown time';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    return 'Unknown time';
  }
};

// Get user's sites for admin panel
export const getUserSites = async (userId) => {
  try {
    console.log("🔍 Admin: Fetching sites for user:", userId);
    
    const sitesRef = collection(db, 'blocked_sites');
    const sitesQuery = query(
      sitesRef, 
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    const sitesSnapshot = await getDocs(sitesQuery);
    
    const sites = [];
    sitesSnapshot.forEach(doc => {
      const siteData = doc.data();
      sites.push({
        id: doc.id,
        ...siteData,
        // Calculate site efficiency
        efficiency: calculateSiteEfficiency(siteData),
        // Format timestamps
        createdAt: siteData.created_at,
        updatedAt: siteData.updated_at || siteData.created_at
      });
    });
    
    console.log("✅ Admin: Found", sites.length, "sites for user");
    return sites;
    
  } catch (error) {
    console.error("❌ Admin error fetching user sites:", error);
    return [];
  }
};

// ====================== USER ACTIVITY TRACKING ======================

// Add activity to user's recent activity log
export const addUserActivity = async (userId, activityData) => {
  try {
    console.log(`📝 Adding activity for user ${userId}:`, activityData);
    
    const activityRef = collection(db, 'user_activity');
    const activity = {
      user_id: userId,
      type: activityData.type,
      description: activityData.description,
      icon: activityData.icon || '📋',
      color: activityData.color || 'blue',
      created_at: serverTimestamp(),
      data: activityData.data || null
    };
    
    const docRef = await addDoc(activityRef, activity);
    console.log(`✅ Activity logged with ID: ${docRef.id}`);
    
    return { id: docRef.id, ...activity };
  } catch (error) {
    console.error("❌ Error adding user activity:", error);
    throw error;
  }
};