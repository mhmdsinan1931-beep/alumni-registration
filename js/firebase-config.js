// =====================================================
//  FIREBASE CONFIGURATION
//  Project: alumni-registration-2971f
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyCxNgfuWZfZT0zXNxMfruxT2o3EtAMCckg",
  authDomain: "alumni-registration-2971f.firebaseapp.com",
  projectId: "alumni-registration-2971f",
  storageBucket: "alumni-registration-2971f.firebasestorage.app",
  messagingSenderId: "103367097986",
  appId: "1:103367097986:web:5589a8afb09a1104ee3e9b",
  measurementId: "G-RWTX0FY39Y"
};

// Initialize Firebase (compat SDK — works with CDN script tags in HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
