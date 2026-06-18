import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import FullBodyCharacter from '../components/FullBodyCharacter';
import { playSound } from '../utils/sound';
import { DIFFICULTY_META, DIFFICULTY_ORDER } from '../constants/game';
import { createAttemptId, updateStudentProgress } from '../services/firestore';

export default function StudentHomeScreen() {
  const nav = useNavigate();
  const {
    studentData, setStudentData, completedTopics, totalScore, resetGame,
    difficulty, setDifficulty, timedMode, setTimedMode,
  } = useApp();

  if (!studentData) return <Navigate to="/student/login" replace />;
  if (!studentData.character) return <Navigate to="/character" replace />;

  const completed = completedTopics.length;
  const progress = Math.round((completed / 9) * 100);
  const correct = completedTopics.reduce((sum, item) => sum + (item.correctCount || 0), 0);

  function go(path) {
    playSound('click');
    nav(path);
  }

  async function chooseDifficulty(nextDifficulty) {
    if (nextDifficulty === difficulty) return;
    const nextAttemptId = createAttemptId();
    resetGame();
    setDifficulty(nextDifficulty);
    setStudentData(current => ({
      ...current, completedTopics: [], totalScore: 0,
      currentAttemptId: nextAttemptId, currentDifficulty: nextDifficulty,
      unlockedDifficulty: 'hard',
    }));
    await updateStudentProgress(
      studentData.schoolId, studentData.id, [], 0, nextAttemptId, nextDifficulty, 'hard'
    ).catch(() => {});
    playSound('click');
  }

  return (
    <main className="student-home">
      <div className="student-home-shape shape-one" />
      <div className="student-home-shape shape-two" />

      <header className="student-home-header web-container">
        <div>
          <span>ÁREA DO ALUNO</span>
          <h1>Olá, {studentData.name}!</h1>
          <p>Pronto para aprender a cuidar de você e de outras pessoas?</p>
        </div>
        <button className="btn btn-ghost" onClick={() => nav('/student/login')}>
          Trocar aluno
        </button>
      </header>

      <div className="student-home-grid web-container">
        <motion.section
          className="student-hero-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="student-hero-copy">
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
              {DIFFICULTY_ORDER.map(level => <button key={level} type="button"
                onClick={() => chooseDifficulty(level)} style={{
                  padding:'8px 12px', borderRadius:999, cursor:'pointer', fontWeight:800,
                  color:'#fff', border: level === difficulty ? '2px solid #fdcb6e' : '1px solid rgba(255,255,255,.25)',
                  background: level === difficulty ? 'rgba(253,203,110,.24)' : 'rgba(255,255,255,.1)',
                }}>
                {DIFFICULTY_META[level].emoji} {DIFFICULTY_META[level].label}
              </button>)}
            </div>
            {difficulty === 'hard' && <button type="button" onClick={() => setTimedMode(value => !value)}
              style={{ display:'block', marginBottom:14, padding:'8px 12px', borderRadius:12,
                border:'1px solid rgba(255,255,255,.25)', background:'rgba(0,0,0,.16)',
                color:'#fff', cursor:'pointer', fontWeight:700 }}>
              ⏱️ Tempo por pergunta: {timedMode ? '30 segundos' : 'desligado'}
            </button>}
            <span className="student-kicker">{completed === 9 ? 'JORNADA COMPLETA' : 'SUA PRÓXIMA MISSÃO'}</span>
            <h2>{completed === 9 ? 'Você completou todos os desafios!' : 'Jornada dos Primeiros Socorros'}</h2>
            <p>
              {completed === 0
                ? `${DIFFICULTY_META[difficulty].description} Complete os nove lugares no seu ritmo.`
                : completed === 9
                  ? 'Veja seu resultado ou jogue novamente para melhorar sua pontuação.'
                  : `Você já concluiu ${completed} de 9 fases. Continue assim!`}
            </p>
            <button className="student-start-button" onClick={() => go(completed === 9 ? '/victory' : '/board')}>
              {completed === 0 ? 'Começar o jogo' : completed === 9 ? 'Ver meu resultado' : 'Continuar aventura'}
              <b>→</b>
            </button>
          </div>

          <div className="student-hero-character">
            <div className="student-character-glow" />
            <FullBodyCharacter options={studentData.character} size={280} animate />
          </div>
        </motion.section>

        <section className="student-progress-card">
          <div className="student-progress-heading">
            <div>
              <span>MEU PROGRESSO</span>
              <strong>{progress}%</strong>
            </div>
            <div className="student-progress-ring" style={{ '--progress': `${progress * 3.6}deg` }}>
              <b>{completed}/9</b>
            </div>
          </div>
          <div className="student-progress-track"><i style={{ width: `${progress}%` }} /></div>
          <div className="student-stats">
            <div><span>⭐</span><b>{totalScore}</b><small>pontos</small></div>
            <div><span>✅</span><b>{correct}</b><small>acertos</small></div>
            <div><span>🎒</span><b>{studentData.class}</b><small>turma</small></div>
          </div>
        </section>

        <section className="student-action-area">
          <div className="student-action-heading">
            <div>
              <span>ESCOLHA SEU CAMINHO</span>
              <h2>O que você quer fazer agora?</h2>
            </div>
            <p>Personalize seu herói, acompanhe a turma ou continue sua aventura.</p>
          </div>

          <div className="student-action-grid">
            <motion.button
              className="student-action-card character-card"
              whileHover={{ y: -5 }}
              onClick={() => go('/character')}
            >
              <span className="student-action-icon">🎨</span>
              <small>PERSONALIZAR</small>
              <b>Meu personagem</b>
              <p>Escolha roupas, cabelos, rostos e acessórios.</p>
              <i>Editar personagem <strong>→</strong></i>
            </motion.button>

            <motion.button
              className="student-action-card map-card"
              whileHover={{ y: -5 }}
              onClick={() => go('/board')}
            >
              <span className="student-action-icon">🗺️</span>
              <small>CONTINUAR JOGANDO</small>
              <b>Mapa das fases</b>
              <p>Visite os lugares e complete as nove missões.</p>
              <i>Abrir mapa <strong>→</strong></i>
            </motion.button>

            <motion.button
              className="student-action-card ranking-card"
              whileHover={{ y: -5 }}
              onClick={() => go('/ranking')}
            >
              <span className="student-action-icon">🏅</span>
              <small>MINHA TURMA</small>
              <b>Ranking da turma</b>
              <p>Veja sua pontuação e acompanhe seus colegas.</p>
              <i>Ver ranking <strong>→</strong></i>
            </motion.button>
          </div>
        </section>
      </div>
    </main>
  );
}
