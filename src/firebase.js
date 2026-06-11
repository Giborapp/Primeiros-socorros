import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBUXKrahzBJ4X8M2K3mWgTVz0Vv7bf6KUA",
  authDomain: "primeirossocorroscwb.firebaseapp.com",
  projectId: "primeirossocorroscwb",
  storageBucket: "primeirossocorroscwb.firebasestorage.app",
  messagingSenderId: "717459519943",
  appId: "1:717459519943:web:d541570e44c31682ee01e2",
  measurementId: "G-GNPRKJ708E"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
