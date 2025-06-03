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

## Step 5: Set Up Security Rules

Create basic security rules for your Firestore database:

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

## Step 6: Configure Environment Variables

Create a `.env.local` file in the root directory of your Next.js project with the following variables (replace with your own values):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

You can find these values in your Firebase project settings.

## Step 7: Install Firebase SDK

The Firebase SDK has already been installed in this project. If you need to install it in another project, run:

```
npm install firebase
```

## Database Structure

This project uses the following Firestore collections:

1. `users` - Stores user profile information
   - Document ID: Firebase Auth UID
   - Fields: name, email, createdAt, updatedAt

2. `subscriptions` - Stores subscription information
   - Document ID: Auto-generated
   - Fields: userId, plan, status, createdAt, updatedAt

## Troubleshooting

- **Authentication errors**: Make sure your Firebase project has Email/Password authentication enabled.
- **Firestore permission denied**: Check your security rules and ensure the user is authenticated.
- **Environment variables not working**: Ensure your `.env.local` file is in the correct location and restart your development server. 