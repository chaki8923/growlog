import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebaseコンソールから取得した設定
const firebaseConfig = {
  apiKey: "AIzaSyDQfWvHtDFeDhyGWYpwIupJ3TurfVZj024",
  authDomain: "knot-99aac.firebaseapp.com",
  projectId: "knot-99aac",
  storageBucket: "knot-99aac.firebasestorage.app",
  messagingSenderId: "651637783655",
  appId: "1:651637783655:ios:16c4c87711346f838ca8c2"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Authentication
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

// Firebase app exportも追加
export { app };

export default app; 