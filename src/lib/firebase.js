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
  orderBy as firestoreOrderBy, 
  serverTimestamp, 
  limit as firestoreLimit,
  startAfter,
  runTransaction
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDmeE0h4qlRTs8c87bQhvh8Hvfe0NZsqmQ",
  authDomain: "testing-396cd.firebaseapp.com",
  projectId: "testing-396cd",
  storageBucket: "testing-396cd.firebasestorage.app",
  messagingSenderId: "327238443846",
  appId: "1:327238443846:web:72732cb7e7d200c4327b47",
  measurementId: "G-XKPB99GTGF"
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Missing Firebase configuration');
  throw new Error('Missing Firebase configuration');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signUp = async (email, password, metadata = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await createUserProfile(user.uid, {
      email: user.email,
      ...metadata
    });
    await createSubscription(user.uid, metadata.plan || 'free');
    await updateUserStats(user.uid, 'create', metadata.plan || 'free');
    toast.success("User created successfully");
    return { user };
  } catch (error) {
    console.error("Firebase signup error:", error);
    
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    toast.success("Login successful");
    return { user: userCredential.user };
  } catch (error) {
    console.error("Firebase login error:", error);
    
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
    toast.success("Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error(error.message);
  }
};

// export const getSession = () => {
//   return new Promise((resolve) => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       unsubscribe();
//       resolve({ data: { session: user ? { user } : null } });
//     });
//   });
// };

export const createUserProfile = async (userId, userData) => {
  try {
    const userDoc = {
      id: userId,
      profile_name: userData.name || userData.profileName || '',
      profile_email: userData.email || '',
      profile_image: userData.profileImage || null,
      plan: userData.plan || 'free',
      isAdmin: false,
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
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = { id: userDoc.id, ...userDoc.data() };
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

    const updatedDoc = await getDoc(doc(db, 'users', userId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    throw error;
  }
};

const normalizeDomain = (url) => {
  try {
    let domain = url.replace(/^https?:\/\//, '');
    domain = domain.replace(/^www\./, '');
    domain = domain.split('/')[0];
    return domain.toLowerCase();
  } catch (error) {
    console.error('Error normalizing domain:', error);
    return url;
  }
};

export const updateUserBlockedSitesCount = async (userId, change) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentCount = userDoc.data().total_sites_blocked || 0;
    const newCount = Math.max(0, currentCount + change); // Ensure count doesn't go below 0
    
    await updateDoc(doc(db, 'users', userId), {
      total_sites_blocked: newCount,
      updated_at: serverTimestamp(),
    });
    
    return newCount;
  } catch (error) {
    console.error("Error updating blocked sites count:", error);
    throw error;
  }
};

export const addBlockedSite = async (userId, siteData) => {
  try {
    const normalizedDomain = normalizeDomain(siteData.url);
    const documentId = `${userId}_${normalizedDomain}`;
    
    const existingDoc = await getDoc(doc(db, 'blocked_sites', documentId));
    
    if (existingDoc.exists()) {
      const existingData = existingDoc.data();
      
      if (!existingData.is_active) {
        const updateData = {
          is_active: true,
          name: siteData.name || existingData.name || normalizedDomain,
          time_limit: existingData.time_limit || 1800,
          updated_at: serverTimestamp(),
        };
        
        const today = new Date().toISOString().split('T')[0];
        if (existingData.last_reset_date !== today) {
          updateData.time_remaining = updateData.time_limit;
          updateData.time_spent_today = 0;
          updateData.last_reset_date = today;
          updateData.is_blocked = false;
          updateData.blocked_until = null;
        }
        
        await updateDoc(doc(db, 'blocked_sites', documentId), updateData);

        await updateUserBlockedSitesCount(userId, 1);        
        toast.success("Website reactivated successfully");
        return { 
          id: documentId, 
          ...existingData, 
          ...updateData,
          wasReactivated: true,
          message: 'Website already added in the past. Reactivated with preserved settings.'
        };
      } else {
        toast.error("Website already being tracked");
        return {
          id: documentId,
          ...existingData,
          wasReactivated: false,
          message: 'This website is already being tracked.'
        };
      }
    }
    
    const siteDoc = {
      user_id: userId,
      url: normalizedDomain,
      name: siteData.name || normalizedDomain,
      time_limit: siteData.timeLimit || 1800,
      time_remaining: siteData.timeLimit || 1800,
      time_spent_today: 0,
      last_reset_date: new Date().toISOString().split('T')[0],
      is_blocked: false,
      is_active: siteData.isActive !== false,
      blocked_until: null,
      schedule: siteData.schedule || null,
      total_time_spent: 0,
      last_accessed: null,
      override_active: false,
      last_reset_timestamp: null,
      override_initiated_by: null,
      override_initiated_at: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(doc(db, 'blocked_sites', documentId), siteDoc);
    
    await updateUserBlockedSitesCount(userId, 1);
    await updateSiteStats({ after: { data: () => siteDoc } }, 'create');
    
    toast.success("Website added successfully");
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
    let q;
    if (includeInactive) {
      q = query(
        collection(db, 'blocked_sites'),
        where('user_id', '==', userId),
      );
    } else {
      q = query(
        collection(db, 'blocked_sites'),
        where('user_id', '==', userId),
        where('is_active', '!=', false)  
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
    const updateData = {
      ...siteData,
      is_active: siteData.isActive,
      updated_at: serverTimestamp(),
    };

    await updateDoc(doc(db, 'blocked_sites', siteId), updateData);

    const updatedDoc = await getDoc(doc(db, 'blocked_sites', siteId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error in updateBlockedSite:", error);
    throw error;
  }
};

export const removeBlockedSite = async (siteId) => {
  try {
    const siteDoc = await getDoc(doc(db, 'blocked_sites', siteId));
    if (!siteDoc.exists()) {
      throw new Error('Site not found');
    }
    
    const siteData = siteDoc.data();
    
    await updateDoc(doc(db, 'blocked_sites', siteId), {
      is_active: false,
      updated_at: serverTimestamp(),
    });
    
    if (siteData?.user_id) {
      await updateUserBlockedSitesCount(siteData.user_id, -1);
    }
    
    return true;
  } catch (error) {
    console.error("Error in removeBlockedSite:", error);
    throw error;
  }
};

// export const getAllBlockedSites = async (userId) => {
//   return await getBlockedSites(userId, true);
// };

// export const getBlockedSiteByDomain = async (userId, domain) => {
//   try {
//     const normalizedDomain = normalizeDomain(domain);
//     const documentId = `${userId}_${normalizedDomain}`;
    
//     const siteDoc = await getDoc(doc(db, 'blocked_sites', documentId));
//     if (siteDoc.exists()) {
//       return { id: siteDoc.id, ...siteDoc.data() };
//     }
//     return null;
//   } catch (error) {
//     console.error("Error in getBlockedSiteByDomain:", error);
//     return null;
//   }
// };

// export const updateSiteUsageAnalytics = async (userId, domain, timeSpentSeconds) => {
//   try {
//     const normalizedDomain = normalizeDomain(domain);
//     const documentId = `${userId}_${normalizedDomain}`;
    
//     const siteDoc = await getDoc(doc(db, 'blocked_sites', documentId));
//     if (!siteDoc.exists()) {
//       console.warn(`Site ${domain} not found for user ${userId}`);
//       return null;
//     }

//     const siteData = siteDoc.data();
//     const today = new Date().toISOString().split('T')[0];
    
//     const dailyUsage = siteData.daily_usage || {};
//     dailyUsage[today] = (dailyUsage[today] || 0) + timeSpentSeconds;
    
//     const updateData = {
//       daily_usage: dailyUsage,
//       total_time_spent: (siteData.total_time_spent || 0) + timeSpentSeconds,
//       access_count: (siteData.access_count || 0) + 1,
//       last_accessed: serverTimestamp(),
//       updated_at: serverTimestamp(),
//     };

//     await updateDoc(doc(db, 'blocked_sites', documentId), updateData);
    
//     return updateData;
//   } catch (error) {
//     console.error("Error updating site usage analytics:", error);
//     throw error;
//   }
// };



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
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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

export const updateUserSubscription = async (userId, plan) => {
  try {
    
    const currentUser = await getUserProfile(userId);
    const previousPlan = currentUser?.plan || 'free';
    
    const existingSubscription = await getUserSubscription(userId);
    
    // Calculate plan price
    let planPrice = 0;
    if (plan === 'pro') {
      planPrice = 9.99;
    } else if (plan === 'elite') {
      planPrice = 19.99;
    }
    
    if (existingSubscription) {
      const updateData = {
        plan: plan,
        status: 'active',
        updated_at: serverTimestamp(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };
      
      await updateDoc(doc(db, 'subscriptions', userId), updateData);
      
      await updateDoc(doc(db, 'users', userId), {
        plan: plan,
        updated_at: serverTimestamp(),
      });
      
      // Add to plan_purchases collection
      if (planPrice > 0) {
        await addDoc(collection(db, 'plan_purchases'), {
          user_id: userId,
          plan: plan,
          amount_paid: planPrice,
          previous_plan: previousPlan,
          purchase_date: serverTimestamp(),
          transaction_id: `plan_${Date.now()}_${userId.substring(0, 8)}`,
          created_at: serverTimestamp()
        });
        
        // Update revenue stats
        await updateRevenueStats(planPrice, plan);
      }
      
      await grantPlanBenefits(userId, plan, previousPlan, "Website plan upgrade");
      
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
          benefits: benefitsText,
          amount_paid: planPrice
        }
      });
      toast.success("Plan upgraded successfully");
      return { id: userId, ...existingSubscription, ...updateData };
    } else {
      const newSubscription = await createSubscription(userId, plan);
      
      // Add to plan_purchases collection
      if (planPrice > 0) {
        await addDoc(collection(db, 'plan_purchases'), {
          user_id: userId,
          plan: plan,
          amount_paid: planPrice,
          previous_plan: previousPlan,
          purchase_date: serverTimestamp(),
          transaction_id: `plan_${Date.now()}_${userId.substring(0, 8)}`,
          created_at: serverTimestamp()
        });
        
        // Update revenue stats
        await updateRevenueStats(planPrice, plan);
      }
      
      await updateDoc(doc(db, 'users', userId), {
        plan: plan,
        updated_at: serverTimestamp(),
      });
      
      await grantPlanBenefits(userId, plan, previousPlan, "New plan subscription");
      
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
          benefits: benefitsText,
          amount_paid: planPrice
        }
      });
      toast.success("Plan subscribed successfully");
      return newSubscription;
    }
  } catch (error) {
    console.error("Error in updateUserSubscription:", error);
    throw error;
  }
};

export const getUserOverrideStats = async (userId) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const overrideDoc = await getDoc(doc(db, 'user_overrides', userId));
    
    if (!overrideDoc.exists()) {
      const initialData = {
        user_id: userId,
        overrides: 0,
        total_overrides_purchased: 0,
        overrides_used_total: 0,
        monthly_stats: {
          [currentMonth]: {
            overrides_used: 0,
            total_spent_this_month: 0
          }
        },
        total_spent: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      await setDoc(doc(db, 'user_overrides', userId), initialData);
      return initialData;
    }
    
    const data = overrideDoc.data();
    
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



export const purchaseOverrides = async (userId, quantity, amount) => {
  try {
    const pricePerOverride = 1.99;
    const totalPrice = quantity * pricePerOverride;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const overrideStats = await getUserOverrideStats(userId);
    
    const newOverrideBalance = (overrideStats.overrides || 0) + quantity;
    const newTotalPurchased = (overrideStats.total_overrides_purchased || 0) + quantity;
    
    await updateDoc(doc(db, 'user_overrides', userId), {
      overrides: newOverrideBalance,
      total_overrides_purchased: newTotalPurchased,
      total_spent: (overrideStats.total_spent || 0) + totalPrice,
      updated_at: serverTimestamp()
    });
    
    const purchaseHistoryData = {
      user_id: userId,
      overrides_purchased: quantity,
      amount_paid: totalPrice,
      price_per_override: pricePerOverride,
      transaction_id: `ovr_buy_${Date.now()}_${userId.substring(0, 8)}`,
      payment_method: 'card',
      timestamp: serverTimestamp(),
      created_at: serverTimestamp()
    };
    
    await addDoc(collection(db, 'override_purchases'), purchaseHistoryData);
    
    console.log(`✅ Overrides purchased successfully: ${quantity} overrides`);
    
    await updateRevenueStats(totalPrice);
    
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

export const getUserStatistics = async (userId) => {
  try {
    const [userProfile, blockedSites, subscription] = await Promise.all([
      getUserProfile(userId),
      getBlockedSites(userId),
      getUserSubscription(userId)
    ]);

    const totalSites = blockedSites.length;
    const activeSites = blockedSites.length;
    const currentlyBlockedSites = blockedSites.filter(site => site.is_blocked === true).length;
    const currentlyUnblockedSites = blockedSites.filter(site => site.is_blocked !== true).length;
    
    const totalTimeSpent = blockedSites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
    const todayTimeSpent = blockedSites.reduce((sum, site) => sum + (site.time_spent_today || 0), 0);
    const totalTimeSaved = userProfile?.total_time_saved || 0;
    
    const totalAccesses = blockedSites.reduce((sum, site) => sum + (site.access_count || 0), 0);
    const averageTimePerSite = totalSites > 0 ? Math.round(totalTimeSpent / totalSites) : 0;
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentActivity = blockedSites.filter(site => 
      site.last_accessed && new Date(site.last_accessed.toDate ? site.last_accessed.toDate() : site.last_accessed) > lastWeek
    ).length;

    const stats = {
      totalSitesBlocked: totalSites,
      activeSitesBlocked: activeSites,
      currentlyBlockedSites: currentlyBlockedSites,
      currentlyUnblockedSites: currentlyUnblockedSites,
      
      totalTimeSpent: totalTimeSpent,
      todayTimeSpent: todayTimeSpent,
      totalTimeSaved: totalTimeSaved,
      averageTimePerSite: averageTimePerSite,
      
      totalAccesses: totalAccesses,
      recentActivity: recentActivity,
      
      userPlan: subscription?.plan || userProfile?.plan || 'free',
      subscriptionStatus: subscription?.status || 'active',
      
      lastUpdated: new Date(),
      hasData: totalSites > 0
    };

    return stats;
    
  } catch (error) {
    console.error("❌ Error calculating user statistics:", error);
    
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

export const getDashboardData = async (userId) => {
  try {
    const [userProfile, blockedSites, subscription] = await Promise.all([
      getUserProfile(userId),
      getBlockedSites(userId),
      getUserSubscription(userId)
    ]);
    
    const totalSites = blockedSites.length;
    const activeSites = blockedSites.length;
    const totalTimeSpent = blockedSites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
    const todayTimeSpent = blockedSites.reduce((sum, site) => sum + (site.time_spent_today || 0), 0);
    const totalTimeSaved = userProfile?.total_time_saved || 0;
    const totalAccesses = blockedSites.reduce((sum, site) => sum + (site.access_count || 0), 0);

    const sitesPreview = blockedSites.slice(0, 5).map(site => ({
      id: site.id,
      name: site.name || site.url,
      url: site.url,
      isActive: site.is_active !== false,
      isCurrentlyBlocked: site.is_blocked === true,
      timeLimit: site.time_limit || 30,
      timeSpent: site.total_time_spent || 0,
      lastAccessed: site.last_accessed
    }));

    const dashboardData = {
      stats: {
        sitesBlocked: totalSites,
        timeSaved: Math.round(totalTimeSaved / 60 * 10) / 10,
        activeSites: activeSites,
        todayTime: Math.round(todayTimeSpent)
      },
      insights: {
        averagePerSite: Math.round(totalTimeSpent / (totalSites || 1)),
        totalAccesses: totalAccesses,
        recentActivity: 0,
        categories: {}
      },
      
      sites: {
        total: totalSites,
        active: activeSites,
        preview: sitesPreview,
        hasData: totalSites > 0
      },
      
      subscription: {
        plan: subscription?.plan || 'free',
        status: subscription?.status || 'active',
        features: getFeaturesByPlan(subscription?.plan || 'free')
      },
      
      lastUpdated: new Date()
    };

    return dashboardData;
    
  } catch (error) {
    console.error("❌ Error loading dashboard data:", error);
    return null;
  }
};

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
    
    let timeSpentToday = siteData.time_spent_today || 0;
    let timeRemaining = siteData.time_remaining || siteData.time_limit;
    
    if (siteData.last_reset_date !== today) {
      timeSpentToday = 0;
      timeRemaining = siteData.time_limit;
    }
    
    timeSpentToday += timeSpentSeconds;
    timeRemaining = Math.max(0, siteData.time_limit - timeSpentToday);
    
    const isBlocked = timeRemaining <= 0;
    const blockedUntil = isBlocked ? getNextMidnight().toISOString() : null;
    
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
      
      let timeRemaining = data.time_remaining || data.time_limit;
      let isBlocked = data.is_blocked || false;
      
      if (data.last_reset_date !== today) {
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

const getNextMidnight = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

// export const grantMonthlyFreeOverrides = async (userId) => {
//   try {
//     const subscription = await getUserSubscription(userId);
//     const userPlan = subscription?.plan || 'free';
    
//     if (userPlan !== 'pro') {
//       return { success: true, message: 'No monthly overrides for this plan' };
//     }
    
//     const now = new Date();
//     const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
//     const overrideStats = await getUserOverrideStats(userId);
//     const monthlyStats = overrideStats.monthly_stats?.[currentMonth] || {};
    
//     if (monthlyStats.monthly_grant_given) {
//       return { success: true, message: 'Monthly overrides already granted' };
//     }
    
//     const freeOverridesToGrant = 15;
//     const newOverrideBalance = (overrideStats.overrides || 0) + freeOverridesToGrant;
//     const newTotalOverrides = (overrideStats.total_overrides_purchased || 0) + freeOverridesToGrant;
    
//     await updateDoc(doc(db, 'user_overrides', userId), {
//       overrides: newOverrideBalance,
//       total_overrides_purchased: newTotalOverrides,
//       monthly_stats: {
//         ...overrideStats.monthly_stats,
//         [currentMonth]: {
//           ...monthlyStats,
//           monthly_grant_given: true,
//           free_overrides_granted: freeOverridesToGrant,
//           grant_date: serverTimestamp()
//         }
//       },
//       updated_at: serverTimestamp()
//     });
    
//     console.log(`✅ Granted ${freeOverridesToGrant} monthly overrides to Pro user ${userId}`);
    
//     return {
//       success: true,
//       overridesGranted: freeOverridesToGrant,
//       newBalance: newOverrideBalance,
//       message: `Granted ${freeOverridesToGrant} monthly overrides for Pro plan`
//     };
    
//   } catch (error) {
//     console.error('Error granting monthly free overrides:', error);
//     throw error;
//   }
// };

// export const migrateBlockedSitesToNewSchema = async (userId) => {
//   try { 
//     const q = query(
//       collection(db, 'blocked_sites'),
//       where('user_id', '==', userId)
//     );
    
//     const querySnapshot = await getDocs(q);
//     const migrationTasks = [];
//     const sitesToDelete = [];
    
//     for (const docSnapshot of querySnapshot.docs) {
//       const oldData = docSnapshot.data();
//       const oldDocId = docSnapshot.id;
      
//       const normalizedDomain = normalizeDomain(oldData.url);
//       const newDocId = `${userId}_${normalizedDomain}`;
      
//       const newDocRef = doc(db, 'blocked_sites', newDocId);
//       const newDocSnapshot = await getDoc(newDocRef);
      
//       if (!newDocSnapshot.exists()) {
//         const newSiteDoc = {
//           user_id: userId,
//           url: normalizedDomain,
//           name: oldData.name || normalizedDomain,
          
//           time_limit: oldData.time_limit || 1800,
//           time_remaining: oldData.time_remaining || oldData.time_limit || 1800,
//           time_spent_today: oldData.time_spent_today || 0,
//           last_reset_date: oldData.last_reset_date || new Date().toISOString().split('T')[0],
          
//           is_blocked: oldData.is_blocked || false,
//           is_active: oldData.is_active !== false,
//           blocked_until: oldData.blocked_until || null,
          
//           schedule: oldData.schedule || null,
          
//           daily_usage: oldData.daily_usage || {},
//           total_time_spent: oldData.total_time_spent || 0,
//           access_count: oldData.access_count || 0,
//           last_accessed: oldData.last_accessed || null,
          
//           override_active: oldData.override_active || false,
//           override_initiated_by: oldData.override_initiated_by || null,
//           override_initiated_at: oldData.override_initiated_at || null,
          
//           created_at: oldData.created_at || serverTimestamp(),
//           updated_at: serverTimestamp(),
//         };
        
//         migrationTasks.push(setDoc(newDocRef, newSiteDoc));
//         sitesToDelete.push(oldDocId);
        
//         console.log(`📝 Migrating: ${oldData.url} -> ${newDocId}`);
//       } else {
//         console.log(`⚠️ Document already exists with new ID: ${newDocId}, skipping migration for ${oldDocId}`);
//         if (oldDocId !== newDocId) {
//           sitesToDelete.push(oldDocId);
//         }
//       }
//     }
    
//     if (migrationTasks.length > 0) {
//       await Promise.all(migrationTasks);
//       console.log(`✅ Created ${migrationTasks.length} new documents`);
//     }
    
//     const deactivateOldTasks = sitesToDelete
//       .filter(oldId => !oldId.includes('_'))
//       .map(oldId => updateDoc(doc(db, 'blocked_sites', oldId), {
//         is_active: false,
//         updated_at: serverTimestamp(),
//       }));
    
//     if (deactivateOldTasks.length > 0) {
//       await Promise.all(deactivateOldTasks);
//       console.log(`🚫 Deactivated ${deactivateOldTasks.length} old documents (soft delete)`);
//     }
    
//     console.log(`✅ Migration completed for user ${userId}`);
//     return {
//       migrated: migrationTasks.length,
//       deactivated: deactivateOldTasks.length,
//       skipped: querySnapshot.size - migrationTasks.length - deactivateOldTasks.length
//     };
    
//   } catch (error) {
//     console.error('Error during migration:', error);
//     throw error;
//   }
// };

// export const checkIfUserNeedsMigration = async (userId) => {
//   try {
//     const q = query(
//       collection(db, 'blocked_sites'),
//       where('user_id', '==', userId)
//     );
    
//     const querySnapshot = await getDocs(q);
//     let needsMigration = false;
    
//     querySnapshot.forEach((doc) => {
//       const docId = doc.id;
//       const data = doc.data();
      
//       const expectedId = `${userId}_${normalizeDomain(data.url)}`;
//       if (docId !== expectedId) {
//         needsMigration = true;
//       }
      
//       if (!data.hasOwnProperty('daily_usage') || 
//           !data.hasOwnProperty('total_time_spent') || 
//           !data.hasOwnProperty('access_count') || 
//           !data.hasOwnProperty('override_active')) {
//         needsMigration = true;
//       }
//     });
    
//     return needsMigration;
//   } catch (error) {
//     console.error('Error checking migration status:', error);
//     return false;
//   }
// };

export const getUserAnalytics = async (userId) => {
  try {
    const [userProfile, subscription] = await Promise.all([
      getUserProfile(userId),
      getUserSubscription(userId)
    ]);
    
    const plan = subscription?.plan || userProfile?.plan || 'free';
    const planLimits = getPlanAnalyticsLimits(plan);
    
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

export const getSiteAnalytics = async (userId, historyDays = 7) => {
  try {
    const sites = await getBlockedSites(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - historyDays);
    
    const siteAnalytics = sites.map(site => {
      const filteredDailyUsage = {};
      const dailyUsage = site.daily_usage || {};
      
      Object.keys(dailyUsage).forEach(date => {
        const usageDate = new Date(date);
        if (usageDate >= cutoffDate) {
          filteredDailyUsage[date] = dailyUsage[date];
        }
      });
      
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

export const calculateSiteEfficiency = (site) => {
  if (!site.time_limit || site.time_limit === 0) return 100;
  
  const today = new Date().toISOString().split('T')[0];
  const todayUsage = site.daily_usage?.[today] || site.time_spent_today || 0;
  
  if (todayUsage === 0) return 100;
  
  const efficiency = Math.max(0, ((site.time_limit - todayUsage) / site.time_limit) * 100);
  return Math.round(efficiency);
};

export const getOverrideAnalytics = async (userId, plan) => {
  try {
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
    
    if (plan !== 'free') {
      try {
        const historyQuery = query(
          collection(db, 'override_history'),
          where('user_id', '==', userId),
          orderBy('timestamp', 'desc'),
          firestoreLimit(50)
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

export const getUsageHistory = async (userId, historyDays = 7) => {
  try {
    const sites = await getBlockedSites(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - historyDays);
    
    const dailyTotals = {};
    const siteBreakdown = {};
    
    sites.forEach(site => {
      const dailyUsage = site.daily_usage || {};
      
      Object.entries(dailyUsage).forEach(([date, timeSpent]) => {
        const usageDate = new Date(date);
        if (usageDate >= cutoffDate) {
          dailyTotals[date] = (dailyTotals[date] || 0) + timeSpent;
          
          if (!siteBreakdown[site.name]) {
            siteBreakdown[site.name] = {};
          }
          siteBreakdown[site.name][date] = timeSpent;
        }
      });
    });
    
    const dates = Object.keys(dailyTotals).sort();
    const totalTime = Object.values(dailyTotals).reduce((sum, time) => sum + time, 0);
    const averageDaily = totalTime / Math.max(1, dates.length);
    
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

export const getTimeSpentAnalytics = async (userId, historyDays = 7) => {
  try {
    const sites = await getBlockedSites(userId);
    
    const totalLimits = sites.reduce((sum, site) => sum + (site.time_limit || 0), 0);
    const totalSpentToday = sites.reduce((sum, site) => sum + (site.time_spent_today || 0), 0);
    const totalLifetimeSpent = sites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
    
    const productivityScore = totalLimits > 0 ? Math.max(0, ((totalLimits - totalSpentToday) / totalLimits) * 100) : 100;
    
    const mostUsedSites = sites
      .filter(site => site.total_time_spent > 0)
      .sort((a, b) => b.total_time_spent - a.total_time_spent)
      .slice(0, 5)
      .map(site => ({
        name: site.name,
        timeSpent: site.total_time_spent,
        percentage: totalLifetimeSpent > 0 ? (site.total_time_spent / totalLifetimeSpent) * 100 : 0
      }));
    
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

const calculateTimeSaved = (sites, historyDays) => {
  const totalTimeSpent = sites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
  const totalLimits = sites.reduce((sum, site) => sum + (site.time_limit || 0), 0) * historyDays;
  
  const estimatedUnblockedUsage = totalLimits * 2.5;
  const timeSaved = Math.max(0, estimatedUnblockedUsage - totalTimeSpent);
  
  return Math.round(timeSaved);
};

const calculateAverageSessionLength = (sites) => {
  const totalSessions = sites.reduce((sum, site) => sum + (site.access_count || 0), 0);
  const totalTime = sites.reduce((sum, site) => sum + (site.total_time_spent || 0), 0);
  
  return totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;
};

const calculateBlockedSessions = (sites) => {
  return sites.reduce((count, site) => {
    const dailyUsage = site.daily_usage || {};
    const blockedDays = Object.values(dailyUsage).filter(usage => usage >= (site.time_limit || Infinity)).length;
    return count + blockedDays;
  }, 0);
};

// export const exportAnalyticsData = async (userId, format = 'json') => {
//   try {
//     const analytics = await getUserAnalytics(userId);
    
//     if (analytics.plan === 'free') {
//       throw new Error('Analytics export is only available for Pro and Elite subscribers');
//     }
    
//     const exportData = {
//       exportDate: new Date().toISOString(),
//       plan: analytics.plan,
//       user: analytics.user,
//       sites: analytics.sites,
//       overrides: analytics.overrides,
//       summary: {
//         totalSites: analytics.sites.length,
//         totalTimeSpent: analytics.timeSpent.totalLifetimeSpent,
//         timeSaved: analytics.timeSpent.timeSaved,
//         productivityScore: analytics.timeSpent.productivityScore
//       }
//     };
    
//     if (format === 'csv') {
//       return convertAnalyticsToCSV(exportData);
//     }
    
//     return exportData;
    
//   } catch (error) {
//     console.error("Error exporting analytics data:", error);
//     throw error;
//   }
// };

// const convertAnalyticsToCSV = (data) => {
//   const headers = Object.keys(data).join(',');
//   const values = Object.values(data).map(val => 
//     typeof val === 'object' ? JSON.stringify(val) : val
//   ).join(',');
//   return `${headers}\n${values}`;
// };

export const getAllUsers = async (lastDoc = null, limit = 10) => {
  try {
    const usersCollection = collection(db, 'users');
    
    let usersQuery;
    if (lastDoc) {
      usersQuery = query(
        usersCollection,
        firestoreOrderBy('created_at', 'desc'),
        startAfter(lastDoc),
        firestoreLimit(limit)
      );
    } else {
      usersQuery = query(
        usersCollection,
        firestoreOrderBy('created_at', 'desc'),
        firestoreLimit(limit)
      );
    }
    
    const usersSnapshot = await getDocs(usersQuery);
    
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    const lastVisible = usersSnapshot.docs[usersSnapshot.docs.length - 1];
    
    console.log(`✅ Admin: Found ${users.length} users`);
    return { users, lastDoc: lastVisible };
  } catch (error) {
    console.error("❌ Admin error fetching users:", error);
    throw error;
  }
};

export const getUserDetails = async (userId) => {
  try {
    
    const userProfile = await getUserProfile(userId);
    
    const subscription = await getUserSubscription(userId);
    
    const blockedSites = await getBlockedSites(userId, true);
    
    const overrideStats = await getUserOverrideStats(userId);
    
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
    
    // const userRef = doc(db, 'users', userId);
    
    // const userDoc = await getDoc(userRef);
    // if (!userDoc.exists()) {
    //   throw new Error(`User ${userId} not found in users collection`);
    // }
    
    // console.log(`📋 Current user data before update:`, userDoc.data());
    
    await updateDoc(userRef, {
      ...updateData,
      updated_at: serverTimestamp(),
    });
    
    await getDoc(userRef);
    // console.log(`✅ Admin: User profile updated successfully. New data:`, updatedDoc.data());
    
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
    const currentUser = await getUserProfile(userId);
    const previousPlan = currentUser?.plan || 'free';
    
    await adminUpdateUserProfile(userId, { plan: newPlan });
    
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
    
    await grantPlanBenefits(userId, newPlan, previousPlan, reason);
    
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

export const grantPlanBenefits = async (userId, newPlan, previousPlan = 'free', reason = "Plan upgrade benefits") => {
  try {
    console.log(`🎁 Admin: Granting ${newPlan} plan benefits to user ${userId}`);
    
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
        overrides: 15,
        monthly_overrides: 15,
        sites_limit: -1, // unlimited
        devices_limit: 3,
        lockout_duration: -1, // custom duration/end time
        features: ['Unlimited time tracking', 'Custom lockout durations', '15 free overrides/month', 'AI nudges', 'Sync + basic reports']
      },
      elite: {
        overrides: 200,
        monthly_overrides: 200,
        sites_limit: -1, // unlimited
        devices_limit: 10,
        lockout_duration: -1, // custom duration/end time
        features: ['200 overrides', 'AI usage insights', 'Journaling', '90-day encrypted history', 'Smart AI recommendations']
      }
    };
    
    const newBenefits = planBenefits[newPlan] || planBenefits.free;
    const previousBenefits = planBenefits[previousPlan] || planBenefits.free;
    
    let overridesToGrant = 0;
    let resetToZero = false;
    
    if (newPlan === 'elite') {
      overridesToGrant = 200;
    } else if (newPlan === 'pro') {
      overridesToGrant = 15;
    } else if (newPlan === 'free' && (previousPlan === 'elite' || previousPlan === 'pro')) {
      resetToZero = true;
    }
    
    if (resetToZero) {
      const overrideRef = doc(db, 'user_overrides', userId);
      await updateDoc(overrideRef, {
        overrides: 0,
        overrides_left: 0,
        monthly_limit: 0,
        current_plan: newPlan,
        plan_downgraded_at: serverTimestamp(),
        downgrade_from: previousPlan
      });
    } else if (overridesToGrant > 0) {
      await adminGrantOverrides(
        userId, 
        overridesToGrant, 
        `${reason} - ${newPlan.toUpperCase()} plan activation (like purchasing package)`
      );
    }
    
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      plan: newPlan,
      // plan_features: newBenefits.features,
      sites_limit: newBenefits.sites_limit,
      devices_limit: newBenefits.devices_limit,
      lockout_duration: newBenefits.lockout_duration,
      monthly_overrides: newBenefits.monthly_overrides,
      // plan_benefits_granted_at: serverTimestamp(),
      // last_plan_change: {
      //   from: previousPlan,
      //   to: newPlan,
      //   changed_at: serverTimestamp(),
      //   benefits_granted: newBenefits,
      //   override_action: resetToZero ? 'reset' : overridesToGrant > 0 ? 'granted' : 'preserved'
      // },
      updated_at: serverTimestamp()
    });
    
    const updatedUserDoc = await getDoc(userRef);
    
    if (!resetToZero) {
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
    
    const auditRef = collection(db, 'admin_audit');
    await addDoc(auditRef, {
      action: 'GRANT_PLAN_BENEFITS',
      admin_id: 'system',
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
    
    return { success: true, benefits: newBenefits };
    
  } catch (error) {
    console.error("❌ Admin error granting plan benefits:", error);
    throw error;
  }
};

export const adminGetAllSites = async (lastDoc = null, limit = 10) => {
  try {
    const sitesCollection = collection(db, 'blocked_sites');
    
    let sitesQuery;
    if (lastDoc) {
      sitesQuery = query(
        sitesCollection,
        firestoreOrderBy('created_at', 'desc'),
        startAfter(lastDoc),
        firestoreLimit(limit)
      );
    } else {
      sitesQuery = query(
        sitesCollection,
        firestoreOrderBy('created_at', 'desc'),
        firestoreLimit(limit)
      );
    }
    
    const sitesSnapshot = await getDocs(sitesQuery);
    
    const sites = [];
    sitesSnapshot.forEach((doc) => {
      sites.push({ id: doc.id, ...doc.data() });
    });
    
    const lastVisible = sitesSnapshot.docs[sitesSnapshot.docs.length - 1];
    
    return { sites, lastDoc: lastVisible };
  } catch (error) {
    console.error("❌ Admin error fetching all sites:", error);
    throw error;
  }
};

export const adminSoftDeleteSite = async (siteId, reason = "Admin soft deleted") => {
  try {
    await updateDoc(doc(db, 'blocked_sites', siteId), {
      is_active: false,
      soft_deleted_at: serverTimestamp(),
      soft_delete_reason: reason,
      updated_at: serverTimestamp()
    });
    
    return { success: true, message: "Site soft deleted" };
  } catch (error) {
    console.error("❌ Admin error soft deleting site:", error);
    throw error;
  }
};

export const adminHardDeleteSite = async (siteId, reason = "Admin hard deleted") => {
  try {    
    const siteDoc = await getDoc(doc(db, 'blocked_sites', siteId));
    const siteData = siteDoc.exists() ? siteDoc.data() : null;
    
    if (siteData) {
      await addDoc(collection(db, 'admin_audit_log'), {
        action: 'hard_delete_site',
        site_id: siteId,
        site_data: siteData,
        reason: reason,
        deleted_at: serverTimestamp()
      });
    }
    
    await deleteDoc(doc(db, 'blocked_sites', siteId));
    
    return { success: true, message: "Site permanently deleted" };
  } catch (error) {
    console.error("❌ Admin error hard deleting site:", error);
    throw error;
  }
};

export const adminUpdateSite = async (siteId, updateData) => {
  try {
    await updateDoc(doc(db, 'blocked_sites', siteId), {
      ...updateData,
      updated_at: serverTimestamp(),
      admin_modified: true,
      admin_modified_at: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(doc(db, 'blocked_sites', siteId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("❌ Admin error updating site:", error);
    throw error;
  }
};

export const adminGetCollection = async (collectionName) => {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    const documents = [];
    snapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    return documents;
  } catch (error) {
    console.error(`❌ Admin error fetching collection ${collectionName}:`, error);
    throw error;
  }
};

export const adminUpdateDocument = async (collectionName, documentId, updateData) => {
  try {
    await updateDoc(doc(db, collectionName, documentId), {
      ...updateData,
      admin_modified: true,
      admin_modified_at: serverTimestamp()
    });
    const updatedDoc = await getDoc(doc(db, collectionName, documentId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error(`❌ Admin error updating document:`, error);
    throw error;
  }
};

export const adminDeleteDocument = async (collectionName, documentId, createAuditLog = true) => {
  try {
    await deleteDoc(doc(db, collectionName, documentId));
    
    if (createAuditLog) {
      await addDoc(collection(db, 'admin_audit_log'), {
        action: 'delete_document',
        collection: collectionName,
        document_id: documentId,
        timestamp: serverTimestamp(),
        admin_uid: auth.currentUser?.uid || 'unknown'
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const adminGetSystemStats = async () => {
  try {
    const stats = await getAdminStats();
    
    const auditLogs = await getDocs(collection(db, 'admin_audit_log'));
    
    return {
      ...stats,
      audit: {
        totalLogs: auditLogs.size
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("❌ Admin error getting system stats:", error);
    throw error;
  }
};

export const adminSearchUsers = async (searchTerm) => {
  try {    
    const users = await getAllUsers();
    
    const filteredUsers = users.filter(user => 
      user.profile_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredUsers;
  } catch (error) {
    console.error("❌ Admin error searching users:", error);
    throw error;
  }
};

export const adminSearchSites = async (searchTerm) => {
  try {
    const { sites } = await adminGetAllSites(null, 100);
    
    const filteredSites = sites.filter(site => 
      site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredSites;
  } catch (error) {
    console.error("❌ Admin error searching sites:", error);
    throw error;
  }
};

export const checkAdminStatus = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    
    const isAdmin = userProfile?.isAdmin === true;
    
    return isAdmin;
  } catch (error) {
    console.error("❌ Error checking admin status:", error);
    return false;
  }
}; 

export const getUserRecentActivity = async (userId) => {
  try {    
    const activities = [];

    const activityRef = collection(db, 'user_activity');
    const activityQuery = query(
      activityRef,
      where('user_id', '==', userId),
      firestoreOrderBy('created_at', 'desc'),
      firestoreLimit(10)
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
    
    const sitesRef = collection(db, 'blocked_sites');
    const sitesQuery = query(
      sitesRef, 
      where('user_id', '==', userId),
      firestoreOrderBy('created_at', 'desc'),
      firestoreLimit(5)
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
    
    const overrideRef = doc(db, 'user_overrides', userId);
    const overrideDoc = await getDoc(overrideRef);
    
    if (overrideDoc.exists()) {
      const overrideData = overrideDoc.data();
      
      if (overrideData.last_admin_grant && overrideData.last_admin_grant.granted_at) {
        activities.push({
          type: 'admin_grant',
          description: `Received ${overrideData.last_admin_grant.quantity} overrides (Admin)`,
          timestamp: overrideData.last_admin_grant.granted_at,
          icon: '🎁',
          color: 'green'
        });
      }
      
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
    
    activities.sort((a, b) => {
      const aTime = a.timestamp?.seconds || a.timestamp?.getTime?.() / 1000 || 0;
      const bTime = b.timestamp?.seconds || b.timestamp?.getTime?.() / 1000 || 0;
      return bTime - aTime;
    });
    
    const recentActivities = activities.slice(0, 5);
    
    return recentActivities;
    
  } catch (error) {
    console.error("❌ Admin error fetching recent activity:", error);
    return [];
  }
};

export const getUserDetailsWithActivity = async (userId) => {
  try {    
    const userDetails = await getUserDetails(userId);
    
    const recentActivity = await getUserRecentActivity(userId);
    
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
    
    const enhancedDetails = {
      ...userDetails,
      recentActivity: recentActivity,
      subscriptionHistory: subscriptionHistory,
      lastActivity: recentActivity.length > 0 ? recentActivity[0] : null
    };
    
    return enhancedDetails;
    
  } catch (error) {
    console.error("❌ Admin error fetching enhanced user details:", error);
    return await getUserDetails(userId);
  }
};

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

export const getUserSites = async (userId) => {
  try {    
    const sitesRef = collection(db, 'blocked_sites');
    const sitesQuery = query(
      sitesRef, 
      where('user_id', '==', userId),
      firestoreOrderBy('created_at', 'desc')
    );
    const sitesSnapshot = await getDocs(sitesQuery);
    
    const sites = [];
    sitesSnapshot.forEach(doc => {
      const siteData = doc.data();
      sites.push({
        id: doc.id,
        ...siteData,
        efficiency: calculateSiteEfficiency(siteData),
        createdAt: siteData.created_at,
        updatedAt: siteData.updated_at || siteData.created_at
      });
    });
    
    return sites;
    
  } catch (error) {
    console.error("❌ Admin error fetching user sites:", error);
    return [];
  }
};

export const addUserActivity = async (userId, activityData) => {
  try {    
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
    return { id: docRef.id, ...activity };
  } catch (error) {
    console.error("❌ Error adding user activity:", error);
    throw error;
  }
};

export const initializeAdminStats = async () => {
  try {
    const statsRef = doc(db, 'admin_stats', 'global');
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      await setDoc(statsRef, {
        users: {
          total: 0,
          byPlan: { free: 0, pro: 0, elite: 0 }
        },
        sites: {
          total: 0
        },
        revenue: {
          total: 0,
          byPlan: { pro: 0, elite: 0 },
          byOverrides: 0,
          lastPurchase: null
        },
        lastUpdated: serverTimestamp()
      });
    }
    return statsDoc.data();
  } catch (error) {
    console.error("Error initializing admin stats:", error);
    throw error;
  }
};

export const updateUserStats = async (change, type) => {
  const statsRef = doc(db, 'admin_stats', 'global');

  try {
    await runTransaction(db, async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      const stats = statsDoc.data();

      if (type === 'create') {
        stats.users.total += 1;
        stats.users.byPlan.free += 1;
      } else if (type === 'delete') {
        stats.users.total -= 1;
        const oldPlan = change.before.data().plan || 'free';
        stats.users.byPlan[oldPlan] -= 1;
      } else if (type === 'update') {
        const oldPlan = change.before.data().plan || 'free';
        const newPlan = change.after.data().plan || 'free';
        if (oldPlan !== newPlan) {
          stats.users.byPlan[oldPlan] -= 1;
          stats.users.byPlan[newPlan] += 1;
        }
      }

      stats.lastUpdated = serverTimestamp();
      transaction.set(statsRef, stats);
    });
  } catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }
};

export const updateSiteStats = async (change, type) => {
  const statsRef = doc(db, 'admin_stats', 'global');

  try {
    await runTransaction(db, async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      const stats = statsDoc.data();

      if (type === 'create') {
        stats.sites.total += 1;
      } else if (type === 'delete') {
        stats.sites.total -= 1;
      }

      stats.lastUpdated = serverTimestamp();
      transaction.set(statsRef, stats);
    });
  } catch (error) {
    console.error("Error updating site stats:", error);
    throw error;
  }
};



export const getAdminStats = async () => {
  try {
    const statsRef = doc(db, 'admin_stats', 'global');
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      return await initializeAdminStats();
    }
    
    return statsDoc.data();
  } catch (error) {
    console.error("Error getting admin stats:", error);
    throw error;
  }
};

export const recalculateAllStats = async () => {
  try {    
    const [usersSnap, sitesSnap, purchasesSnap, overridePurchasesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'blocked_sites')),
      getDocs(collection(db, 'plan_purchases')),
      getDocs(collection(db, 'override_purchases'))
    ]);

    const stats = {
      users: {
        total: usersSnap.size,
        byPlan: { free: 0, pro: 0, elite: 0 }
      },
      sites: {
        total: sitesSnap.size
      },
      revenue: {
        total: 0,
        byPlan: { pro: 0, elite: 0 },
        byOverrides: 0,
        lastPurchase: null
      },
      lastUpdated: serverTimestamp()
    };

    usersSnap.forEach(doc => {
      const plan = doc.data().plan || 'free';
      stats.users.byPlan[plan] = (stats.users.byPlan[plan] || 0) + 1;
    });

    // Calculate plan purchase revenue
    purchasesSnap.forEach(doc => {
      const data = doc.data();
      if (data.amount_paid) {
        stats.revenue.total += data.amount_paid;
        if (data.plan && stats.revenue.byPlan[data.plan] !== undefined) {
          stats.revenue.byPlan[data.plan] += data.amount_paid;
        }
        if (!stats.revenue.lastPurchase || data.timestamp > stats.revenue.lastPurchase) {
          stats.revenue.lastPurchase = data.timestamp;
        }
      }
    });

    // Calculate override purchase revenue
    overridePurchasesSnap.forEach(doc => {
      const data = doc.data();
      if (data.amount_paid) {
        stats.revenue.total += data.amount_paid;
        stats.revenue.byOverrides += data.amount_paid;
        if (!stats.revenue.lastPurchase || data.timestamp > stats.revenue.lastPurchase) {
          stats.revenue.lastPurchase = data.timestamp;
        }
      }
    });

    await setDoc(doc(db, 'admin_stats', 'global'), stats);
    
    return stats;
  } catch (error) {
    console.error("Error recalculating stats:", error);
    throw error;
  }
};

const updateRevenueStats = async (amount, type = 'override') => {
  const statsRef = doc(db, 'admin_stats', 'global');

  try {
    await runTransaction(db, async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      let stats = statsDoc.exists() ? statsDoc.data() : await initializeAdminStats();

      // Update total revenue
      stats.revenue.total += amount;

      // Update specific revenue type
      if (type === 'override') {
        stats.revenue.byOverrides += amount;
      } else if (type === 'pro' || type === 'elite') {
        stats.revenue.byPlan[type] += amount;
      }

      // Update last purchase timestamp
      stats.revenue.lastPurchase = serverTimestamp();
      stats.lastUpdated = serverTimestamp();
      
      transaction.set(statsRef, stats);
    });
  } catch (error) {
    console.error("Error updating revenue stats:", error);
    throw error;
  }
};

export const adminGetDocumentIds = async (collectionName, searchTerm = '') => {
  try {    
    if (!searchTerm) {
      return [];
    }

    const searchLower = searchTerm.toLowerCase();
    let documents = [];

    if (!searchTerm.includes(' ') && !searchTerm.includes('@') && !searchTerm.includes('.')) {
      const docRef = doc(db, collectionName, searchTerm);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return [{
          id: docSnap.id,
          name: data.name || data.profile_name || undefined,
          email: data.profile_email || undefined,
          url: data.url || undefined,
          created_at: data.created_at || undefined
        }];
      } 
      return [];
    }

    const collectionRef = collection(db, collectionName);
    let queryRef;

    if (searchLower.includes('@')) {
      queryRef = query(collectionRef, 
        where('profile_email', '==', searchTerm),
        firestoreLimit(1)
      );
    }
    else if (searchLower.includes('.') || searchLower.includes('/')) {
      queryRef = query(collectionRef, 
        where('url', '==', searchTerm),
        firestoreLimit(1)
      );
    }
    else {
      queryRef = query(collectionRef,
        where('name', '==', searchTerm),
        firestoreLimit(1)
      );
    }

    const snapshot = await getDocs(queryRef);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      documents.push({
        id: doc.id,
        name: data.name || data.profile_name || undefined,
        email: data.profile_email || undefined,
        url: data.url || undefined,
        created_at: data.created_at || undefined
      });
    }
    
    return documents;
  } catch (error) {
    console.error(`❌ Admin error searching for document:`, error);
    throw error;
  }
};

export const adminGetDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Document ${documentId} not found in ${collectionName}`);
    }
    
    const document = { id: docSnap.id, ...docSnap.data() }; 
    return document;
  } catch (error) {
    console.error(`❌ Admin error fetching document:`, error);
    throw error;
  }
};

