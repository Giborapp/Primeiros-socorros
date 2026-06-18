import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { updateStudentProgress } from '../services/firestore';
import { topics, getTopicQuestions } from '../data/questions';
import { playSound } from '../utils/sound';
import FullBodyCharacter from '../components/FullBodyCharacter';
import { DIFFICULTY_META, QUESTIONS_PER_TOPIC } from '../constants/game';

const OPTION_COLORS = ['#FF6B6B','#4ECDC4','#FFE66D','#A8E6CF'];
const OPTION_TEXT   = ['#7B0000','#004D47','#5C4400','#1B4D35'];
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function Confetti() {
  const colors = ['#fd79a8','#fdcb6e','#a29bfe','#00cec9','#ff6b6b','#55efc4'];
  return (
    <>
      {[...Array(30)].map((_,i) => (
        <div key={i} className="confetti-piece" style={{
          left:`${Math.random()*100}%`,
          background: colors[i % colors.length],
          width:`${6+Math.random()*8}px`, height:`${6+Math.random()*8}px`,
          animationDuration:`${1.5+Math.random()*2}s`,
          animationDelay:`${Math.random()*0.4}s`,
          borderRadius: Math.random()>0.5 ? '50%' : '2px',
        }} />
      ))}
    </>
  );
}

export default function QuestionScreen() {
  const nav = useNavigate();
  const { topicIdx: topicIdxStr } = useParams();
  const topicIdx = parseInt(topicIdxStr, 10);
  const { studentData, addCompletedTopic, difficulty, timedMode } = useApp();

  const topic = topics[topicIdx];

  const [questions]  = useState(() => shuffle(getTopicQuestions(topicIdx, difficulty)).slice(0, QUESTIONS_PER_TOPIC));
  const [current, setCurrent]     = useState(0);
  const [options, setOptions]     = useState(() => shuffle(questions[0].options));
  const [selected, setSelected]   = useState(null);
  const [answered, setAnswered]   = useState(false);
  const [score, setScore]         = useState(0);
  const [correct, setCorrect]     = useState(0);
  const [wrongIds, setWrongIds]   = useState([]);
  const [expression, setExpression] = useState('thinking');
  const [showConfetti, setShowConfetti] = useState(false);
  const [topicDone, setTopicDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const q = questions[current];

  useEffect(() => {
    if (difficulty !== 'hard' || !timedMode || answered || topicDone) return undefined;
    if (timeLeft <= 0) {
      playSound('wrong');
      setSelected('__time__');
      setAnswered(true);
      setWrongIds(ids => [...ids, q.id]);
      setExpression('sad');
      return undefined;
    }
    const timer = setTimeout(() => setTimeLeft(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [answered, difficulty, q.id, timeLeft, timedMode, topicDone]);

  function handleAnswer(opt) {
    if (answered) return;
    const isRight = opt === q.correctAnswer;
    setSelected(opt);
    setAnswered(true);

    if (isRight) {
      playSound('correct');
      setScore(s => s + 100);
      setCorrect(c => c + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
      setExpression('happy');
    } else {
      playSound('wrong');
      setWrongIds(ids => [...ids, q.id]);
      setExpression('sad');
    }
  }

  const nextQ = useCallback(() => {
    if (current < QUESTIONS_PER_TOPIC - 1) {
      const next = current + 1;
      setCurrent(next);
      setOptions(shuffle(questions[next].options));
      setSelected(null);
      setAnswered(false);
      setExpression('thinking');
      setTimeLeft(30);
    } else {
      setTopicDone(true);
    }
  }, [current, questions]);

  useEffect(() => {
    if (!topicDone) return;
    playSound('victory');
    const { updatedTopics, newTotal } = addCompletedTopic(topicIdx, score, correct, wrongIds);
    if (studentData?.id) {
      updateStudentProgress(
        studentData.schoolId,
        studentData.id,
        updatedTopics,
        newTotal,
        undefined,
        difficulty
      ).catch(() => {});
    }
  }, [topicDone]); // eslint-disable-line

  /* ── Topic complete screen ── */
  if (topicDone) {
    const stars = correct === 3 ? 3 : correct === 2 ? 2 : 1;
    return (
      <div style={{
        minHeight:'100vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:24, textAlign:'center',
        background:`linear-gradient(135deg,${topic.color}44,#0f0c29 60%)`,
      }}>
        <Confetti />
        <motion.div
          initial={{ scale:0.5, opacity:0 }}
          animate={{ scale:1, opacity:1 }}
          transition={{ type:'spring', stiffness:220, damping:18 }}
          style={{ position:'relative', zIndex:1 }}
        >
          {/* Character celebrating */}
          <motion.div
            animate={{ y:[0,-12,0] }}
            transition={{ duration:0.8, repeat:3, ease:'easeInOut' }}
            style={{ display:'flex', justifyContent:'center', marginBottom:16 }}
          >
            <FullBodyCharacter
              options={studentData?.character}
              size={130}
              expression="happy"
              bust
            />
          </motion.div>

          <div style={{ fontSize:'3rem', marginBottom:8 }}>{topic.emoji}</div>
          <h2 style={{ fontSize:'2rem', fontWeight:900, marginBottom:4 }}>Fase Completa!</h2>
          <div style={{ fontSize:'1.5rem', marginBottom:20 }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3-stars)}
          </div>

          <div style={{
            background:'rgba(255,255,255,0.12)',
            backdropFilter:'blur(12px)',
            borderRadius:24, padding:'20px 36px',
            margin:'0 auto 24px',
            display:'inline-block',
            border:'1px solid rgba(255,255,255,0.2)',
          }}>
            <div style={{ fontSize:'2.8rem', fontWeight:900, color:'#fdcb6e' }}>+{score}</div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.9rem' }}>pontos</div>
            <div style={{ marginTop:10, fontSize:'1.1rem', fontWeight:800 }}>
              {correct}/{QUESTIONS_PER_TOPIC} acertos ✅
            </div>
          </div>

          <motion.button
            className="btn btn-primary"
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.96 }}
            style={{ fontSize:'1.1rem', padding:'16px 38px' }}
            onClick={() => { playSound('click'); nav('/board'); }}
          >
            Voltar ao Tabuleiro 🗺️
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const isRight = selected === q.correctAnswer;

  return (
    <div className="question-web-page" style={{
      minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
      padding:'16px 14px 32px',
      background:`linear-gradient(155deg,${topic.color}28 0%,#0f0c29 50%,#1a1650 100%)`,
    }}>
      {showConfetti && <Confetti />}

      {/* ── Header ── */}
      <div className="question-web-header" style={{ width:'100%', maxWidth:1100, marginBottom:16, zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <button
            onClick={() => nav('/board')}
            style={{
              background:'rgba(255,255,255,0.12)', border:'none', color:'#fff',
              borderRadius:'50%', width:38, height:38, cursor:'pointer',
              fontSize:'1.1rem', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >←</button>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontSize:'0.82rem', fontWeight:800, color:topic.color }}>
                {topic.emoji} {topic.name} · {DIFFICULTY_META[difficulty].label}
              </span>
              <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.5)' }}>
                {difficulty === 'hard' && timedMode ? `⏱️ ${timeLeft}s · ` : ''}{current+1}/{QUESTIONS_PER_TOPIC}
              </span>
            </div>
            <div className="q-progress-bar">
              <motion.div
                className="q-progress-fill"
                initial={false}
                animate={{ width:`${((current+1)/QUESTIONS_PER_TOPIC)*100}%` }}
                transition={{ duration:0.4 }}
                style={{ background:`linear-gradient(90deg,${topic.color},${topic.darkColor})` }}
              />
            </div>
          </div>
          <div style={{ fontSize:'1rem', fontWeight:900, color:'#fdcb6e', minWidth:56, textAlign:'right' }}>
            ⭐ {score}
          </div>
        </div>
      </div>

      {/* ── Character portrait + question ── */}
      <div className="question-web-content" style={{ width:'100%', maxWidth:1100, zIndex:1 }}>
        <motion.div className="question-hero-column"
          layout
          style={{
            display:'flex', flexDirection:'column', alignItems:'center',
            marginBottom:16, gap:12,
          }}
        >
          {/* Character bust in a glowing frame */}
          <motion.div
            animate={answered ? (isRight
              ? { scale:[1,1.15,1], rotate:[0,4,-4,0] }
              : { x:[0,-8,8,-8,8,0] }
            ) : {}}
            transition={{ duration:0.5 }}
            style={{
              width:108, height:108, borderRadius:'50%',
              background:`radial-gradient(circle at 40% 40%, ${topic.color}55, ${topic.darkColor}aa)`,
              border:`3px solid ${topic.color}88`,
              display:'flex', alignItems:'center', justifyContent:'center',
              overflow:'hidden',
              boxShadow:`0 0 28px ${topic.color}44, 0 4px 16px rgba(0,0,0,0.4)`,
            }}
          >
            <FullBodyCharacter
              options={studentData?.character}
              size={94}
              expression={expression}
              bust
            />
          </motion.div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity:0, y:14 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-14 }}
              transition={{ duration:0.25 }}
              style={{
                width:'100%',
                background:'rgba(255,255,255,0.1)',
                backdropFilter:'blur(20px)',
                border:`1.5px solid ${topic.color}44`,
                borderRadius:24,
                padding:'22px 20px',
                textAlign:'center',
              }}
            >
              <p style={{
                fontSize:'1.22rem', fontWeight:800, lineHeight:1.45,
                color:'#fff', textShadow:'0 1px 4px rgba(0,0,0,0.4)',
              }}>
                {q.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── Options ── */}
        <div className="question-options-column" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr',
          gap:10, marginBottom:14,
        }}>
          {options.map((opt, i) => {
            let borderColor = 'transparent';
            let opacity = 1;
            let transform = '';
            if (answered) {
              if (opt === q.correctAnswer) borderColor = '#00b894';
              else if (opt === selected)   borderColor = '#d63031';
              else                          opacity = 0.5;
            }

            return (
              <motion.button
                key={opt}
                whileHover={!answered ? { scale:1.03, y:-2 } : {}}
                whileTap={!answered   ? { scale:0.96 } : {}}
                initial={{ opacity:0, y:16 }}
                animate={{ opacity, y:0 }}
                transition={{ delay: i * 0.07, duration:0.25 }}
                onClick={() => handleAnswer(opt)}
                disabled={answered}
                style={{
                  background: OPTION_COLORS[i % 4],
                  color: OPTION_TEXT[i % 4],
                  border: `3.5px solid ${borderColor}`,
                  borderRadius:18,
                  padding:'14px 10px', minHeight:68,
                  fontFamily:'inherit', fontSize:'0.9rem', fontWeight:800,
                  cursor: answered ? 'not-allowed' : 'pointer',
                  lineHeight:1.3, textAlign:'center',
                  boxShadow: answered && opt === q.correctAnswer
                    ? '0 0 0 4px rgba(0,184,148,0.35)'
                    : answered && opt === selected && !isRight
                    ? '0 0 0 4px rgba(214,48,49,0.35)'
                    : '0 4px 12px rgba(0,0,0,0.2)',
                  transition:'box-shadow 0.2s, border-color 0.2s, opacity 0.2s',
                }}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        {/* ── Feedback + Next button ── */}
        <div className="question-feedback-column"><AnimatePresence>
          {answered && (
            <motion.div
              initial={{ opacity:0, y:16, scale:0.95 }}
              animate={{ opacity:1, y:0,  scale:1 }}
              exit={{    opacity:0, y:-8,  scale:0.95 }}
              transition={{ duration:0.3 }}
            >
              {isRight ? (
                <div style={{
                  background:'rgba(0,184,148,0.2)',
                  border:'2px solid #00b894',
                  borderRadius:18, padding:'14px 20px',
                  textAlign:'center', marginBottom:12,
                }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:4 }}>🎉</div>
                  <div style={{ fontWeight:900, fontSize:'1.05rem', color:'#55efc4' }}>
                    Correto! +100 pontos
                  </div>
                </div>
              ) : (
                <div style={{
                  background:'rgba(214,48,49,0.15)',
                  border:'2px solid #d63031',
                  borderRadius:18, padding:'14px 20px',
                  textAlign:'center', marginBottom:12,
                }}>
                  <div style={{ fontSize:'1.3rem', marginBottom:4 }}>😢</div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', color:'rgba(255,255,255,0.75)', marginBottom:6 }}>
                    Não foi dessa vez...
                  </div>
                  <div style={{
                    background:'rgba(0,184,148,0.2)', border:'1.5px solid #00b894',
                    borderRadius:12, padding:'8px 14px', display:'inline-block',
                  }}>
                    <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.6)' }}>Resposta certa: </span>
                    <span style={{ fontWeight:900, fontSize:'0.95rem', color:'#55efc4' }}>
                      {q.correctAnswer}
                    </span>
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                className="btn btn-primary btn-full"
                style={{ fontSize:'1.05rem', padding:'15px' }}
                onClick={() => { playSound('click'); nextQ(); }}
              >
                {current < QUESTIONS_PER_TOPIC - 1 ? 'Próxima Pergunta →' : 'Ver Resultado 🏆'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence></div>
      </div>
    </div>
  );
}
