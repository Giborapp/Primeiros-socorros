import React, { createContext, useContext, useState, useEffect } from 'react';
import { onUserChange } from '../services/auth';
import { getSchoolByUserId } from '../services/firestore';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = carregando
  const [schoolData, setSchoolData] = useState(null);
  const [studentData, setStudentData] = useState(null);

  // Progresso do jogo atual
  const [completedTopics, setCompletedTopics] = useState([]); // [{topicIndex, score, correctCount, wrongIds}]
  const [totalScore, setTotalScore] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [timedMode, setTimedMode] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const unsub = onUserChange(async (firebaseUser) => {
      setUser(firebaseUser || null);
      if (firebaseUser) {
        try {
          const school = await getSchoolByUserId(firebaseUser.uid);
          setSchoolData(school);
        } catch {
          setSchoolData(null);
        }
      } else {
        setSchoolData(null);
        setStudentData(null);
        setCompletedTopics([]);
        setTotalScore(0);
        setDifficulty('easy');
      }
    });
    return unsub;
  }, []);

  function addCompletedTopic(topicIndex, score, correctCount, wrongIds = []) {
    const updated = completedTopics.filter(t => t.topicIndex !== topicIndex);
    updated.push({ topicIndex, score, correctCount, wrongIds });
    setCompletedTopics(updated);
    const newTotal = updated.reduce((sum, t) => sum + t.score, 0);
    setTotalScore(newTotal);
    return { updatedTopics: updated, newTotal };
  }

  function resetGame() {
    setCompletedTopics([]);
    setTotalScore(0);
  }

  function loadGame(topics, score) {
    setCompletedTopics(topics || []);
    setTotalScore(score || 0);
  }

  return (
    <AppContext.Provider value={{
      user, schoolData, setSchoolData,
      studentData, setStudentData,
      completedTopics, totalScore,
      addCompletedTopic, resetGame, loadGame,
      difficulty, setDifficulty,
      timedMode, setTimedMode,
      isTeacher, setIsTeacher,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
