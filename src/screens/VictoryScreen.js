import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FullBodyCharacter from '../components/FullBodyCharacter';
import { createAttemptId, saveGameResult, updateStudentProgress } from '../services/firestore';
import { playSound } from '../utils/sound';
import {
  DIFFICULTY_META, DIFFICULTY_ORDER, QUESTIONS_PER_TOPIC,
} from '../constants/game';

function Confetti() {
  const colors = ['#fd79a8', '#fdcb6e', '#a29bfe', '#00cec9', '#55efc4'];
  return <>{Array.from({ length: 48 }).map((_, index) => (
    <div key={index} className="confetti-piece" style={{
      left: `${(index * 37) % 100}%`, background: colors[index % colors.length],
      animationDuration: `${2 + (index % 5) * 0.35}s`, animationDelay: `${(index % 8) * 0.1}s`,
    }} />
  ))}</>;
}

export default function VictoryScreen() {
  const nav = useNavigate();
  const {
    studentData, setStudentData, totalScore, completedTopics, resetGame,
    difficulty, setDifficulty,
  } = useApp();
  const savePromiseRef = useRef(null);
  const [working, setWorking] = useState(false);
  const correctCount = completedTopics.reduce((sum, topic) => sum + (topic.correctCount || 0), 0);
  const totalQuestions = completedTopics.length * QUESTIONS_PER_TOPIC;
  const accuracy = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const levelIndex = DIFFICULTY_ORDER.indexOf(difficulty);
  const nextDifficulty = levelIndex < DIFFICULTY_ORDER.length - 1
    ? DIFFICULTY_ORDER[levelIndex + 1] : null;
  const finishedHard = difficulty === 'hard';

  useEffect(() => {
    playSound('victory');
    if (studentData?.id && completedTopics.length >= 9 && !savePromiseRef.current) {
      savePromiseRef.current = saveGameResult({
        studentId: studentData.id, studentName: studentData.name,
        schoolId: studentData.schoolId, className: studentData.class,
        score: totalScore, correctCount, totalQuestions, completedTopics,
        attemptId: studentData.currentAttemptId, difficulty,
      }).catch(() => null);
    }
  }, []); // eslint-disable-line

  if (!studentData) return <Navigate to="/student/login" replace />;
  if (completedTopics.length < 9) return <Navigate to="/student/home" replace />;

  async function startJourney(targetDifficulty) {
    setWorking(true);
    if (savePromiseRef.current) await savePromiseRef.current;
    const nextAttemptId = createAttemptId();
    const unlockedDifficulty = nextDifficulty || studentData.unlockedDifficulty || difficulty;
    resetGame();
    setDifficulty(targetDifficulty);
    setStudentData(current => ({
      ...current, completedTopics: [], totalScore: 0, currentAttemptId: nextAttemptId,
      currentDifficulty: targetDifficulty, unlockedDifficulty,
    }));
    await updateStudentProgress(
      studentData.schoolId, studentData.id, [], 0, nextAttemptId,
      targetDifficulty, unlockedDifficulty
    ).catch(() => {});
    playSound('start');
    nav('/board');
  }

  return (
    <main className="result-page approved">
      <Confetti />
      <div className="result-glow" />
      <section className="result-card">
        <div className="result-copy">
          <span className="result-kicker">NÍVEL CONCLUÍDO!</span>
          <h1>Muito bem, {studentData.name}!</h1>
          <p>Você concluiu a jornada no nível {DIFFICULTY_META[difficulty].label} com {accuracy}% de aproveitamento.</p>
          <div className="result-message"><span>🚒</span><div>
            <b>Nível {DIFFICULTY_META[difficulty].label} finalizado!</b>
            <small>Todos os níveis estão disponíveis para você jogar quando quiser.</small>
          </div></div>
        </div>
        <div className="result-character">
          <div className="result-character-halo" />
          <FullBodyCharacter options={studentData.character} size={285}
            expression="happy" isFirefighter={finishedHard} />
        </div>
        <div className="result-stats">
          <div><span>✅</span><b>{correctCount}/{totalQuestions}</b><small>acertos</small></div>
          <div><span>📊</span><b>{accuracy}%</b><small>aproveitamento</small></div>
          <div><span>⭐</span><b>{totalScore}</b><small>pontos</small></div>
        </div>
        <div className="result-actions">
          {nextDifficulty && <button className="result-primary" disabled={working}
            onClick={() => startJourney(nextDifficulty)}>
            {working ? 'Preparando nível...' : `${DIFFICULTY_META[nextDifficulty].emoji} Jogar nível ${DIFFICULTY_META[nextDifficulty].label}`}
          </button>}
          <button className="result-primary" disabled={working} onClick={() => startJourney(difficulty)}>
            {working ? 'Salvando tentativa...' : '🔁 Jogar novamente'}
          </button>
          <button className="result-secondary" onClick={() => nav('/student/home')}>🏠 Voltar ao meu menu</button>
        </div>
      </section>
    </main>
  );
}
