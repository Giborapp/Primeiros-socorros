import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export async function register(name, email, password, role = 'player') {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await Promise.all([
    updateProfile(credential.user, { displayName: name }),
    setDoc(doc(db, 'users', credential.user.uid), {
      name, email, role, createdAt: new Date().toISOString(),
    }),
  ]);
  return credential.user;
}

export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}

export function onUserChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
