import {
  collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { TOTAL_GAME_QUESTIONS } from '../constants/game';

const legacyMigrationPromises = new Map();

export function createAttemptId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function studentsCollection(schoolId) {
  return collection(db, 'schools', schoolId, 'students');
}

function studentDocument(schoolId, studentId) {
  return doc(db, 'schools', schoolId, 'students', studentId);
}

async function migrateLegacyStudents(schoolId) {
  if (legacyMigrationPromises.has(schoolId)) {
    return legacyMigrationPromises.get(schoolId);
  }

  const migration = (async () => {
    const nestedStudents = await getDocs(studentsCollection(schoolId));
    if (!nestedStudents.empty) return;

    const legacyQuery = query(
      collection(db, 'students'),
      where('schoolId', '==', schoolId)
    );
    const legacyStudents = await getDocs(legacyQuery);

    await Promise.all(legacyStudents.docs.map(student =>
      setDoc(studentDocument(schoolId, student.id), student.data(), { merge: true })
    ));
  })();

  legacyMigrationPromises.set(schoolId, migration);

  try {
    await migration;
  } catch (error) {
    legacyMigrationPromises.delete(schoolId);
    throw error;
  }
}

// Schools
export async function createSchool(userId, data) {
  await setDoc(doc(db, 'schools', userId), { ...data, userId, createdAt: serverTimestamp() });
  return { id: userId, ...data };
}

export async function getSchoolByUserId(userId) {
  const snap = await getDoc(doc(db, 'schools', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Students
export async function createStudent(schoolId, { name, className }) {
  const currentAttemptId = createAttemptId();
  const ref = await addDoc(studentsCollection(schoolId), {
    name, class: className, schoolId,
    character: null, completedTopics: [], totalScore: 0,
    currentDifficulty: 'easy', unlockedDifficulty: 'easy',
    currentAttemptId,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, currentAttemptId };
}

export async function getStudents(schoolId, className) {
  await migrateLegacyStudents(schoolId);
  const q = query(
    studentsCollection(schoolId),
    where('class', '==', className)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function findStudent(schoolId, className, name) {
  const all = await getStudents(schoolId, className);
  return all.find(s => s.name.toLowerCase().trim() === name.toLowerCase().trim()) || null;
}

export async function updateStudentCharacter(schoolId, studentId, character) {
  await updateDoc(studentDocument(schoolId, studentId), { character });
}

export async function updateStudentProgress(
  schoolId,
  studentId,
  completedTopics,
  totalScore,
  currentAttemptId,
  difficulty,
  unlockedDifficulty
) {
  const data = { completedTopics, totalScore };
  if (currentAttemptId) data.currentAttemptId = currentAttemptId;
  if (difficulty) data.currentDifficulty = difficulty;
  if (unlockedDifficulty) data.unlockedDifficulty = unlockedDifficulty;
  await updateDoc(studentDocument(schoolId, studentId), data);
}

export async function getAllStudentsBySchool(schoolId) {
  await migrateLegacyStudents(schoolId);
  const snap = await getDocs(studentsCollection(schoolId));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Results and ranking
export async function saveGameResult({
  studentId, studentName, schoolId, className, score, correctCount,
  totalQuestions = TOTAL_GAME_QUESTIONS, completedTopics = [], attemptId, difficulty = 'easy',
}) {
  const data = {
    studentId, studentName, schoolId, class: className,
    score, correctCount, totalQuestions,
    accuracy: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
    completedTopics, attemptId: attemptId || null, difficulty,
    completedAt: serverTimestamp(),
  };
  if (attemptId) {
    await setDoc(doc(db, 'results', attemptId), data);
    return attemptId;
  }
  const ref = await addDoc(collection(db, 'results'), data);
  return ref.id;
}

export async function getClassRanking(schoolId, className) {
  const q = query(
    collection(db, 'results'),
    where('schoolId', '==', schoolId),
    where('class', '==', className)
  );
  const snap = await getDocs(q);
  const bestByStudent = {};
  snap.docs.forEach(d => {
    const result = { id: d.id, ...d.data() };
    const current = bestByStudent[result.studentId];
    if (!current || (result.score || 0) > (current.score || 0)) {
      bestByStudent[result.studentId] = result;
    }
  });
  return Object.values(bestByStudent)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20);
}

export async function getResultsBySchool(schoolId) {
  const q = query(
    collection(db, 'results'),
    where('schoolId', '==', schoolId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.completedAt?.seconds || 0;
      const bTime = b.completedAt?.seconds || 0;
      return bTime - aTime;
    });
}
