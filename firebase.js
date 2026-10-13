
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCcBcAL-KAol1t5yBfRYYx3pqZDXQbp0Lw",
    authDomain: "habittracker-57720.firebaseapp.com",
    projectId: "habittracker-57720",
    storageBucket: "habittracker-57720.firebasestorage.app",
    messagingSenderId: "965545200295",
    appId: "1:965545200295:web:be48b3c1957f51e206e982",
    measurementId: "G-M785VCV0SQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
