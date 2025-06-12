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
import { getDatabase, ref, get } from 'firebase/database';

// Firebase configuration using direct .env values
const firebaseConfig = {
    apiKey: "AIzaSyCRcKOOzsp_nX8auUOhAFR-UVhGqIgmOjU",
    authDomain: "test-ext-ad0b2.firebaseapp.com",
    projectId: "test-ext-ad0b2",
    storageBucket: "test-ext-ad0b2.firebasestorage.app",
    messagingSenderId: "642984588666",
    appId: "1:642984588666:web:dd1fcd739567df3a4d92c3",
    measurementId: "G-B0MC8CDXCK",
    databaseURL: "https://test-ext-ad0b2-default-rtdb.firebaseio.com"
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
export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { data: { user: userCredential.user } };
  } catch (error) {
    console.error("Error in signUp:", error);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { data: { user: userCredential.user } };
  } catch (error) {
    console.error("Error in signIn:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { data: null };
  } catch (error) {
    console.error("Error in signOut:", error);
    throw error;
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

// User profile functions
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
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const updateData = {
      ...userData,
      updated_at: serverTimestamp(),
    };

    await updateDoc(doc(db, 'users', userId), updateData);
    
    const updatedDoc = await getDoc(doc(db, 'users', userId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Helper function to update user's blocked sites count (only active sites)
export const updateUserBlockedSitesCount = async (userId) => {
  try {
    // Get count from Realtime Database
    const rtdb = getDatabase();
    const sitesRef = ref(rtdb, `blocked_sites/${userId}`);
    const snapshot = await get(sitesRef);
    let totalSitesBlocked = 0;
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.is_active) {
          totalSitesBlocked++;
        }
      });
    }
    
    // Update count in Firestore user profile
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

// Admin functions
export const checkAdminStatus = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    return userDoc.data().isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Dashboard data
export const getDashboardData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const rtdb = getDatabase();
    const sitesRef = ref(rtdb, `blocked_sites/${userId}`);
    const sitesSnapshot = await get(sitesRef);
    
    const sites = [];
    let totalTimeSpent = 0;
    let todayTimeSpent = 0;
    const today = new Date().toISOString().split('T')[0];

    if (sitesSnapshot.exists()) {
      sitesSnapshot.forEach((childSnapshot) => {
        const site = childSnapshot.val();
        sites.push({ id: childSnapshot.key, ...site });
        totalTimeSpent += site.total_time_spent || 0;
        if (site.last_reset_date === today) {
          todayTimeSpent += site.time_spent_today || 0;
        }
      });
    }

    return {
      profile: { id: userDoc.id, ...userData },
      stats: {
        totalSitesBlocked: sites.length,
        activeSitesBlocked: sites.filter(site => site.is_active).length,
        totalTimeSpent,
        todayTimeSpent,
        totalTimeSaved: userData.total_time_saved || 0
      },
      sites
    };
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    throw error;
  }
};

// User activity
export const getUserRecentActivity = async (userId) => {
  try {
    const rtdb = getDatabase();
    const sitesRef = ref(rtdb, `blocked_sites/${userId}`);
    const sitesSnapshot = await get(sitesRef);
    
    const activity = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    if (sitesSnapshot.exists()) {
      sitesSnapshot.forEach((childSnapshot) => {
        const site = childSnapshot.val();
        if (site.daily_usage) {
          Object.entries(site.daily_usage).forEach(([date, timeSpent]) => {
            if (new Date(date) >= thirtyDaysAgo) {
              activity.push({
                date,
                site: site.name || site.url,
                timeSpent
              });
            }
          });
        }
      });
    }

    // Sort by date descending
    activity.sort((a, b) => new Date(b.date) - new Date(a.date));

    return activity;
  } catch (error) {
    console.error("Error getting user activity:", error);
    return [];
  }
};

// Override stats
export const getUserOverrideStats = async (userId) => {
  try {
    const rtdb = getDatabase();
    const sitesRef = ref(rtdb, `blocked_sites/${userId}`);
    const sitesSnapshot = await get(sitesRef);
    
    let totalOverrides = 0;
    let activeOverrides = 0;
    const overriddenSites = [];

    if (sitesSnapshot.exists()) {
      sitesSnapshot.forEach((childSnapshot) => {
        const site = childSnapshot.val();
        if (site.override_active) {
          activeOverrides++;
          overriddenSites.push({
            id: childSnapshot.key,
            name: site.name || site.url,
            initiatedAt: site.override_initiated_at,
            initiatedBy: site.override_initiated_by
          });
        }
        if (site.override_history) {
          totalOverrides += Object.keys(site.override_history).length;
        }
      });
    }

    return {
      totalOverrides,
      activeOverrides,
      overriddenSites
    };
  } catch (error) {
    console.error("Error getting override stats:", error);
    return {
      totalOverrides: 0,
      activeOverrides: 0,
      overriddenSites: []
    };
  }
};

// Subscription management
export const createSubscription = async (userId, subscriptionData) => {
  try {
    const subscriptionDoc = {
      user_id: userId,
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      start_date: subscriptionData.startDate || serverTimestamp(),
      end_date: subscriptionData.endDate || null,
      payment_method: subscriptionData.paymentMethod || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(doc(db, 'subscriptions', userId), subscriptionDoc);
    return { id: userId, ...subscriptionDoc };
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
};

export const getUserSubscription = async (userId) => {
  try {
    const subscriptionDoc = await getDoc(doc(db, 'subscriptions', userId));
    if (subscriptionDoc.exists()) {
      return { id: subscriptionDoc.id, ...subscriptionDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting user subscription:", error);
    throw error;
  }
};

export const updateSubscription = async (userId, subscriptionData) => {
  try {
    const updateData = {
      ...subscriptionData,
      updated_at: serverTimestamp(),
    };

    await updateDoc(doc(db, 'subscriptions', userId), updateData);
    
    const updatedDoc = await getDoc(doc(db, 'subscriptions', userId));
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
};

// Analytics functions
export const updateUserAnalytics = async (userId, analyticsData) => {
  try {
    const updateData = {
      ...analyticsData,
      updated_at: serverTimestamp(),
    };

    await updateDoc(doc(db, 'users', userId), updateData);
    return true;
  } catch (error) {
    console.error("Error updating user analytics:", error);
    throw error;
  }
};

export const exportAnalyticsData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    return {
      daily_stats: userData.daily_stats || {},
      weekly_stats: userData.weekly_stats || {},
      monthly_stats: userData.monthly_stats || {},
      total_time_saved: userData.total_time_saved || 0,
      total_sites_blocked: userData.total_sites_blocked || 0,
    };
  } catch (error) {
    console.error("Error exporting analytics data:", error);
    throw error;
  }
};

// Auth aliases
export const logIn = signIn;
export const logOut = signOutUser;