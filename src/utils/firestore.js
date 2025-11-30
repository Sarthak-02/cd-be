// firestore.js
import admin from "firebase-admin";

let app;

// Prevent initializing multiple times in dev mode (nodemon)
if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} else {
  app = admin.app();
}

export const firestore = admin.firestore();

// Optional: set Firestore settings for better performance
firestore.settings({
  ignoreUndefinedProperties: true,
});

export default firestore;
