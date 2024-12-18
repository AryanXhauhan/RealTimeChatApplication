import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY, // Make sure VITE_API_KEY is set in your .env file
  authDomain: "react-chat-559dc.firebaseapp.com",
  projectId: "react-chat-559dc",
  storageBucket: "react-chat-559dc.appspot.com", // Corrected storageBucket URL
  messagingSenderId: "239696863996",
  appId: "1:239696863996:web:32b843f4883cb6dd86ad79",
};

const app = initializeApp(firebaseConfig);

// Ensure you pass the app instance to getAuth and getFirestore
export const auth = getAuth(app);
export const db = getFirestore(app);
