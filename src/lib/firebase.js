import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from 'firebase/auth';
import { toast } from 'react-hot-toast';
import {
  authApi,
  accountApi,
  policyApi,
  usageApi,
  overrideApi,
  billingApi,
} from './api';

const firebaseConfig = {
  apiKey: "AIzaSyCRcKOOzsp_nX8auUOhAFR-UVhGqIgmOjU",
  authDomain: "test-ext-ad0b2.firebaseapp.com",
  projectId: "test-ext-ad0b2",
  storageBucket: "test-ext-ad0b2.firebasestorage.app",
  messagingSenderId: "642984588666",
  appId: "1:642984588666:web:dd1fcd739567df3a4d92c3",
  measurementId: "G-B0MC8CDXCK",
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Missing Firebase configuration');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = null;

export const signUp = async (email, password, metadata = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
      });
    } catch (verificationError) {
      toast.error("Account created but couldn't send verification email.");
    }

    try {
      await authApi.setupAccount();
    } catch (setupError) {
      console.warn("Account setup via API failed, will retry on next login:", setupError.message);
    }

    toast.success("Account created! Please check your email to verify your account.");
    return { user };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already in use. Please try a different email or sign in.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format. Please check your email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    }
    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
};

export const logIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    if (!userCredential.user.emailVerified) {
      try {
        await sendEmailVerification(userCredential.user, {
          url: `${window.location.origin}/login?email=${encodeURIComponent(email)}`,
          handleCodeInApp: true,
        });
        throw new Error('Please verify your email first. A new verification email has been sent.');
      } catch (verificationError) {
        if (verificationError.message.includes('verify your email')) throw verificationError;
        throw new Error('Please verify your email first.');
      }
    }
    await ensureUserProfile();
    toast.success("Login successful");
    return { user: userCredential.user };
  } catch (error) {
    if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    }
    throw new Error(error.message || 'Failed to sign in. Please try again.');
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    toast.success("Logged out successfully");
  } catch (error) {
    throw new Error(error.message);
  }
};

export const ensureUserProfile = async () => {
  try {
    const data = await authApi.bootstrap();
    return mapBootstrapToProfile(data);
  } catch (err) {
    if (err.status === 404) {
      const setupData = await authApi.setupAccount();
      return mapBootstrapToProfile(setupData);
    }
    throw err;
  }
};

function mapBootstrapToProfile(data) {
  const user = data?.user || data;
  const account = data?.account || {};
  const subscription = data?.subscription || {};
  return {
    uid: user.uid,
    profile_name: user.displayName || account.name || '',
    profile_email: user.email || '',
    profile_image: user.photoURL || null,
    plan: subscription.planCode || account.currentPlanCode || 'free',
    accountId: account.accountId || user.primaryAccountId || user.uid,
    isAdmin: false,
    total_time_saved: 0,
    total_sites_blocked: 0,
    subscription_status: subscription.status || 'active',
    override_balance: 0,
    _raw: data,
  };
}

export const getUserProfile = async () => {
  const data = await accountApi.getProfile();
  return mapBootstrapToProfile(data);
};

export const updateUserProfile = async (_userId, profileData) => {
  if (profileData.profile_name || profileData.displayName) {
    await accountApi.updateProfile({
      displayName: profileData.profile_name || profileData.displayName,
    });
  }
};

export const getUserSubscription = async () => {
  const data = await accountApi.getProfile();
  const sub = data?.subscription || {};
  const account = data?.account || {};
  return {
    plan: sub.planCode || account.currentPlanCode || 'free',
    status: sub.status || 'active',
    provider: sub.provider || null,
    expiryTimeMillis: sub.expiryTimeMillis || null,
    autoRenewing: sub.autoRenewing || false,
    stripeCustomerId: sub.stripeCustomerId || null,
    stripeSubscriptionId: sub.stripeSubscriptionId || null,
    _raw: sub,
  };
};

export const getDashboardData = async () => {
  const [profileData, policiesData] = await Promise.all([
    accountApi.getProfile(),
    policyApi.list(Intl.DateTimeFormat().resolvedOptions().timeZone),
  ]);

  const subscription = profileData?.subscription || {};
  const account = profileData?.account || {};
  const policies = Array.isArray(policiesData) ? policiesData : (policiesData?.policies || []);
  const activePolicies = policies.filter(p => !p.isArchived && p.isActive);

  return {
    subscription: {
      plan: subscription.planCode || account.currentPlanCode || 'free',
      status: subscription.status || 'active',
    },
    policies,
    activePolicies,
    totalPolicies: activePolicies.length,
    _raw: { profileData, policiesData },
  };
};

export const getUserOverrideStats = async () => {
  try {
    const balance = await overrideApi.getBalance();
    return {
      overrides_left: (balance?.freeCreditsRemaining || 0) + (balance?.grantedCreditsRemaining || 0),
      monthly_limit: balance?.freeOverridesPerMonth || 0,
      overrides_used_total: balance?.totalOverridesUsed || 0,
      total_overrides_purchased: balance?.paidOverridesUsed || 0,
      _raw: balance,
    };
  } catch {
    return {
      overrides_left: 0,
      monthly_limit: 0,
      overrides_used_total: 0,
      total_overrides_purchased: 0,
    };
  }
};

export const updateUserSubscription = async () => {
  throw new Error('Use Stripe checkout flow instead. Navigate to /checkout?plan=pro');
};

export const purchaseOverrides = async () => {
  throw new Error('Use Stripe checkout flow instead. Navigate to /checkout?overrides=1');
};

export const addBlockedSite = async (_userId, siteData) => {
  const policy = await policyApi.create({
    type: 'website',
    targetKey: normalizeDomain(siteData.url || siteData.name),
    targetLabel: siteData.name || siteData.url,
    scope: 'account',
    deviceIds: [],
    dailyLimitMinutes: Math.round((siteData.time_limit || 60) / 60),
    warningThresholds: [0.75, 0.9],
    lockMode: 'until_reset',
    lockDurationMinutes: null,
    lockUntilTimeLocal: null,
    dailyResetTimeLocal: '00:00',
    overrideEnabled: true,
  });
  return { ...policy, message: 'Site added successfully' };
};

export const getBlockedSites = async () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const data = await policyApi.list(tz);
  const policies = Array.isArray(data) ? data : (data?.policies || []);
  return policies
    .filter(p => !p.isArchived)
    .map(mapPolicyToSite);
};

function mapPolicyToSite(policy) {
  const state = policy.state || policy.policyState || {};
  return {
    id: policy.policyId,
    policyId: policy.policyId,
    name: policy.targetLabel,
    url: policy.targetKey,
    time_limit: (policy.dailyLimitMinutes || 0) * 60,
    time_spent_today: (state.usageTodayMinutes || 0) * 60,
    time_remaining: Math.max(0, ((policy.dailyLimitMinutes || 0) - (state.usageTodayMinutes || 0)) * 60),
    is_active: policy.isActive,
    is_blocked: state.isExhaustedToday || false,
    total_time_spent: 0,
    access_count: state.sessionsTodayCount || 0,
    _raw: policy,
  };
}

export const updateBlockedSite = async (policyId, siteData) => {
  const updatePayload = {};
  if (siteData.time_limit !== undefined) {
    updatePayload.dailyLimitMinutes = Math.round(siteData.time_limit / 60);
  }
  if (siteData.name !== undefined) {
    updatePayload.targetLabel = siteData.name;
  }
  await policyApi.update(policyId, updatePayload);
};

export const removeBlockedSite = async (policyId) => {
  await policyApi.archive(policyId);
};

function normalizeDomain(url) {
  if (!url) return '';
  let domain = url.toLowerCase().trim();
  domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
  domain = domain.replace(/\/.*$/, '');
  return domain;
}

export const createSubscription = async () => {};
export const createUserProfile = async () => {};
export const updateUserBlockedSitesCount = async () => {};
export const updateUserStats = async () => {};
export const updateSiteStats = async () => {};

export const getUserRecentActivity = async () => {
  return [];
};

export const getTransactions = async () => {
  try {
    const data = await billingApi.listPurchases(50);
    return (data?.purchases || []).map(p => ({
      id: p.purchaseToken,
      type: p.productType === 'subscription' ? 'plan_purchase' : 'override_purchase',
      amount: p.priceAmountMicros ? p.priceAmountMicros / 1000000 : 0,
      status: p.status,
      provider: p.provider,
      productId: p.productId,
      created_at: p.createdAt,
      _raw: p,
    }));
  } catch {
    return [];
  }
};

export const checkAdminStatus = async () => {
  const user = auth.currentUser;
  if (!user) return false;
  const tokenResult = await user.getIdTokenResult(true);
  return tokenResult.claims.admin === true;
};

export const formatActivityTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const calculateSiteEfficiency = (site) => {
  if (!site?.time_limit || site.time_limit <= 0) return 100;
  const remaining = Math.max(0, site.time_remaining || 0);
  return Math.round((remaining / site.time_limit) * 100);
};

export const getAllUsers = async () => ({ users: [], lastDoc: null });
export const getUserDetailsWithActivity = async () => null;
export const getUserSites = async () => [];
export const adminGrantOverrides = async () => { throw new Error('Admin endpoints not available yet'); };
export const adminChangeUserPlan = async () => { throw new Error('Admin endpoints not available yet'); };
export const adminGetAllSites = async () => ({ sites: [], lastDoc: null });
export const adminSoftDeleteSite = async () => { throw new Error('Admin endpoints not available yet'); };
export const adminHardDeleteSite = async () => { throw new Error('Admin endpoints not available yet'); };
export const adminUpdateSite = async () => { throw new Error('Admin endpoints not available yet'); };
export const adminGetSystemStats = async () => ({});
export const adminSearchUsers = async () => [];
export const adminSearchSites = async () => ({ sites: [] });
export const adminGetAllTransactions = async () => ({ transactions: [], lastDoc: null });
export const adminSearchTransactions = async () => [];
export const adminGetTransactionDetails = async () => null;
export const adminGetCollection = async () => [];
export const adminUpdateDocument = async () => { throw new Error('Admin endpoints not available yet'); };
export const adminDeleteDocument = async () => { throw new Error('Admin endpoints not available yet'); };
export const adminGetDocumentIds = async () => [];
export const adminGetDocument = async () => null;
export const initializeAdminStats = async () => {};
export const recalculateAllStats = async () => {};
export const getAdminStats = async () => ({});
export const deleteAllUserSites = async () => {};
export const grantPlanBenefits = async () => {};
export const getUserStatistics = async () => ({});
export const getUserAnalytics = async () => ({});
export const getSiteAnalytics = async () => ({ sites: [] });
export const getOverrideAnalytics = async () => ({});
export const getUsageHistory = async () => ({ history: [] });
export const getTimeSpentAnalytics = async () => ({});
export const getUserByEmailOrId = async () => null;
export const getUserDetails = async () => null;
export const adminUpdateUserProfile = async () => { throw new Error('Admin endpoints not available yet'); };
export const addUserActivity = async () => {};
export const initializeUserProfile = async () => {};
export const createTransaction = async () => {};
export const updateSiteTimeTracking = async () => {};
export const getUserSitesTimeStatus = async () => [];
export const resetDailySiteTimes = async () => {};
export const grantOverrideBalance = async () => {};
export const refundOverride = async () => {};
