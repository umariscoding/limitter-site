import { getDatabase, ref, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { serverTimestamp } from 'firebase/database';
import { normalizeDomain, encodeDomainForPath, decodeDomainFromPath } from './utils';
import { app } from './firebase';

// Initialize Realtime Database
const realtimeDb = getDatabase(app);

// Helper function to get blocked sites ref for a user
const getUserBlockedSitesRef = (userId) => ref(realtimeDb, `blocked_sites/${userId}`);

// Helper function to get specific blocked site ref
const getBlockedSiteRef = (userId, domain) => {
  const encodedDomain = encodeDomainForPath(domain);
  return ref(realtimeDb, `blocked_sites/${userId}/${encodedDomain}`);
};

// Add or update blocked site
export const addBlockedSite = async (userId, siteData) => {
  try {
    const normalizedDomain = normalizeDomain(siteData.url);
    const siteRef = getBlockedSiteRef(userId, normalizedDomain);
    
    // Check if site already exists
    const snapshot = await get(siteRef);
    const existingData = snapshot.val();
    
    if (existingData) {
      if (!existingData.is_active) {
        // Reactivate inactive site
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
        
        await update(siteRef, updateData);
        
        return { 
          id: normalizedDomain,
          ...existingData,
          ...updateData,
          wasReactivated: true,
          message: 'Website already added in the past. Reactivated with preserved settings.'
        };
      } else {
        return {
          id: normalizedDomain,
          ...existingData,
          wasReactivated: false,
          message: 'This website is already being tracked.'
        };
      }
    }
    
    // Create new site
    const siteDoc = {
      user_id: userId,
      url: normalizedDomain,
      name: siteData.name || normalizedDomain,
      
      // Time Management
      time_limit: siteData.timeLimit || 1800,
      time_remaining: siteData.timeLimit || 1800,
      time_spent_today: 0,
      last_reset_date: new Date().toISOString().split('T')[0],
      
      // Status Fields
      is_blocked: false,
      is_active: siteData.isActive !== false,
      blocked_until: null,
      
      // Scheduling & Advanced Features
      schedule: siteData.schedule || null,
      
      // Usage Analytics
      daily_usage: {},
      total_time_spent: 0,
      access_count: 0,
      last_accessed: null,
      
      // Override System
      override_active: false,
      override_initiated_by: null,
      override_initiated_at: null,
      
      // Timestamps
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await set(siteRef, siteDoc);
    
    return { 
      id: normalizedDomain,
      ...siteDoc,
      wasReactivated: false,
      message: 'Website added successfully.'
    };
  } catch (error) {
    console.error("Error in addBlockedSite:", error);
    throw error;
  }
};

// Get all blocked sites for a user
export const getBlockedSites = async (userId, includeInactive = false) => {
  try {
    const sitesRef = getUserBlockedSitesRef(userId);
    const snapshot = await get(sitesRef);
    const sites = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const decodedDomain = decodeDomainFromPath(childSnapshot.key);
        if (includeInactive || data.is_active) {
          sites.push({ 
            id: decodedDomain,
            ...data,
            url: decodedDomain // Ensure URL is decoded
          });
        }
      });
    }
    
    return sites;
  } catch (error) {
    console.error("Error in getBlockedSites:", error);
    return [];
  }
};

// Update blocked site
export const updateBlockedSite = async (userId, siteId, siteData) => {
  try {
    const siteRef = getBlockedSiteRef(userId, siteId);
    const updateData = {
      ...siteData,
      updated_at: serverTimestamp(),
    };

    await update(siteRef, updateData);
    
    // Get updated data
    const snapshot = await get(siteRef);
    return { id: siteId, ...snapshot.val() };
  } catch (error) {
    console.error("Error in updateBlockedSite:", error);
    throw error;
  }
};

// Remove (soft delete) blocked site
export const removeBlockedSite = async (userId, domain) => {
  try {
    const siteRef = getBlockedSiteRef(userId, domain);
    
    await update(siteRef, {
      is_active: false,
      updated_at: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error("Error in removeBlockedSite:", error);
    throw error;
  }
};

// Get blocked site by domain
export const getBlockedSiteByDomain = async (userId, domain) => {
  try {
    const normalizedDomain = normalizeDomain(domain);
    const siteRef = getBlockedSiteRef(userId, normalizedDomain);
    
    const snapshot = await get(siteRef);
    if (snapshot.exists()) {
      return { 
        id: normalizedDomain,
        ...snapshot.val(),
        url: normalizedDomain // Ensure URL is decoded
      };
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
    const siteRef = getBlockedSiteRef(userId, normalizedDomain);
    
    const snapshot = await get(siteRef);
    if (!snapshot.exists()) {
      console.warn(`Site ${domain} not found for user ${userId}`);
      return null;
    }

    const siteData = snapshot.val();
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

    await update(siteRef, updateData);
    
    return updateData;
  } catch (error) {
    console.error("Error updating site usage analytics:", error);
    throw error;
  }
};

// Get current time status for all user's sites
export const getUserSitesTimeStatus = async (userId) => {
  try {
    const sitesRef = getUserBlockedSitesRef(userId);
    const snapshot = await get(sitesRef);
    const sitesStatus = {};
    const today = new Date().toISOString().split('T')[0];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.is_active) {
          let timeRemaining = data.time_remaining || data.time_limit;
          let isBlocked = data.is_blocked || false;
          
          if (data.last_reset_date !== today) {
            timeRemaining = data.time_limit;
            isBlocked = false;
          }
          
          sitesStatus[data.url] = {
            siteId: childSnapshot.key,
            timeLimit: data.time_limit,
            timeRemaining: timeRemaining,
            timeSpentToday: data.last_reset_date === today ? data.time_spent_today : 0,
            isBlocked: isBlocked,
            blockedUntil: data.blocked_until,
            overrideActive: data.override_active || false,
            overrideInitiatedBy: data.override_initiated_by,
            overrideInitiatedAt: data.override_initiated_at
          };
        }
      });
    }
    
    return sitesStatus;
  } catch (error) {
    console.error("Error getting user sites time status:", error);
    return {};
  }
};

// Reset all sites for a new day
export const resetDailySiteTimes = async (userId) => {
  try {
    const sitesRef = getUserBlockedSitesRef(userId);
    const snapshot = await get(sitesRef);
    const today = new Date().toISOString().split('T')[0];
    const updates = {};
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.last_reset_date !== today) {
          updates[childSnapshot.key] = {
            ...data,
            time_remaining: data.time_limit,
            time_spent_today: 0,
            is_blocked: false,
            blocked_until: null,
            last_reset_date: today,
            override_active: false,
            override_initiated_by: null,
            override_initiated_at: null,
            updated_at: serverTimestamp(),
          };
        }
      });
    }
    
    if (Object.keys(updates).length > 0) {
      await update(sitesRef, updates);
      console.log(`🌅 Reset ${Object.keys(updates).length} sites for new day`);
    }
    
    return Object.keys(updates).length;
  } catch (error) {
    console.error("Error resetting daily site times:", error);
    throw error;
  }
};

// Admin functions
export const adminGetAllSites = async () => {
  try {
    console.log("🔍 Admin: Fetching all blocked sites...");
    const sitesRef = ref(realtimeDb, 'blocked_sites');
    const snapshot = await get(sitesRef);
    
    const sites = [];
    if (snapshot.exists()) {
      snapshot.forEach((userSnapshot) => {
        userSnapshot.forEach((siteSnapshot) => {
          sites.push({ id: siteSnapshot.key, ...siteSnapshot.val() });
        });
      });
    }
    
    console.log(`✅ Admin: Found ${sites.length} total sites`);
    return sites;
  } catch (error) {
    console.error("❌ Admin error fetching all sites:", error);
    throw error;
  }
};

export const adminHardDeleteSite = async (userId, siteId, reason = "Admin hard deleted") => {
  try {
    console.log(`💥 Admin: Hard deleting site ${siteId}`);
    
    const siteRef = getBlockedSiteRef(userId, siteId);
    
    // Get site data before deletion for logging
    const snapshot = await get(siteRef);
    const siteData = snapshot.exists() ? snapshot.val() : null;
    
    // Log deletion for audit trail (still using Firestore for audit logs)
    if (siteData) {
      // This part remains in Firestore as specified
      await addDoc(collection(db, 'admin_audit_log'), {
        action: 'hard_delete_site',
        site_id: siteId,
        site_data: siteData,
        reason: reason,
        deleted_at: serverTimestamp()
      });
    }
    
    // Delete the site
    await remove(siteRef);
    
    console.log("✅ Admin: Site hard deleted successfully");
    return { success: true, message: "Site permanently deleted" };
  } catch (error) {
    console.error("❌ Admin error hard deleting site:", error);
    throw error;
  }
};

export const adminUpdateSite = async (userId, siteId, updateData) => {
  try {
    console.log("🔧 Admin: Updating site:", siteId, updateData);
    
    const siteRef = getBlockedSiteRef(userId, siteId);
    await update(siteRef, {
      ...updateData,
      updated_at: serverTimestamp(),
      admin_modified: true,
      admin_modified_at: serverTimestamp()
    });
    
    console.log("✅ Admin: Site updated successfully");
    
    // Return updated site data
    const snapshot = await get(siteRef);
    return { id: siteId, ...snapshot.val() };
  } catch (error) {
    console.error("❌ Admin error updating site:", error);
    throw error;
  }
};

// Get user's sites for admin panel
export const getUserSites = async (userId) => {
  try {
    console.log("🔍 Admin: Fetching sites for user:", userId);
    
    const sitesRef = getUserBlockedSitesRef(userId);
    const snapshot = await get(sitesRef);
    
    const sites = [];
    if (snapshot.exists()) {
      snapshot.forEach(childSnapshot => {
        const siteData = childSnapshot.val();
        const decodedDomain = decodeDomainFromPath(childSnapshot.key);
        sites.push({
          id: decodedDomain,
          ...siteData,
          url: decodedDomain, // Ensure URL is decoded
          // Calculate site efficiency (assuming this function exists)
          efficiency: calculateSiteEfficiency(siteData),
          // Format timestamps
          createdAt: siteData.created_at,
          updatedAt: siteData.updated_at || siteData.created_at
        });
      });
    }
    
    console.log("✅ Admin: Found", sites.length, "sites for user");
    return sites;
  } catch (error) {
    console.error("❌ Admin error fetching user sites:", error);
    return [];
  }
}; 