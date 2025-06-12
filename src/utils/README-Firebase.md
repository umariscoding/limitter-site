# Firebase Setup for Limiter

This document provides instructions on how to set up Firebase for the Limiter project.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the steps to create a new project
3. Give your project a name (e.g., "Limiter")
4. Enable Google Analytics if desired (optional)
5. Click "Create project"

## Step 2: Add a Web App to Your Firebase Project

1. On the Firebase project dashboard, click the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "Limiter Web")
3. Check the box for "Also set up Firebase Hosting" if you plan to use it
4. Click "Register app"
5. Firebase will provide your app's configuration object - save this information for later

## Step 3: Set Up Authentication

1. In the Firebase console, navigate to "Authentication"
2. Click "Get started"
3. Enable the "Email/Password" sign-in method
4. (Optional) Configure other sign-in methods as needed

## Step 4: Set Up Firestore Database

1. In the Firebase console, navigate to "Firestore Database"
2. Click "Create database"
3. Start in production mode or test mode as needed
4. Choose a location for your database
5. Click "Enable"

## Step 5: Set Up Realtime Database

1. In the Firebase console, navigate to "Realtime Database"
2. Click "Create Database"
3. Choose a location for your database
4. Start in locked mode
5. Click "Enable"

## Step 6: Set Up Security Rules

Create basic security rules for your Firestore database in `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Subscriptions can be read by the user they belong to
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      // Only allow creation with the user's ID
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      // Only allow updates by the user, and don't allow changing the userId
      allow update: if request.auth != null && 
                      resource.data.userId == request.auth.uid &&
                      request.resource.data.userId == resource.data.userId;
    }
  }
}
```

Create security rules for your Realtime Database in `database.rules.json`:

```json
{
  "rules": {
    "blocked_sites": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

## Step 7: Configure Environment Variables

Create a `.env.local` file in the root directory of your Next.js project with the following variables (replace with your own values):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your-database-url
```

You can find these values in your Firebase project settings.

## Step 8: Install Firebase SDK

The Firebase SDK has already been installed in this project. If you need to install it in another project, run:

```
npm install firebase
```

## Database Structure

This project uses the following collections:

1. `users` (Firestore) - Stores user profile information
   - Document ID: Firebase Auth UID
   - Fields: name, email, createdAt, updatedAt

2. `blocked_sites` (Realtime Database) - Stores blocked site information
   - Path: /blocked_sites/{userId}/{siteId}
   - Fields:
     - user_id: string
     - url: string
     - name: string
     - time_limit: number
     - time_remaining: number
     - time_spent_today: number
     - last_reset_date: string
     - is_blocked: boolean
     - is_active: boolean
     - blocked_until: string | null
     - schedule: string | null
     - daily_usage: object
     - total_time_spent: number
     - access_count: number
     - last_accessed: string | null
     - override_active: boolean
     - override_initiated_by: string | null
     - override_initiated_at: string | null
     - created_at: string
     - updated_at: string

Note: All blocked sites data is stored in the Realtime Database for better real-time synchronization and performance, while user profiles and other data remain in Firestore. 