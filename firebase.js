// Firebase configuration for Money-Saving Apps
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, addDoc,
  query, orderBy, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAaAGkzGNAUBJbO3gjAOGidBWRV9EiOl7A",
  authDomain: "money-saving-23a91.firebaseapp.com",
  projectId: "money-saving-23a91",
  storageBucket: "money-saving-23a91.firebasestorage.app",
  messagingSenderId: "276618074705",
  appId: "1:276618074705:web:f5d5c10d1dcd0106293670"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export {
  auth, db, provider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut,
  doc, getDoc, setDoc, collection, addDoc,
  query, orderBy, getDocs, serverTimestamp
};
