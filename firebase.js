import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCenmWO0wBLTXVKL8dQfoLqj3ljA1U6sqw",
  authDomain: "online-secrect-table.firebaseapp.com",
  projectId: "online-secrect-table",
  storageBucket: "online-secrect-table.firebasestorage.app",
  messagingSenderId: "424540628087",
  appId: "1:424540628087:web:2cce82be667fd9a4f61272"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { app, auth, db, provider, signInWithPopup, signOut, onAuthStateChanged };
