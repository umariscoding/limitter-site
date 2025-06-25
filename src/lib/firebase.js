import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import { toast } from 'react-hot-toast';
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
  runTransaction,
  writeBatch
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
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

    // Send verification email immediately
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
      });
      console.log("✉️ Verification email sent");
    } catch (verificationError) {
      console.error("Error sending verification email:", verificationError);
      toast.error("Account created but couldn't send verification email. Please try signing in to resend it.");
    }

    await createUserProfile(user.uid, {
      email: user.email,
      ...metadata
    });
    await createSubscription(user.uid, metadata.plan || 'free');
    await updateUserStats(user.uid, 'create', metadata.plan || 'free');
    
    toast.success("Account created! Please check your email to verify your account.");
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
    
    if (!userCredential.user.emailVerified) {
      // If email isn't verified, send a new verification email
      try {
        await sendEmailVerification(userCredential.user, {
          url: `${window.location.origin}/login?email=${encodeURIComponent(email)}`,
          handleCodeInApp: true,
        });
        throw new Error('Please verify your email first. A new verification email has been sent.');
      } catch (verificationError) {
        throw new Error('Please verify your email first. If you need a new verification email, try signing in again.');
      }
    }

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
      subscription_status: 'active',
      override_balance: 0,
      total_spent: 0,
      last_purchase: null,
      settings: {
        notifications: true,
        theme: 'light',
        email_updates: true
      },
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', userId), userDoc);

    const subscriptionDoc = {
      user_id: userId,
      plan: userData.plan || 'free',
      status: 'active',
      started_at: serverTimestamp(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    await setDoc(doc(db, 'subscriptions', userId), subscriptionDoc);

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
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    
    if (userData.total_spent === undefined) {
      await initializeUserProfile(userId, userData);
      return await getUserProfile(userId);
    }

    return {
      id: userDoc.id,
      ...userData,
      profile_email: userData.profile_email || userData.email,
      profile_name: userData.profile_name || userData.name || 'Anonymous',
      plan: userData.plan || 'free',
      total_time_saved: userData.total_time_saved || 0,
      total_sites_blocked: userData.total_sites_blocked || 0,
      daily_stats: userData.daily_stats || {},
      weekly_stats: userData.weekly_stats || {},
      monthly_stats: userData.monthly_stats || {},
      total_spent: userData.total_spent || 0
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
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

export const updateUserSubscription = async (userId, plan, paymentData) => {
  try {
    let currentUser = await getUserProfile(userId);

    if (!currentUser) {
      await createUserProfile(userId, { plan: 'free' });
      currentUser = await getUserProfile(userId);
    }

    if (!currentUser.plan) {
      console.log("⚠️ No plan found, defaulting to free");
      await updateDoc(doc(db, 'users', userId), {
        plan: 'free',
        updated_at: serverTimestamp()
      });
      currentUser.plan = 'free';
    }
    
    const previousPlan = currentUser.plan;
    
    const existingSubscription = await getUserSubscription(userId);
    
    let planPrice = 0;
    if (plan === 'pro') {
      planPrice = 4.99;
    } else if (plan === 'elite') {
      planPrice = 11.99;
    }

    
    
    let transaction = null;
    if (planPrice > 0) {
      try {
        const transactionData = {
          type: 'plan_purchase',
          amount: planPrice,
          description: `Upgraded to ${plan.toUpperCase()} plan`,
          payment_method: 'card',
          payment_data: {
            last4: paymentData.cardNumber.slice(-4),
            expiry: paymentData.expiryDate,
            name: paymentData.nameOnCard
          },
          metadata: {
            previous_plan: previousPlan || 'free',
            new_plan: plan,
            price_per_unit: planPrice,
            quantity: 1
          },
          status: 'completed',
          user_id: userId,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };
        
      await updateUserStats(
        { plan: previousPlan },
        'decrement'
      );
      await updateUserStats(
        { plan: plan },
        'increment'
      );
        if (previousPlan !== plan) {
          await deleteAllUserSites(userId, `Plan changed from ${previousPlan} to ${plan}`);
        }
        
        transaction = await createTransaction(userId, transactionData);
      } catch (transactionError) {
        console.error('❌ Error creating transaction:', transactionError);
        throw transactionError;
      }
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
          previousPlan: previousPlan || 'free',
          newPlan: plan,
          upgradedBy: 'user',
          upgradeSource: 'website',
          benefits: benefitsText,
          amount_paid: planPrice,
          transaction_id: transaction?.id
        }
      });
      
      return { 
        id: userId, 
        ...existingSubscription, 
        ...updateData,
        transaction: transaction ? { id: transaction.id } : null
      };
    }

    const newSubscription = await createSubscription(userId, plan);
    
    await updateDoc(doc(db, 'users', userId), {
      plan: plan,
      updated_at: serverTimestamp(),
    });
    
    await grantPlanBenefits(userId, plan, previousPlan || 'free', "New plan subscription");
    
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
        previousPlan: previousPlan || 'free',
        newPlan: plan,
        upgradedBy: 'user',
        upgradeSource: 'website',
        benefits: benefitsText,
        amount_paid: planPrice,
        transaction_id: transaction?.id
      }
    });
    
    return {
      ...newSubscription,
      transaction: transaction ? { id: transaction.id } : null
    };
  } catch (error) {
    console.error("❌ Error in updateUserSubscription:", error);
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

export const purchaseOverrides = async (userId, quantity, paymentData) => {
  try {
    const pricePerOverride = 1.99;
    const totalPrice = quantity * pricePerOverride;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const overrideStats = await getUserOverrideStats(userId);
    const newOverrideBalance = (overrideStats.overrides || 0) + quantity;
    const newTotalPurchased = (overrideStats.total_overrides_purchased || 0) + quantity;
    
    const transaction = await createTransaction(userId, {
      type: 'override_purchase',
      amount: totalPrice,
      description: `Purchased ${quantity} override${quantity > 1 ? 's' : ''}`,
      payment_method: 'card',
      metadata: {
        quantity,
        price_per_unit: pricePerOverride,
        new_balance: newOverrideBalance
      }
    });

    await updateDoc(doc(db, 'user_overrides', userId), {
      overrides: newOverrideBalance,
      total_overrides_purchased: newTotalPurchased,
      total_spent: (overrideStats.total_spent || 0) + totalPrice,
      updated_at: serverTimestamp()
    });
        
    return {
      success: true,
      transactionId: transaction.transaction_id,
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
    const [userProfile, blockedSites, subscription, transactions] = await Promise.all([
      getUserProfile(userId),
      getBlockedSites(userId),
      getUserSubscription(userId),
      getTransactions(userId, 5) 
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

    const transactionSummary = {
      recent: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.created_at,
        status: t.status
      })),
      total_spent: transactions.reduce((sum, t) => t.status === 'completed' ? sum + t.amount : sum, 0),
      last_transaction: transactions[0] || null
    };

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

      transactions: transactionSummary,
      
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

export const getUserAnalytics = async (userId) => {
  try {
    const [userProfile, subscription, transactions] = await Promise.all([
      getUserProfile(userId),
      getUserSubscription(userId),
      getTransactions(userId, 10) 
    ]);
    
    const plan = subscription?.plan || userProfile?.plan || 'free';
    const planLimits = getPlanAnalyticsLimits(plan);
    
    // Calculate transaction stats
    const transactionStats = {
      total_spent: 0,
      total_transactions: transactions.length,
      by_type: {},
      recent_transactions: transactions.slice(0, 5),
      spending_history: {},
      average_transaction: 0
    };

    transactions.forEach(txn => {
      if (txn.status === 'completed') {
        transactionStats.total_spent += txn.amount;
        transactionStats.by_type[txn.type] = (transactionStats.by_type[txn.type] || 0) + 1;

        const month = new Date(txn.created_at.seconds * 1000).toISOString().slice(0, 7);
        transactionStats.spending_history[month] = (transactionStats.spending_history[month] || 0) + txn.amount;
      }
    });

    transactionStats.average_transaction = 
      transactionStats.total_transactions > 0 ? 
      transactionStats.total_spent / transactionStats.total_transactions : 0;

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
      transactions: transactionStats,
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
          collection(db, 'transactions'),
          where('user_id', '==', userId),
          where('type', '==', 'override_purchase'),
          firestoreOrderBy('created_at', 'desc'),
          firestoreLimit(5)
        );
        
        const historySnapshot = await getDocs(historyQuery);
        stats.recentHistory = historySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().created_at // Map created_at to timestamp for backward compatibility
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
    
    return userDetails;
  } catch (error) {
    console.error("❌ Admin error fetching user details:", error);
    throw error;
  }
};

export const adminUpdateUserProfile = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      ...updateData,
      updated_at: serverTimestamp(),
    });
    
    await getDoc(userRef);
    return await getUserProfile(userId);
  } catch (error) {
    console.error("❌ Admin error updating user profile:", error);
    throw error;
  }
};

export const adminGrantOverrides = async (userId, quantity, reason = "Admin granted") => {
  try {    
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
    
    if (previousPlan !== newPlan) {
      await deleteAllUserSites(userId, `Admin changed plan from ${previousPlan} to ${newPlan}`);
    }
    
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
    
    // Update admin stats for plan change
    await updateUserStats(
      { plan: previousPlan },
      'decrement'
    );
    await updateUserStats(
      { plan: newPlan },
      'increment'
    );
    
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
    
    return await getUserSubscription(userId);
  } catch (error) {
    console.error("❌ Error in adminChangeUserPlan:", error);
    throw error;
  }
};

export const grantPlanBenefits = async (userId, newPlan, previousPlan = 'free', reason = "Plan upgrade benefits") => {
  try {
    
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
      sites_limit: newBenefits.sites_limit,
      devices_limit: newBenefits.devices_limit,
      lockout_duration: newBenefits.lockout_duration,
      monthly_overrides: newBenefits.monthly_overrides,
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

export const adminHardDeleteSite = async (siteId, reason = "Admin deleted") => {
  try {
    // Get site data before deletion for audit log
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
    
    // Update admin stats to decrease site count
    await updateSiteStats(null, 'delete');
    
    await deleteDoc(doc(db, 'blocked_sites', siteId));
    
    return { success: true, message: "Site deleted successfully" };
  } catch (error) {
    console.error("Error in adminHardDeleteSite:", error);
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
    const [stats] = await Promise.all([
      getAdminStats(),
      // getTransactions(null, 10)
    ]);

    const enhancedStats = {
      ...stats,
      // transactions: {
      //   ...stats.transactions,
      //   trends: transactionTrends,
      //   summary: {
      //     total_volume: recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      //     average_transaction: recentTransactions.length > 0 ? 
      //       recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / recentTransactions.length : 0,
      //     success_rate: transactionTrends.success_rate,
      //     most_common_type: Object.entries(transactionTrends.transaction_types)
      //       .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
      //   }
      // },
      revenue: {
        ...stats.revenue,
        // daily_trend: transactionTrends.daily_volume,
        // by_payment_method: transactionTrends.payment_methods,
        // by_type: transactionTrends.transaction_types
      },
      generatedAt: new Date().toISOString()
    };

    return enhancedStats;
  } catch (error) {
    console.error("❌ Admin error getting system stats:", error);
    throw error;
  }
};

export const getUserByEmailOrId = async (searchTerm) => {
  try {
    // Try to find by email
    const usersRef = collection(db, 'users');
    let userQuery = query(
      usersRef,
      where('profile_email', '==', searchTerm.toLowerCase())
    );
    
    let userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      // If not found by email, try by ID
      const userDocRef = doc(db, 'users', searchTerm);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    }
    
    // Return the first matching user
    const document = userSnapshot.docs[0];
    return { id: document.id, ...document.data() };
  } catch (error) {
    console.error("Error fetching user by email or ID:", error);
    return null;
  }
};

export const adminSearchUsers = async (searchTerm, existingUsers) => {
  try {    
    // Search in the provided existing users list
    const filteredUsers = existingUsers.filter(user => 
      user.profile_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If no results found in existing list and the search term looks like an email or ID
    if (filteredUsers.length === 0 && 
        (searchTerm.includes('@') || searchTerm.length > 20)) { // Basic check for email or ID
      const exactUser = await getUserByEmailOrId(searchTerm);
      if (exactUser && !existingUsers.some(u => u.id === exactUser.id)) {
        return [...existingUsers, exactUser];
      }
    }
    
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
    const [userDetails, recentActivity, transactions] = await Promise.all([
      getUserDetails(userId),
      getUserRecentActivity(userId),
      // getTransactions(userId, 10)
    ]);
    
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

    // Add transaction history
    // const transactionHistory = transactions.map(t => ({
    //   type: 'transaction',
    //   description: t.description,
    //   timestamp: t.created_at,
    //   amount: t.amount,
    //   status: t.status,
    //   icon: t.type === 'plan_purchase' ? '💳' : '⚡',
    //   color: t.status === 'completed' ? 'green' : 'yellow',
    //   metadata: t.metadata
    // }));
    
    const enhancedDetails = {
      ...userDetails,
      recentActivity: recentActivity,
      subscriptionHistory: subscriptionHistory,
      // transactionHistory: transactionHistory,
      // spending: {
      //   total: transactions.reduce((sum, t) => t.status === 'completed' ? sum + t.amount : sum, 0),
      //   by_type: transactions.reduce((acc, t) => {
      //     if (t.status === 'completed') {
      //       acc[t.type] = (acc[t.type] || 0) + t.amount;
      //     }
      //     return acc;
      //   }, {}),
      //   recent_transactions: transactions.slice(0, 5)
      // },
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
          lastPurchase: null
        },
        transactions: {
          total: 0,
          byType: {},
          byStatus: {},
          byPaymentMethod: {}
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
      if (!statsDoc.exists()) {
        throw new Error('Admin stats document does not exist');
      }
      const stats = statsDoc.data();

      // Initialize stats if they don't exist
      if (!stats.users) {
        stats.users = {
          total: 0,
          byPlan: { free: 0, pro: 0, elite: 0 }
        };
      }
      if (!stats.users.byPlan) {
        stats.users.byPlan = { free: 0, pro: 0, elite: 0 };
      }

      if (type === 'create') {
        stats.users.total += 1;
        stats.users.byPlan.free += 1;
      } else if (type === 'delete') {
        stats.users.total = Math.max(0, stats.users.total - 1);
        if (change.plan) {
          stats.users.byPlan[change.plan] = Math.max(0, (stats.users.byPlan[change.plan] || 0) - 1);
        }
      } else if (type === 'increment' && change.plan) {
        stats.users.byPlan[change.plan] = (stats.users.byPlan[change.plan] || 0) + 1;
      } else if (type === 'decrement' && change.plan) {
        stats.users.byPlan[change.plan] = Math.max(0, (stats.users.byPlan[change.plan] || 0) - 1);
      }

      stats.lastUpdated = serverTimestamp();
      transaction.update(statsRef, stats);
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
      let statsDoc = await transaction.get(statsRef);
      if (!statsDoc.exists()) {
        await initializeAdminStats();
        statsDoc = await transaction.get(statsRef);
      }
      const stats = statsDoc.data();

      if (type === 'create') {
        stats.sites.total += 1;
      } else if (type === 'delete') {
        stats.sites.total -= 1;
      }

      stats.lastUpdated = serverTimestamp();
      transaction.update(statsRef, stats);
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
    const [usersSnap, sitesSnap, transactionsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'blocked_sites')),
      getDocs(collection(db, 'transactions'))
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
        lastPurchase: null
      },
      transactions: {
        total: 0,
        byType: {},
        byStatus: {},
        byPaymentMethod: {}
      },
      lastUpdated: serverTimestamp()
    };

    usersSnap.forEach(doc => {
      const plan = doc.data().plan || 'free';
      stats.users.byPlan[plan] = (stats.users.byPlan[plan] || 0) + 1;
    });

    // Calculate revenue and transaction stats from all transactions
    transactionsSnap.forEach(doc => {
      const transaction = doc.data();
      
      // Update transaction stats
      stats.transactions.total++;
      stats.transactions.byType[transaction.type] = (stats.transactions.byType[transaction.type] || 0) + 1;
      stats.transactions.byStatus[transaction.status] = (stats.transactions.byStatus[transaction.status] || 0) + 1;
      stats.transactions.byPaymentMethod[transaction.payment_method] = 
        (stats.transactions.byPaymentMethod[transaction.payment_method] || 0) + 1;
      
      // Update revenue stats for completed transactions
      if (transaction.status === 'completed') {
        stats.revenue.total += transaction.amount;
        
        if (transaction.type === 'plan_purchase' && transaction.metadata?.new_plan) {
          const plan = transaction.metadata.new_plan;
          if (stats.revenue.byPlan[plan] !== undefined) {
            stats.revenue.byPlan[plan] += transaction.amount;
          }
        }

        // Track most recent purchase
        if (!stats.revenue.lastPurchase || 
            transaction.created_at > stats.revenue.lastPurchase) {
          stats.revenue.lastPurchase = transaction.created_at;
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

const updateRevenueStats = async (amount, type, transactionDetails) => {
  const statsRef = doc(db, 'admin_stats', 'global');

  try {
    await runTransaction(db, async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      if (!statsDoc.exists()) {
        throw new Error('Admin stats document does not exist');
      }
      let stats = statsDoc.data();

      // Initialize stats if they don't exist
      if (!stats.revenue) {
        stats.revenue = {
          total: 0,
          byOverrides: 0,
          byPlan: { pro: 0, elite: 0 },
          lastPurchase: null
        };
      }
      if (!stats.transactions) {
        stats.transactions = {
          total: 0,
          byType: {},
          byStatus: {},
          byPaymentMethod: {}
        };
      }

      // Update revenue stats
      stats.revenue.total += amount;
      if (type === 'override') {
        stats.revenue.byOverrides = (stats.revenue.byOverrides || 0) + amount;
      } else if (type === 'pro' || type === 'elite') {
        stats.revenue.byPlan[type] = (stats.revenue.byPlan[type] || 0) + amount;
      }
      stats.revenue.lastPurchase = serverTimestamp();

      // Update transaction stats
      stats.transactions.total++;
      
      // Update byType stats
      if (transactionDetails.type) {
        stats.transactions.byType[transactionDetails.type] = 
          (stats.transactions.byType[transactionDetails.type] || 0) + 1;
      }
      
      // Update byStatus stats
      if (transactionDetails.status) {
        stats.transactions.byStatus[transactionDetails.status] = 
          (stats.transactions.byStatus[transactionDetails.status] || 0) + 1;
      }
      
      // Update byPaymentMethod stats
      if (transactionDetails.payment_method) {
        stats.transactions.byPaymentMethod[transactionDetails.payment_method] = 
          (stats.transactions.byPaymentMethod[transactionDetails.payment_method] || 0) + 1;
      }

      stats.lastUpdated = serverTimestamp();
      transaction.update(statsRef, stats);
    });
  } catch (error) {
    console.error("Error updating revenue stats:", error);
    throw error;
  }
};

export const createTransaction = async (userId, transactionData) => {
  try {
    // Validate required fields
    if (!userId || !transactionData.type || !transactionData.amount) {
      throw new Error('Missing required transaction fields');
    }

    // Create metadata object only with defined values
    const metadata = {};
    if (transactionData.metadata?.quantity) metadata.quantity = transactionData.metadata.quantity;
    if (transactionData.metadata?.price_per_unit) metadata.price_per_unit = transactionData.metadata.price_per_unit;
    if (transactionData.metadata?.previous_plan) metadata.previous_plan = transactionData.metadata.previous_plan;
    if (transactionData.metadata?.new_plan) metadata.new_plan = transactionData.metadata.new_plan;

    const transaction = {
      user_id: userId,
      type: transactionData.type,
      amount: transactionData.amount,
      description: transactionData.description,
      status: transactionData.status || 'completed',
      payment_method: transactionData.payment_method || 'card',
      metadata,
      created_at: serverTimestamp()
    };

    // Create the transaction
    const transactionRef = doc(collection(db, 'transactions'));
    await setDoc(transactionRef, transaction);

    // Update admin stats and user data for completed transactions
    if (transaction.status === 'completed') {
      // Determine the type for revenue stats
      let revenueType = 'override';
      if (transaction.type === 'plan_purchase' && metadata.new_plan) {
        revenueType = metadata.new_plan;
      }
      
      // Update revenue and transaction stats
      await updateRevenueStats(
        transaction.amount,
        revenueType,
        {
          type: transaction.type,
          status: transaction.status,
          payment_method: transaction.payment_method
        }
      );

      // Update user's total_spent field
      const userRef = doc(db, 'users', userId);
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User document does not exist!');
        }
        
        const userData = userDoc.data();
        transaction.update(userRef, {
          total_spent: (userData.total_spent || 0) + transactionData.amount,
          last_purchase: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      });
    }

    return {
      id: transactionRef.id,
      ...transaction
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const getTransactions = async (userId = null, limit = 10) => {
  try {
    let transactionsQuery;
    if (userId) {
      transactionsQuery = query(
        collection(db, 'transactions'),
        where('user_id', '==', userId),
        firestoreOrderBy('created_at', 'desc'),
        firestoreLimit(limit)
      );
    } else {
      transactionsQuery = query(
        collection(db, 'transactions'),
        firestoreOrderBy('created_at', 'desc'),
        firestoreLimit(limit)
      );
    }

    const snapshot = await getDocs(transactionsQuery);
    const transactions = [];
    
    snapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export const adminGetAllTransactions = async (lastDoc = null, limit = 10) => {
  try {
    const transactionsCollection = collection(db, 'transactions');
    
    let transactionsQuery;
    if (lastDoc) {
      transactionsQuery = query(
        transactionsCollection,
        firestoreOrderBy('created_at', 'desc'),
        startAfter(lastDoc),
        firestoreLimit(limit)
      );
    } else {
      transactionsQuery = query(
        transactionsCollection,
        firestoreOrderBy('created_at', 'desc'),
        firestoreLimit(limit)
      );
    }
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    const transactions = [];
    transactionsSnapshot.forEach((doc) => {
      transactions.push({ 
        id: doc.id, 
        ...doc.data(),
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(doc.data().amount || 0),
        formattedDate: formatActivityTimestamp(doc.data().created_at)
      });
    });
    
    const lastVisible = transactionsSnapshot.docs[transactionsSnapshot.docs.length - 1];
    
    return { transactions, lastDoc: lastVisible };
  } catch (error) {
    console.error("❌ Admin error fetching all transactions:", error);
    throw error;
  }
};

export const adminSearchTransactions = async (searchTerm) => {
  try {
    const { transactions } = await adminGetAllTransactions(null, 100);
    
    const filteredTransactions = transactions.filter(transaction => 
      transaction.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.formattedAmount?.includes(searchTerm)
    );
    
    return filteredTransactions;
  } catch (error) {
    console.error("❌ Admin error searching transactions:", error);
    throw error;
  }
};

export const adminGetTransactionDetails = async (transactionId) => {
  try {
    const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));
    if (!transactionDoc.exists()) {
      throw new Error('Transaction not found');
    }

    const transaction = transactionDoc.data();
    
    // Get user details for this transaction
    const userDoc = await getDoc(doc(db, 'users', transaction.user_id));
    const userData = userDoc.exists() ? userDoc.data() : null;

    return {
      id: transactionDoc.id,
      ...transaction,
      user: userData ? {
        id: userData.id,
        email: userData.profile_email,
        name: userData.profile_name,
        plan: userData.plan
      } : null,
      formattedAmount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(transaction.amount || 0),
      formattedDate: formatActivityTimestamp(transaction.created_at)
    };
  } catch (error) {
    console.error("❌ Admin error getting transaction details:", error);
    throw error;
  }
};

export const ensureUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      // Create new profile if it doesn't exist
      return await createUserProfile(userId, {});
    }

    const userData = userDoc.data();
    const updates = {};
    
    // Check and add missing fields
    if (userData.plan === undefined) updates.plan = 'free';
    if (userData.subscription_status === undefined) updates.subscription_status = 'active';
    if (userData.override_balance === undefined) updates.override_balance = 0;
    if (userData.total_spent === undefined) updates.total_spent = 0;
    if (userData.last_purchase === undefined) updates.last_purchase = null;
 
    
    // Only update if there are missing fields
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updated_at: serverTimestamp()
      });
    }

    // Ensure subscription document exists
    const subscriptionDoc = await getDoc(doc(db, 'subscriptions', userId));
    if (!subscriptionDoc.exists()) {
      const subscriptionData = {
        user_id: userId,
        plan: userData.plan || 'free',
        status: 'active',
        started_at: serverTimestamp(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      await setDoc(doc(db, 'subscriptions', userId), subscriptionData);
    }

    return await getUserProfile(userId);
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    throw error;
  }
};

// Add this new function to initialize or update money_spent
export const initializeUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // New user - initialize with default values
      await setDoc(userRef, {
        ...userData,
        total_spent: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } else if (userDoc.data().total_spent === undefined) {
      // Existing user but no money_spent field - calculate from transactions
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('user_id', '==', userId),
        where('status', '==', 'completed')
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const totalSpent = transactionsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      
      await updateDoc(userRef, {
        total_spent: totalSpent,
        updated_at: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error initializing user profile:", error);
    throw error;
  }
};

export const deleteAllUserSites = async (userId, reason = "Plan change") => {
  try {
    
    // Get all sites for the user
    const sitesRef = collection(db, 'blocked_sites');
    const sitesQuery = query(
      sitesRef, 
      where('user_id', '==', userId)
    );
    const sitesSnapshot = await getDocs(sitesQuery);
    
    // Create audit log entries and delete sites
    const batch = writeBatch(db);
    
    // Create audit log entries first
    const auditPromises = sitesSnapshot.docs.map(doc => {
      const siteData = doc.data();
      return addDoc(collection(db, 'admin_audit_log'), {
        action: 'hard_delete_site',
        site_id: doc.id,
        site_data: siteData,
        reason: reason,
        deleted_at: serverTimestamp()
      });
    });
    
    // Wait for all audit logs to be created
    await Promise.all(auditPromises);
    
    // Update admin stats for each deleted site
    await Promise.all(
      Array(sitesSnapshot.size).fill().map(() => updateSiteStats(null, 'delete'))
    );
    
    // Then delete all sites
    sitesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Update user's total sites count to 0
    await updateDoc(doc(db, 'users', userId), {
      total_sites_blocked: 0,
      updated_at: serverTimestamp()
    });
    
    return { success: true, deletedCount: sitesSnapshot.size };
  } catch (error) {
    console.error("❌ Error deleting all user sites:", error);
    throw error;
  }
};

export const adminGetDocumentIds = async (collectionName, searchTerm) => {
  try {
    const collectionRef = collection(db, collectionName);
    let snapshot;
    
    // Get all documents in the collection
    snapshot = await getDocs(collectionRef);
    
    // Filter and map the results
    const results = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if any of the searchable fields match the search term
      const matchesSearch = 
        doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.profile_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.profile_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.url?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (matchesSearch) {
        results.push({
          id: doc.id,
          name: data.name || data.profile_name,
          email: data.email || data.profile_email,
          url: data.url
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error(`❌ Admin error searching documents in ${collectionName}:`, error);
    throw error;
  }
};

export const adminGetDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error(`❌ Admin error getting document from ${collectionName}:`, error);
    throw error;
  }
};
