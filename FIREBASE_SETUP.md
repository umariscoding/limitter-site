# Firebase Setup Guide

This project has been migrated from Supabase to Firebase. Follow these steps to set up Firebase for your project.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication method
5. Click "Save"

## 3. Set up Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can update rules later)
4. Select a location for your database
5. Click "Done"

## 4. Get Firebase Configuration

1. Go to "Project settings" (gear icon in the left sidebar)
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Enter an app nickname
5. Click "Register app"
6. Copy the configuration object

## 5. Update Environment Variables

Replace the placeholder values in your `.env.local` file with your actual Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. Update Firebase Configuration in Code

Update the `firebaseConfig` object in `src/lib/firebase.js` with your actual values:

```javascript
const firebaseConfig = {
  apiKey: "your_actual_api_key_here",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_actual_project_id",
  storageBucket: "your_project_id.appspot.com",
  messagingSenderId: "your_actual_sender_id",
  appId: "your_actual_app_id"
};
```

## 7. Set up Firestore Security Rules

Go to "Firestore Database" > "Rules" and update the rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own blocked sites
    match /blocked_sites/{siteId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.user_id;
    }
    
    // Users can read and write their own subscriptions
    match /subscriptions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 8. Test the Setup

1. Run `npm run dev` to start your development server
2. Try creating a new user account
3. Check that the user profile is created in Firestore
4. Test adding blocked sites

## Key Differences from Supabase

- **Authentication**: Using Firebase Auth instead of Supabase Auth
- **Database**: Using Firestore instead of PostgreSQL
- **Real-time**: Using Firestore real-time listeners (can be added if needed)
- **Security**: Using Firestore security rules instead of RLS policies

## Troubleshooting

### Common Issues:

1. **Configuration errors**: Make sure all environment variables are correctly set
2. **Permission denied**: Check your Firestore security rules
3. **Auth issues**: Ensure Email/Password authentication is enabled
4. **Network errors**: Check your Firebase project configuration

### Error Messages:

- `Missing Firebase configuration`: Update your `.env.local` and `firebase.js` files
- `Permission denied`: Update your Firestore security rules
- `Auth domain not authorized`: Check your project settings

For more help, check the [Firebase Documentation](https://firebase.google.com/docs). 