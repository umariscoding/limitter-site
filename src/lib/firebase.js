// Import the Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, addDoc, setDoc, getDoc, doc, updateDoc, onSnapshot, query, where, getDocs, initializeFirestore, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCRcKOOzsp_nX8auUOhAFR-UVhGqIgmOjU",
  authDomain: "test-ext-ad0b2.firebaseapp.com",
  projectId: "test-ext-ad0b2",
  storageBucket: "test-ext-ad0b2.firebasestorage.app",
  messagingSenderId: "642984588666",
  appId: "1:642984588666:web:dd1fcd739567df3a4d92c3",
  measurementId: "G-B0MC8CDXCK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with long polling to fix connection issues
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

// Set persistence to local (browser persistence)
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// Authentication functions
export const signUp = async (email, password) => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error during sign up:", error.code, error.message);
    
    // Provide more specific error messages based on Firebase error codes
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already in use. Please try a different email or sign in.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format. Please check your email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/password accounts are not enabled. Please contact support.');
    } else {
      throw new Error(error.message || 'Failed to create account. Please try again.');
    }
  }
};

export const logIn = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error during login:", error.code, error.message);
    
    // Provide more specific error messages based on Firebase error codes
    if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format. Please check your email address.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please try again.');
    } else {
      throw new Error(error.message || 'Failed to sign in. Please try again.');
    }
  }
};

export const logOut = async () => {
  return signOut(auth);
};

// User data functions
export const createUserProfile = async (userId, userData) => {
  await setDoc(doc(db, "users", userId), {
    ...userData,
    // Profile information
    profileImage: userData.profileImage || null,
    profileName: userData.name || userData.profileName,
    profileEmail: userData.email,
    // Tracking data
    totalTimeSaved: 0, // in minutes
    totalSitesBlocked: 0,
    // Activity tracking
    dailyStats: {},
    weeklyStats: {},
    monthlyStats: {},
    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const getUserProfile = async (userId) => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  console.log("User profile:", docSnap.data());
  console.log("User profile exists:", docSnap.exists());
  console.log("User profile id:", docSnap.id);
  console.log("User profile data:", docSnap.data());
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

export const updateUserProfile = async (userId, userData) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    ...userData,
    updatedAt: new Date(),
  });
};

// Profile-specific update functions
export const updateProfileImage = async (userId, imageUrl) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    profileImage: imageUrl,
    updatedAt: new Date(),
  });
};

export const updateProfileName = async (userId, name) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    profileName: name,
    updatedAt: new Date(),
  });
};

// Blocked Sites Management
export const addBlockedSite = async (userId, siteData) => {
  try {
    const siteDoc = await addDoc(collection(db, "blockedSites"), {
      userId,
      url: siteData.url,
      name: siteData.name || siteData.url,
      timeLimit: siteData.timeLimit || null, // daily time limit in minutes
      isBlocked: siteData.isBlocked !== false, // default to true
      blockType: siteData.blockType || 'permanent', // 'permanent', 'timed', 'scheduled'
      schedule: siteData.schedule || null, // for scheduled blocking
      customMessage: siteData.customMessage || null,
      category: siteData.category || 'other',
      timeSpentToday: 0,
      totalTimeSpent: 0,
      accessCount: 0,
      lastAccessed: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update user's total blocked sites count
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      totalSitesBlocked: arrayUnion(siteDoc.id),
      updatedAt: new Date(),
    });

    return siteDoc.id;
  } catch (error) {
    console.error("Error adding blocked site:", error);
    throw error;
  }
};

export const getBlockedSites = async (userId) => {
  try {
    const q = query(collection(db, "blockedSites"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const sites = [];
    querySnapshot.forEach((doc) => {
      sites.push({ id: doc.id, ...doc.data() });
    });
    
    return sites;
  } catch (error) {
    console.error("Error getting blocked sites:", error);
    throw error;
  }
};

export const updateBlockedSite = async (siteId, siteData) => {
  try {
    const siteRef = doc(db, "blockedSites", siteId);
    await updateDoc(siteRef, {
      ...siteData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating blocked site:", error);
    throw error;
  }
};

export const removeBlockedSite = async (userId, siteId) => {
  try {
    // Remove the site document
    await deleteDoc(doc(db, "blockedSites", siteId));
    
    // Update user's total blocked sites count
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      totalSitesBlocked: arrayRemove(siteId),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error removing blocked site:", error);
    throw error;
  }
};

// Time tracking functions
export const logTimeSpent = async (userId, siteId, timeSpent) => {
  try {
    const siteRef = doc(db, "blockedSites", siteId);
    const siteDoc = await getDoc(siteRef);
    
    if (siteDoc.exists()) {
      const currentData = siteDoc.data();
      const newTotalTime = (currentData.totalTimeSpent || 0) + timeSpent;
      const newTodayTime = (currentData.timeSpentToday || 0) + timeSpent;
      
      await updateDoc(siteRef, {
        totalTimeSpent: newTotalTime,
        timeSpentToday: newTodayTime,
        accessCount: (currentData.accessCount || 0) + 1,
        lastAccessed: new Date(),
        updatedAt: new Date(),
      });

      // Update user's total time saved
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await updateDoc(userRef, {
          totalTimeSaved: (userData.totalTimeSaved || 0) + timeSpent,
          updatedAt: new Date(),
        });
      }
    }
  } catch (error) {
    console.error("Error logging time spent:", error);
    throw error;
  }
};

export const resetDailyStats = async (userId) => {
  try {
    const q = query(collection(db, "blockedSites"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const updatePromises = [];
    querySnapshot.forEach((doc) => {
      updatePromises.push(
        updateDoc(doc.ref, {
          timeSpentToday: 0,
          updatedAt: new Date(),
        })
      );
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error resetting daily stats:", error);
    throw error;
  }
};

// Activity logging
export const logActivity = async (userId, activityData) => {
  try {
    await addDoc(collection(db, "userActivities"), {
      userId,
      action: activityData.action, // 'site_blocked', 'site_accessed', 'settings_changed', etc.
      details: activityData.details,
      timestamp: new Date(),
      metadata: activityData.metadata || {},
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

export const getUserActivities = async (userId, limit = 50) => {
  try {
    const q = query(
      collection(db, "userActivities"), 
      where("userId", "==", userId),
      // orderBy("timestamp", "desc"), // Note: This requires a composite index
      // limit(limit)
    );
    const querySnapshot = await getDocs(q);
    
    const activities = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort in JavaScript since we can't use orderBy without index
    activities.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
    
    return activities.slice(0, limit);
  } catch (error) {
    console.error("Error getting user activities:", error);
    throw error;
  }
};

// Analytics functions
export const getUserStats = async (userId) => {
  try {
    const userDoc = await getUserProfile(userId);
    const blockedSites = await getBlockedSites(userId);
    
    const totalSites = blockedSites.length;
    const activeSites = blockedSites.filter(site => site.isBlocked).length;
    const totalTimeSpent = blockedSites.reduce((sum, site) => sum + (site.totalTimeSpent || 0), 0);
    const todayTimeSpent = blockedSites.reduce((sum, site) => sum + (site.timeSpentToday || 0), 0);
    
    return {
      totalSitesBlocked: totalSites,
      activeSitesBlocked: activeSites,
      totalTimeSaved: userDoc?.totalTimeSaved || 0,
      totalTimeSpent: totalTimeSpent,
      todayTimeSpent: todayTimeSpent,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
};

// Subscription plan functions
export const getUserSubscription = async (userId) => {
  const q = query(collection(db, "subscriptions"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const subscriptionDoc = querySnapshot.docs[0];
    return { id: subscriptionDoc.id, ...subscriptionDoc.data() };
  }
  
  return null;
};

export const createSubscription = async (userId, plan) => {
  return addDoc(collection(db, "subscriptions"), {
    userId,
    plan,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export { auth, db }; 