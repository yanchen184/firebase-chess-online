import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARLxyx3ZdO9R0FOekKhsh_y9J2Zc3-Iqc",
  authDomain: "choicelight-99618.firebaseapp.com",
  databaseURL: "https://choicelight-99618-default-rtdb.firebaseio.com",
  projectId: "choicelight-99618",
  storageBucket: "choicelight-99618.appspot.com",
  messagingSenderId: "978242494736",
  appId: "1:978242494736:web:71fde3873636b993358595",
  measurementId: "G-WGWZ8LMS9P",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;