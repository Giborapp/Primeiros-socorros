import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getAllStudentsBySchool, getResultsBySchool } from '../services/firestore';
import { logout } from '../services/auth';
import { topics } from '../data/questions';
import CharacterAvatar from '../components/CharacterAvatar';
import { QUESTIONS_PER_TOPIC, TOTAL_GAME_QUESTIONS } from '../constants/game';

function StatCard({ emoji, label, value, sub, color = '#a29bfe' }) {
  return (
    <div className="teacher-web-page" style={{
      background: 'rgba(255,255,255,0.07)', borderRadius: 16,
      border: `1px solid ${color}33`, padding: '16px 14px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: '1.6rem' }}>{emoji}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{sub}</div>}
    </div>
  );
}

function PctBar({ pct, color }) {
  const c = pct >= 70 ? '#00b894' : pct >= 40 ? '#fdcb6e' : '#d63031';
  return (
    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, height: 8, width: '100%', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color || c, borderRadius: 6, transition: 'width 0.6s ease' }} />
    </div>
  );
}

export default function TeacherDashboardScreen() {
  const nav = useNavigate();
  const { schoolData, isTeacher, setIsTeacher } = useApp();
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('geral');
  const [selectedClass, setSelectedClass] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    if (!isTeacher) { nav('/teacher/pin'); return; }
    if (!schoolData?.id) return;
    Promise.all([
      getAllStudentsBySchool(schoolData.id),
      getResultsBySchool(schoolData.id),
    ])
      .then(([studentData, resultData]) => {
        setStudents(studentData);
        setResults(resultData);
        if (schoolData.classes?.length) setSelectedClass(schoolData.classes[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  async function handleLogout() {
    setIsTeacher(false);
    await logout();
    nav('/');
  }

  // ── Agrupamento por turma ────────────────────────────────────────────────
  const byClass = {};
  (schoolData?.classes || []).forEach(c => { byClass[c] = []; });
  students.forEach(s => {
    const key = s.class || 'Sem turma';
    if (!byClass[key]) byClass[key] = [];
    byClass[key].push(s);
  });
  Object.values(byClass).forEach(arr => arr.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)));

  // ── Stats gerais ─────────────────────────────────────────────────────────
  const totalStudents = students.length;
  const resultStudentIds = new Set(results.map(result => result.studentId));
  const activeStudents = students.filter(s => (s.completedTopics || []).length > 0 || resultStudentIds.has(s.id)).length;
  const completedAll = resultStudentIds.size;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, result) => sum + (result.score || 0), 0) / results.length)
    : 0;

  // ── Stats por tópico ─────────────────────────────────────────────────────
  const topicStats = topics.map((t, idx) => {
    const historical = results.flatMap(result => (
      (result.completedTopics || []).filter(completion => completion.topicIndex === idx)
    ));
    const current = students.flatMap(student => (
      (student.completedTopics || []).filter(completion => completion.topicIndex === idx)
    ));
    const completions = [...historical, ...current];
    const completedCount = completions.length;
    const avgCorrect = completedCount > 0
      ? completions.reduce((sum, c) => sum + (c.correctCount || 0), 0) / completedCount
      : 0;
    const pctCorrect = Math.round(avgCorrect / QUESTIONS_PER_TOPIC * 100);

    // Questões mais erradas
    const allWrongIds = completions.flatMap(c => c.wrongIds || []);
    const wrongFreq = {};
    allWrongIds.forEach(id => { wrongFreq[id] = (wrongFreq[id] || 0) + 1; });
    const topWrong = Object.entries(wrongFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([qid, count]) => {
        const q = t.questions.find(q => q.id === Number(qid));
        return q ? { text: q.text, count } : null;
      })
      .filter(Boolean);

    return { ...t, idx, completedCount, avgCorrect, pctCorrect, topWrong };
  });

  const topicsRanked = [...topicStats].sort((a, b) => a.pctCorrect - b.pctCorrect);

  // ── Ranking geral ─────────────────────────────────────────────────────────
  const globalRanking = [...students]
    .map(student => {
      const attempts = attemptsByStudent[student.id] || [];
      const best = attempts.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      return {
        ...student,
        totalScore: Math.max(student.totalScore || 0, best?.score || 0),
        historicalAttempts: attempts.length,
      };
    })
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    .slice(0, 10);

  const classStudents = byClass[selectedClass] || [];
  const attemptsByStudent = results.reduce((map, result) => {
    if (!map[result.studentId]) map[result.studentId] = [];
    map[result.studentId].push(result);
    return map;
  }, {});

  const TABS = [
    { id: 'geral',  label: '📊 Geral' },
    { id: 'turmas', label: '🏫 Turmas' },
    { id: 'alunos', label: '👧 Alunos' },
    { id: 'topicos', label: '📚 Tópicos' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#0f0c29 0%,#302b63 55%,#24243e 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 16px 40px',
    }}>
      <div style={{ width: '100%', maxWidth: 1180 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
              👩‍🏫 Painel do Professor
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', margin: '2px 0 0' }}>
              {schoolData?.name}
            </p>
          </div>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 14px',
            cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit',
          }}>
            Sair
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '10px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit',
              transition: 'background 0.15s, color 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Carregando dados...</p>
          </div>
        ) : (

          <>
            {/* ── TAB GERAL ─────────────────────────────────────────────── */}
            {tab === 'geral' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Cards de stats */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <StatCard emoji="👥" label="Total de alunos" value={totalStudents} color="#a29bfe" />
                  <StatCard emoji="🎮" label="Já jogaram" value={activeStudents} color="#fd79a8" />
                  <StatCard emoji="🏆" label="Completaram tudo" value={completedAll} color="#fdcb6e" />
                  <StatCard emoji="⭐" label="Média de pontos" value={avgScore} color="#00b894" />
                </div>

                {/* Ranking geral */}
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 16 }}>🏅 Ranking Geral</h3>
                  {globalRanking.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center' }}>
                      Nenhum aluno jogou ainda.
                    </p>
                  ) : globalRanking.map((s, i) => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 0', borderBottom: i < globalRanking.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: i === 0 ? '#fdcb6e' : i === 1 ? '#b2bec3' : i === 2 ? '#e17055' : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 900, color: i < 3 ? '#1a1a2e' : 'rgba(255,255,255,0.5)',
                      }}>
                        {i + 1}
                      </div>
                      {s.character ? (
                        <CharacterAvatar options={s.character} size={32} />
                      ) : (
                        <div style={{ width: 32, fontSize: '1.2rem', textAlign: 'center' }}>👤</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{s.class} • {(s.completedTopics || []).length}/9 fases</div>
                      </div>
                      <div style={{ fontWeight: 900, color: '#fdcb6e', fontSize: '0.95rem', flexShrink: 0 }}>
                        ⭐ {s.totalScore || 0}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tópico mais difícil e mais fácil */}
                {topicsRanked.some(t => t.completedCount > 0) && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, background: 'rgba(214,48,49,0.15)', border: '1px solid rgba(214,48,49,0.3)', borderRadius: 14, padding: 16 }}>
                      <div style={{ fontSize: '0.7rem', color: '#d63031', fontWeight: 700, marginBottom: 6 }}>😓 MAIS DIFÍCIL</div>
                      <div style={{ fontSize: '1.4rem' }}>{topicsRanked[0].emoji}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: 4 }}>{topicsRanked[0].name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{topicsRanked[0].pctCorrect}% de acerto</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(0,184,148,0.15)', border: '1px solid rgba(0,184,148,0.3)', borderRadius: 14, padding: 16 }}>
                      <div style={{ fontSize: '0.7rem', color: '#00b894', fontWeight: 700, marginBottom: 6 }}>🌟 MAIS FÁCIL</div>
                      <div style={{ fontSize: '1.4rem' }}>{topicsRanked[topicsRanked.length - 1].emoji}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: 4 }}>{topicsRanked[topicsRanked.length - 1].name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{topicsRanked[topicsRanked.length - 1].pctCorrect}% de acerto</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB TURMAS ────────────────────────────────────────────── */}
            {tab === 'turmas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Seletor de turma */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(schoolData?.classes || []).map(cls => (
                    <button key={cls} onClick={() => setSelectedClass(cls)} style={{
                      padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      background: selectedClass === cls ? '#a29bfe' : 'rgba(255,255,255,0.1)',
                      color: selectedClass === cls ? '#1a1a2e' : 'rgba(255,255,255,0.6)',
                      fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit',
                    }}>
                      {cls}
                    </button>
                  ))}
                </div>

                {/* Stats da turma */}
                {selectedClass && (
                  <>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <StatCard emoji="👥" label="Alunos" value={classStudents.length} color="#a29bfe" />
                      <StatCard
                        emoji="⭐"
                        label="Média de pontos"
                        value={classStudents.length > 0 ? Math.round(classStudents.reduce((s, a) => s + (a.totalScore || 0), 0) / classStudents.length) : 0}
                        color="#fdcb6e"
                      />
                      <StatCard
                        emoji="🏆"
                        label="Completaram tudo"
                        value={classStudents.filter(s => (s.completedTopics || []).length >= 9).length}
                        color="#00b894"
                      />
                    </div>

                    {/* Lista de alunos */}
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 14 }}>
                        Alunos — {selectedClass}
                      </h3>
                      {classStudents.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
                          Nenhum aluno nessa turma ainda.
                        </p>
                      ) : classStudents.map((s, i) => {
                        const done = (s.completedTopics || []).length;
                        const pctDone = Math.round(done / 9 * 100);
                        const pctAcerto = done > 0
                          ? Math.round((s.completedTopics || []).reduce((sum, t) => sum + (t.correctCount || 0), 0) / (done * QUESTIONS_PER_TOPIC) * 100)
                          : 0;
                        return (
                          <div key={s.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 0', borderBottom: i < classStudents.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                              background: i === 0 ? '#fdcb6e' : i === 1 ? '#b2bec3' : i === 2 ? '#e17055' : 'rgba(255,255,255,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 900, color: i < 3 ? '#1a1a2e' : 'rgba(255,255,255,0.4)',
                            }}>
                              {i + 1}
                            </div>
                            {s.character ? (
                              <CharacterAvatar options={s.character} size={28} />
                            ) : (
                              <div style={{ fontSize: '1rem' }}>👤</div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.name}
                              </div>
                              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <PctBar pct={pctDone} color="#a29bfe" />
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{done}/9</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#fdcb6e' }}>⭐ {s.totalScore || 0}</div>
                              <div style={{ fontSize: '0.65rem', color: pctAcerto >= 70 ? '#00b894' : pctAcerto >= 40 ? '#fdcb6e' : 'rgba(255,255,255,0.35)' }}>
                                {done > 0 ? `${pctAcerto}% acerto` : 'Não jogou'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── TAB TÓPICOS ───────────────────────────────────────────── */}
            {tab === 'alunos' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <p style={{ color:'rgba(255,255,255,.45)', fontSize:'.82rem', marginBottom:4 }}>
                  Clique em “Ver detalhes” para consultar o histórico completo sem carregar a tela principal.
                </p>
                {[...students].sort((a, b) => a.name.localeCompare(b.name)).map(student => {
                  const attempts = attemptsByStudent[student.id] || [];
                  const expanded = expandedStudent === student.id;
                  const bestScore = attempts.length ? Math.max(...attempts.map(item => item.score || 0)) : 0;
                  const avgAccuracy = attempts.length
                    ? Math.round(attempts.reduce((sum, item) => (
                      sum + (item.accuracy ?? Math.round(((item.correctCount || 0) / (item.totalQuestions || TOTAL_GAME_QUESTIONS)) * 100))
                    ), 0) / attempts.length)
                    : 0;
                  const topicAttempts = attempts.flatMap(item => item.completedTopics || []);
                  const weakTopics = topics.map((topic, index) => {
                    const entries = topicAttempts.filter(item => item.topicIndex === index);
                    if (!entries.length) return null;
                    const correct = entries.reduce((sum, item) => sum + (item.correctCount || 0), 0);
                    return { name: topic.name, emoji: topic.emoji, pct: Math.round(correct / (entries.length * QUESTIONS_PER_TOPIC) * 100) };
                  }).filter(Boolean).sort((a, b) => a.pct - b.pct).slice(0, 3);

                  return (
                    <article key={student.id} className="teacher-student-card">
                      <div className="teacher-student-summary">
                        {student.character ? (
                          <CharacterAvatar options={student.character} size={52} />
                        ) : (
                          <div className="teacher-student-placeholder">👤</div>
                        )}
                        <div className="teacher-student-name">
                          <b>{student.name}</b>
                          <span>{student.class} • {attempts.length} tentativa{attempts.length !== 1 ? 's' : ''}</span>
                        </div>
                        <button onClick={() => setExpandedStudent(expanded ? null : student.id)}>
                          {expanded ? 'Fechar' : 'Ver detalhes'}
                        </button>
                      </div>

                      {expanded && (
                        <div className="teacher-student-details">
                          <div className="teacher-detail-stats">
                            <div><span>🎮</span><b>{attempts.length}</b><small>tentativas</small></div>
                            <div><span>⭐</span><b>{bestScore}</b><small>melhor pontuação</small></div>
                            <div><span>📊</span><b>{avgAccuracy}%</b><small>média de acertos</small></div>
                          </div>

                          {weakTopics.length > 0 && (
                            <div className="teacher-review-topics">
                              <b>Tópicos para revisar</b>
                              <div>
                                {weakTopics.map(item => (
                                  <span key={item.name} className={item.pct < 50 ? 'low' : ''}>
                                    {item.emoji} {item.name}: {item.pct}%
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="teacher-attempts">
                            <b>Últimas tentativas</b>
                            {attempts.length === 0 ? (
                              <p>Ainda não há uma jornada completa.</p>
                            ) : attempts.slice(0, 5).map((attempt, index) => (
                              <div key={attempt.id}>
                                <span>
                                  {attempt.completedAt?.toDate
                                    ? attempt.completedAt.toDate().toLocaleDateString('pt-BR')
                                    : `Tentativa ${attempts.length - index}`}
                                </span>
                                <b>{attempt.accuracy ?? Math.round(((attempt.correctCount || 0) / (attempt.totalQuestions || TOTAL_GAME_QUESTIONS)) * 100)}%</b>
                                <strong>⭐ {attempt.score || 0}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {tab === 'topicos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: 4 }}>
                  Ordenado do mais difícil para o mais fácil. Baseado nos alunos que já jogaram cada tópico.
                </p>
                {topicsRanked.map((t, i) => (
                  <div key={t.idx} style={{
                    background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16,
                    border: t.pctCorrect < 40
                      ? '1px solid rgba(214,48,49,0.3)'
                      : t.pctCorrect < 70
                      ? '1px solid rgba(253,203,110,0.3)'
                      : '1px solid rgba(0,184,148,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ fontSize: '1.6rem' }}>{t.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{t.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                          {t.completedCount} aluno{t.completedCount !== 1 ? 's' : ''} jogaram
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1.1rem', fontWeight: 900,
                        color: t.pctCorrect >= 70 ? '#00b894' : t.pctCorrect >= 40 ? '#fdcb6e' : '#d63031',
                      }}>
                        {t.completedCount > 0 ? `${t.pctCorrect}%` : '—'}
                      </div>
                    </div>

                    {t.completedCount > 0 && (
                      <>
                        <PctBar pct={t.pctCorrect} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>0%</span>
                          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>média de acertos</span>
                          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>100%</span>
                        </div>

                        {/* Questões mais erradas */}
                        {t.topWrong.length > 0 && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: '0.7rem', color: '#d63031', fontWeight: 700, marginBottom: 8 }}>
                              ❌ Questões mais erradas
                            </div>
                            {t.topWrong.map((w, j) => (
                              <div key={j} style={{
                                fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)',
                                padding: '6px 10px', background: 'rgba(214,48,49,0.08)',
                                borderRadius: 8, marginBottom: 4,
                                display: 'flex', justifyContent: 'space-between', gap: 8,
                              }}>
                                <span style={{ flex: 1 }}>{w.text}</span>
                                <span style={{ color: '#d63031', fontWeight: 700, flexShrink: 0 }}>{w.count}×</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
