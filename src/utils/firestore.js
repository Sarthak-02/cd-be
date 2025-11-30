// firestore.js
import admin from "firebase-admin";
import dotenv from 'dotenv'

let app;

dotenv.config()

// Prevent initializing multiple times in dev mode (nodemon)
if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: admin.credential.cert(
      {
        project_id: process.env.GOOGLE_PROJECT_ID,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }
    ),
  });
} else {
  app = admin.app();
}

export const firebase = admin.firestore();

// Optional: set Firestore settings for better performance
firebase.settings({
  ignoreUndefinedProperties: true,
});

export default firebase;
