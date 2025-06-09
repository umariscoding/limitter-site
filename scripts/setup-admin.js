// Setup Admin User Script
// This script helps you grant admin access to a user by setting isAdmin: true
// Run this in your browser console or use it as a reference for Firebase CLI

// Method 1: Browser Console (when logged in as the user you want to make admin)
console.log(`
🛠️ ADMIN SETUP INSTRUCTIONS

To grant admin access to a user, you need to set isAdmin: true in their user document.

METHOD 1: Firebase Console (Recommended)
1. Go to Firebase Console > Firestore Database
2. Navigate to 'users' collection
3. Find your user document (search by email or user ID)
4. Click to edit the document
5. Add field: isAdmin (boolean) = true
6. Save the document
7. Refresh your application

METHOD 2: Browser Console (if you have the user ID)
Open browser console and run:

// Replace 'YOUR_USER_ID_HERE' with the actual user ID
const userId = 'YOUR_USER_ID_HERE';
const userRef = doc(db, 'users', userId);
updateDoc(userRef, { isAdmin: true })
  .then(() => console.log('✅ Admin access granted!'))
  .catch(err => console.error('❌ Error:', err));

METHOD 3: Find Your User ID
If you're currently logged in, run this to get your user ID:

console.log('Your User ID:', auth.currentUser?.uid);

Then use METHOD 1 with this user ID.

⚠️  SECURITY NOTE:
- Only set isAdmin: true through direct database access
- Admin panel cannot grant admin access (prevents privilege escalation)
- Keep track of who has admin access
- Use boolean true, not string "true"
`);

// Helper function to check current user's admin status
const checkMyAdminStatus = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('❌ No user logged in');
    return;
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('👤 Current User:', currentUser.email);
      console.log('🆔 User ID:', currentUser.uid);
      console.log('🛠️ Admin Status:', userData.isAdmin === true ? 'ADMIN' : 'Regular User');
      
      if (userData.isAdmin === true) {
        console.log('✅ You have admin access! Look for the 🛠️ Admin button in the navbar.');
      } else {
        console.log('ℹ️ To get admin access, use METHOD 1 above with your User ID:', currentUser.uid);
      }
    } else {
      console.log('❌ User profile not found');
    }
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
  }
};

// Export for use
if (typeof window !== 'undefined') {
  window.checkMyAdminStatus = checkMyAdminStatus;
  console.log('📋 Run checkMyAdminStatus() to check your current admin status');
}

export { checkMyAdminStatus }; 