import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import FullBodyCharacter from '../components/FullBodyCharacter';
import { createAttemptId, saveGameResult, updateStudentProgress } from '../services/firestore';
import { playSound } from '../utils/sound';
import { QUESTIONS_PER_TOPIC } from '../constants/game';

function Confetti() {
  const colors = ['#fd79a8', '#fdcb6e', '#a29bfe', '#00cec9', '#55efc4'];
  return (
    <>
      {Array.from({ length: 48 }).map((_, index) => (
        <div
          key={index}
          className="confetti-piece"
          style={{
            left: `${(index * 37) % 100}%`,
            background: colors[index % colors.length],
            animationDuration: `${2 + (index % 5) * 0.35}s`,
            animationDelay: `${(index % 8) * 0.1}s`,
          }}
        />
      ))}
    </>
  );
}

export default function VictoryScreen() {
  const nav = useNavigate();
  const { studentData, setStudentData, totalScore, completedTopics, resetGame } = useApp();
  const savePromiseRef = useRef(null);
  const [startingAgain, setStartingAgain] = useState(false);
  const correctCount = completedTopics.reduce((sum, topic) => sum + (topic.correctCount || 0), 0);
  const totalQuestions = completedTopics.length * QUESTIONS_PER_TOPIC;
  const accuracy = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const becameFirefighter = accuracy > 50;

  useEffect(() => {
    playSound(becameFirefighter ? 'victory' : 'start');
    if (studentData?.id && completedTopics.length >= 9) {
      if (!savePromiseRef.current) {
        savePromiseRef.current = saveGameResult({
          studentId: studentData.id,
          studentName: studentData.name,
          schoolId: studentData.schoolId,
          className: studentData.class,
          score: totalScore,
          correctCount,
          totalQuestions,
          completedTopics,
          attemptId: studentData.currentAttemptId,
        }).catch(() => null);
      }
    }
  }, []); // eslint-disable-line

  if (!studentData) return <Navigate to="/student/login" replace />;
  if (completedTopics.length < 9) return <Navigate to="/student/home" replace />;

  async function playAgain() {
    setStartingAgain(true);
    if (savePromiseRef.current) await savePromiseRef.current;
    const nextAttemptId = createAttemptId();
    resetGame();
    setStudentData(current => ({ ...current, completedTopics: [], totalScore: 0, currentAttemptId: nextAttemptId }));
    if (studentData?.id) {
      await updateStudentProgress(
        studentData.schoolId,
        studentData.id,
        [],
        0,
        nextAttemptId
      ).catch(() => {});
    }
    playSound('start');
    nav('/board');
  }

  return (
    <main className={`result-page ${becameFirefighter ? 'approved' : 'encourage'}`}>
      {becameFirefighter && <Confetti />}
      <div className="result-glow" />

      <section className="result-card">
        <div className="result-copy">
          <span className="result-kicker">
            {becameFirefighter ? 'MISSÃO CUMPRIDA!' : 'JORNADA COMPLETA!'}
          </span>
          <h1>
            {becameFirefighter
              ? `Muito bem, ${studentData.name}!`
              : `Você chegou até o fim, ${studentData.name}!`}
          </h1>
          <p>
            {becameFirefighter
              ? 'Você acertou mais da metade dos desafios e mostrou que sabe tomar boas decisões em uma emergência.'
              : 'Cada tentativa ajuda você a aprender. Que tal jogar mais uma vez, observar as dicas e tentar superar sua pontuação?'}
          </p>
          <div className="result-message">
            <span>{becameFirefighter ? '🚒' : '🌟'}</span>
            <div>
              <b>{becameFirefighter ? 'Novo Bombeiro Mirim!' : 'Continue treinando!'}</b>
              <small>
                {becameFirefighter
                  ? 'Seu personagem ganhou o uniforme de bombeiro.'
                  : 'Você já aprendeu bastante e pode ficar ainda melhor.'}
              </small>
            </div>
          </div>
        </div>

        <div className="result-character">
          <div className="result-character-halo" />
          <FullBodyCharacter
            options={studentData.character}
            size={285}
            expression={becameFirefighter ? 'happy' : 'idle'}
            isFirefighter={becameFirefighter}
          />
        </div>

        <div className="result-stats">
          <div><span>✅</span><b>{correctCount}/{totalQuestions}</b><small>acertos</small></div>
          <div><span>📊</span><b>{accuracy}%</b><small>aproveitamento</small></div>
          <div><span>⭐</span><b>{totalScore}</b><small>pontos</small></div>
        </div>

        <div className="result-actions">
          <button className="result-primary" onClick={playAgain} disabled={startingAgain}>
            {startingAgain ? 'Salvando tentativa...' : '🔁 Jogar novamente'}
          </button>
          <button className="result-secondary" onClick={() => nav('/student/home')}>🏠 Voltar ao meu menu</button>
        </div>
      </section>
    </main>
  );
}
