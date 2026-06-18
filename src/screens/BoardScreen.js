import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import CharacterAvatar from '../components/CharacterAvatar';
import { topics } from '../data/questions';
import { playSound } from '../utils/sound';
import { DIFFICULTY_META } from '../constants/game';

const SCENES = [
  { className: 'kitchen', icon: '🍳', props: ['🔥', '🥘', '🔪'], place: 'Cozinha' },
  { className: 'bathroom', icon: '🚿', props: ['🛁', '🧼', '💧'], place: 'Banheiro' },
  { className: 'electric', icon: '🔌', props: ['💡', '⚡', '🔋'], place: 'Quarto elétrico' },
  { className: 'living-room', icon: '🛋️', props: ['📚', '🪑', '🧸'], place: 'Sala de casa' },
  { className: 'pool', icon: '🏊', props: ['🛟', '💦', '☀️'], place: 'Piscina' },
  { className: 'rescue', icon: '🚑', props: ['📞', '🚨', '🏥'], place: 'Central de ajuda' },
  { className: 'first-aid', icon: '🩹', props: ['🧰', '🧼', '❤️'], place: 'Posto de cuidados' },
  { className: 'garden', icon: '🌿', props: ['🦂', '🐍', '🕷️'], place: 'Jardim' },
  { className: 'emergency', icon: '🚒', props: ['🧠', '🆘', '⭐'], place: 'Base dos heróis' },
];

function SceneCard({ topic, index, state, score, onClick }) {
  const scene = SCENES[index];
  const locked = state === 'locked';
  const done = state === 'done';
  const current = state === 'current';

  return (
    <motion.article
      className={`map-scene ${scene.className} ${state}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <div className="map-scene-sky">
        <span className="map-scene-main-icon">{locked ? '🔒' : scene.icon}</span>
        <span className="map-prop prop-one">{scene.props[0]}</span>
        <span className="map-prop prop-two">{scene.props[1]}</span>
        <span className="map-prop prop-three">{scene.props[2]}</span>
        <div className="map-scene-floor" />
      </div>

      <div className="map-scene-content">
        <div className="map-level-line">
          <span>FASE {index + 1}</span>
          {done && <b>✓ Concluída</b>}
          {current && <b>Próxima missão</b>}
          {locked && <b>Bloqueada</b>}
        </div>
        <h2>{topic.name}</h2>
        <p>{scene.place}</p>
        <button disabled={locked || done} onClick={onClick}>
          {done ? `⭐ ${score || 0} pontos` : locked ? 'Complete a fase anterior' : 'Entrar neste lugar →'}
        </button>
      </div>
    </motion.article>
  );
}

export default function BoardScreen() {
  const nav = useNavigate();
  const { studentData, completedTopics, totalScore, difficulty } = useApp();
  if (!studentData) return <Navigate to="/student/login" replace />;

  const doneSet = new Set(completedTopics.map(item => item.topicIndex));
  if (doneSet.size >= topics.length) return <Navigate to="/victory" replace />;

  const nextUnlocked = topics.findIndex((_, index) => !doneSet.has(index));
  const progress = Math.round((doneSet.size / topics.length) * 100);

  function stateFor(index) {
    if (doneSet.has(index)) return 'done';
    if (index === nextUnlocked) return 'current';
    return 'locked';
  }

  function openTopic(index) {
    if (stateFor(index) !== 'current') return;
    playSound('topic');
    nav(`/play/${index}`);
  }

  return (
    <main className="adventure-map-page">
      <header className="adventure-header web-container">
        <button className="map-back-button" onClick={() => nav('/student/home')}>← Meu menu</button>
        <div className="map-student">
          <CharacterAvatar options={studentData.character} size={58} />
          <div><b>{studentData.name}</b><span>Turma {studentData.class}</span></div>
        </div>
        <div className="map-score"><b>⭐ {totalScore}</b><span>{doneSet.size}/9 fases</span></div>
      </header>

      <section className="map-intro web-container">
        <div>
          <span>{DIFFICULTY_META[difficulty].emoji} NÍVEL {DIFFICULTY_META[difficulty].label.toUpperCase()}</span>
          <h1>Explore os lugares e aprenda a ficar seguro</h1>
          <p>Cada fase acontece em um ambiente diferente. Complete uma missão para abrir a próxima.</p>
        </div>
        <div className="map-progress">
          <div><b>{progress}%</b><span>da jornada</span></div>
          <i><em style={{ width: `${progress}%` }} /></i>
        </div>
      </section>

      <section className="adventure-map web-container">
        <div className="map-path-line" />
        {topics.map((topic, index) => {
          const result = completedTopics.find(item => item.topicIndex === index);
          return (
            <SceneCard
              key={topic.id}
              topic={topic}
              index={index}
              state={stateFor(index)}
              score={result?.score}
              onClick={() => openTopic(index)}
            />
          );
        })}
      </section>
    </main>
  );
}
