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
    
    // Grant monthly overrides if creating Pro plan subscription
    if (plan === 'pro') {
      try {
        await grantMonthlyFreeOverrides(userId);
        console.log("✅ Monthly overrides granted for new Pro subscriber");
      } catch (error) {
        console.error("⚠️ Error granting monthly overrides:", error);
        // Don't fail the subscription creation if override grant fails
      }
    }
    
    return { id: userId, ...subscriptionDoc };
  } catch (error) {
    console.error("Error in createSubscription:", error);
    throw error;
  }
};

export const updateUserSubscription = async (userId, plan) => {
  try {
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
      
      // Grant monthly overrides if upgrading to Pro plan
      if (plan === 'pro') {
        try {
          await grantMonthlyFreeOverrides(userId);
          console.log("✅ Monthly overrides granted for new Pro subscriber");
        } catch (error) {
          console.error("⚠️ Error granting monthly overrides:", error);
          // Don't fail the subscription update if override grant fails
        }
      }
      
      return { id: userId, ...existingSubscription, ...updateData };
    } else {
      // Create new subscription if doesn't exist
      return await createSubscription(userId, plan);
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
        // Ensure override fields exist
        overrides: data.overrides || data.purchased_overrides || data.override_credits || 0,
        total_overrides_purchased: data.total_overrides_purchased || data.credits_purchased_total || 0,
        overrides_used_total: data.overrides_used_total || 0,
        updated_at: serverTimestamp()
      });
      
      return { 
        ...data, 
        monthly_stats: updatedMonthlyStats,
        purchased_overrides: data.purchased_overrides || data.override_credits || 0,
        overrides_used_total: data.overrides_used_total || 0
      };
    }
    
    return {
      ...data,
      overrides: data.overrides || data.purchased_overrides || data.override_credits || 0,
      total_overrides_purchased: data.total_overrides_purchased || data.credits_purchased_total || 0,
      overrides_used_total: data.overrides_used_total || 0
    };
  } catch (error) {
    console.error("Error in getUserOverrideStats:", error);
    throw error;
  }
};

export const checkOverrideEligibility = async (userId, siteUrl = null) => {
  try {
    const [subscription, overrideStats] = await Promise.all([
      getUserSubscription(userId),
      getUserOverrideStats(userId)
    ]);
    
    // If siteUrl is provided, check if the site is actually blocked and time limit exceeded
    let siteEligibility = { canOverride: true, reason: '' };
    if (siteUrl) {
      siteEligibility = await checkSiteTimeEligibility(userId, siteUrl);
      if (!siteEligibility.canOverride) {
        return {
          canOverride: false,
          requiresPayment: false,
          price: 0,
          reason: siteEligibility.reason,
          overridesAvailable: overrideStats.overrides || 0,
          siteInfo: siteEligibility.siteInfo
        };
      }
    }
    
    const userPlan = subscription?.plan || 'free';
    const overridesAvailable = overrideStats.overrides || 0;
    
    // Elite plan has unlimited overrides
    if (userPlan === 'elite') {
      return {
        canOverride: true,
        requiresPayment: false,
        price: 0,
        reason: 'Elite plan includes unlimited overrides',
        overridesAvailable: 999, // Unlimited display
        userPlan,
        siteInfo: siteEligibility.siteInfo || null
      };
    }
    
    // Check if user has any overrides available
    if (overridesAvailable <= 0) {
      return {
        canOverride: true,
        requiresPayment: true,
        price: 1.99,
        reason: 'No overrides available. Purchase overrides to continue.',
        overridesAvailable: 0,
        userPlan,
        siteInfo: siteEligibility.siteInfo || null
      };
    }
    
    return {
      canOverride: true,
      requiresPayment: false,
      price: 0,
      reason: `Using 1 of your ${overridesAvailable} available overrides`,
      overridesAvailable,
      userPlan,
      siteInfo: siteEligibility.siteInfo || null
    };
    
  } catch (error) {
    console.error("Error in checkOverrideEligibility:", error);
    throw error;
  }
};

// Check if a specific site is eligible for override (time limit exceeded)
export const checkSiteTimeEligibility = async (userId, siteUrl) => {
  try {
    console.log(`🔍 Checking time eligibility for ${siteUrl} for user ${userId}`);
    
    // Get all blocked sites for the user
    const blockedSites = await getBlockedSites(userId);
    
    // Find the site that matches the URL
    const matchingSite = blockedSites.find(site => {
      const siteHostname = site.url.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const inputHostname = siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
      return siteHostname.includes(inputHostname) || inputHostname.includes(siteHostname);
    });
    
    if (!matchingSite) {
      return {
        canOverride: false,
        reason: `${siteUrl} is not in your blocked sites list. Please add it first.`,
        siteInfo: null
      };
    }
    
    // Check if site is currently active (blocked)
    if (matchingSite.is_blocked === false) {
      return {
        canOverride: false,
        reason: `${matchingSite.name || siteUrl} is currently not being blocked.`,
        siteInfo: matchingSite
      };
    }
    
    // Get today's time usage for this site
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const timeSpentToday = matchingSite.daily_usage?.[todayKey] || 0; // in seconds
    const timeLimit = matchingSite.time_limit || 1800; // default 30 minutes in seconds
    
    const remainingTime = Math.max(0, timeLimit - timeSpentToday);
    const remainingMinutes = Math.floor(remainingTime / 60);
    
    console.log(`⏱️ Site: ${matchingSite.name}, Time limit: ${timeLimit}s, Used today: ${timeSpentToday}s, Remaining: ${remainingTime}s`);
    
    if (remainingTime > 0) {
      return {
        canOverride: false,
        reason: `You still have ${remainingMinutes} minutes remaining for ${matchingSite.name || siteUrl} today. Override is only available when time limit is exceeded.`,
        siteInfo: {
          ...matchingSite,
          timeSpentToday,
          timeLimit,
          remainingTime,
          remainingMinutes
        }
      };
    }
    
    // Time limit exceeded, override is allowed
    return {
      canOverride: true,
      reason: `Time limit exceeded for ${matchingSite.name || siteUrl}. Override available.`,
      siteInfo: {
        ...matchingSite,
        timeSpentToday,
        timeLimit,
        remainingTime: 0,
        remainingMinutes: 0
      }
    };
    
  } catch (error) {
    console.error("Error in checkSiteTimeEligibility:", error);
    return {
      canOverride: false,
      reason: 'Unable to check site eligibility. Please try again.',
      siteInfo: null
    };
  }
};

export const recordOverrideUsage = async (userId, amount = 0, siteUrl = '') => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const overrideStats = await getUserOverrideStats(userId);
    const monthlyStats = overrideStats.monthly_stats?.[currentMonth] || {};
    
    // For Elite plan, we don't need to deduct overrides
    const subscription = await getUserSubscription(userId);
    const userPlan = subscription?.plan || 'free';
    
    let updatedData = {};
    
    if (userPlan === 'elite') {
      // Elite plan: unlimited overrides, just track usage
      updatedData = {
        monthly_stats: {
          ...overrideStats.monthly_stats,
          [currentMonth]: {
            ...monthlyStats,
            overrides_used: (monthlyStats.overrides_used || 0) + 1,
            total_spent_this_month: (monthlyStats.total_spent_this_month || 0) + amount
          }
        },
        overrides_used_total: (overrideStats.overrides_used_total || 0) + 1,
        total_spent: (overrideStats.total_spent || 0) + amount,
        updated_at: serverTimestamp()
      };
    } else {
      // Free/Pro plans: deduct from override balance
      const newOverrideBalance = Math.max(0, (overrideStats.overrides || 0) - 1);
      
      updatedData = {
        monthly_stats: {
          ...overrideStats.monthly_stats,
          [currentMonth]: {
            ...monthlyStats,
            overrides_used: (monthlyStats.overrides_used || 0) + 1,
            total_spent_this_month: (monthlyStats.total_spent_this_month || 0) + amount
          }
        },
        overrides: newOverrideBalance,
        overrides_used_total: (overrideStats.overrides_used_total || 0) + 1,
        total_spent: (overrideStats.total_spent || 0) + amount,
        updated_at: serverTimestamp()
      };
    }
    
    // Create override history entry
    const overrideHistoryData = {
      user_id: userId,
      site_url: siteUrl,
      timestamp: serverTimestamp(),
      amount: amount,
      month: currentMonth,
      plan: userPlan,
      reason: `Override used for ${siteUrl || 'site'}`,
      created_at: serverTimestamp()
    };
    
    // Update user override stats and add history entry
    await Promise.all([
      updateDoc(doc(db, 'user_overrides', userId), updatedData),
      addDoc(collection(db, 'override_history'), overrideHistoryData)
    ]);
    
    return {
      success: true,
      newStats: {
        ...overrideStats,
        ...updatedData
      }
    };
  } catch (error) {
    console.error("Error in recordOverrideUsage:", error);
    throw error;
  }
};

export const processOverridePayment = async (userId, paymentData, siteUrl = '') => {
  try {
    // In a real implementation, you would process the payment with Stripe here
    // For now, we'll simulate payment processing
    
    const { amount = 1.99, paymentMethod, reason = 'Site override' } = paymentData;
    
    console.log(`💳 Processing override payment: $${amount} for user ${userId}`);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Record the paid override usage
    const result = await recordOverrideUsage(userId, amount, siteUrl);
    
    console.log(`✅ Override payment processed successfully`);
    
    return {
      success: true,
      transactionId: `ovr_${Date.now()}_${userId.substring(0, 8)}`,
      amount,
      message: 'Override payment processed successfully',
      overrideStats: result.newStats
    };
  } catch (error) {
    console.error("Error in processOverridePayment:", error);
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
    
    // Grant 15 free overrides for Pro plan
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