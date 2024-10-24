// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2UbH0qp8pP-Vg9ZQDX7dv2U8i0p6W6QY",
  authDomain: "achiievo.firebaseapp.com",
  projectId: "achiievo",
  storageBucket: "achiievo.appspot.com",
  messagingSenderId: "76975807083",
  appId: "1:76975807083:web:c3885584197551c9f26f2e",
  measurementId: "G-E3DN0MQEJ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional)
const analytics = getAnalytics(app);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { auth , analytics , db };
