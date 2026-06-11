import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import CharacterAvatar from '../components/CharacterAvatar';
import { getClassRanking, getStudents } from '../services/firestore';

const MEDAL = ['🥇','🥈','🥉'];

export default function RankingScreen() {
  const nav = useNavigate();
  const { studentData } = useApp();
  const [ranking, setRanking]   = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!studentData) return;
    async function load() {
      try {
        const results = await getClassRanking(studentData.schoolId, studentData.class);
        setRanking(results);
        // Busca dados dos alunos para mostrar personagem
        const all = await getStudents(studentData.schoolId, studentData.class);
        const map = {};
        all.forEach(s => { map[s.id] = s; });
        setStudents(map);
      } catch { setRanking([]); }
      setLoading(false);
    }
    load();
  }, [studentData]);

  return (
    <div className="web-page ranking-web-page" style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
      padding:'24px 16px 48px',
      display:'flex', flexDirection:'column', alignItems:'center',
    }}>
      {/* Header */}
      <div style={{ width:'100%', maxWidth:960, marginBottom:24 }}>
        <button className="btn btn-ghost" style={{ padding:'8px 16px', fontSize:'0.85rem' }}
          onClick={() => nav('/student/home')}>
          ← Voltar
        </button>
      </div>

      <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🏅</div>
      <h1 style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:4, textAlign:'center' }}>
        Ranking da Turma
      </h1>
      <p style={{ color:'rgba(255,255,255,0.5)', marginBottom:32, fontSize:'0.9rem' }}>
        Turma {studentData?.class}
      </p>

      {loading ? (
        <div className="spinner" />
      ) : ranking.length === 0 ? (
        <div style={{ color:'rgba(255,255,255,0.4)', textAlign:'center', padding:32 }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>🎯</div>
          <p>Nenhum resultado ainda.<br />Seja o primeiro a completar!</p>
        </div>
      ) : (
        <div style={{ width:'100%', maxWidth:900 }}>
          {/* Pódio top 3 */}
          {ranking.length >= 3 && (
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:12, marginBottom:32, height:160 }}>
              {[1,0,2].map(i => {
                const r = ranking[i];
                if (!r) return null;
                const heights = [120,150,100];
                const s = students[r.studentId];
                return (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <CharacterAvatar
                      options={s?.character}
                      size={50}
                      isFirefighter={(r.correctCount || 0) / (r.totalQuestions || 45) > 0.5}
                    />
                    <div style={{ fontSize:'1.2rem' }}>{MEDAL[i]}</div>
                    <div style={{
                      width:80, height:heights[i],
                      background: i===0
                        ? 'linear-gradient(180deg,#fdcb6e,#e17055)'
                        : i===1
                        ? 'linear-gradient(180deg,#b2bec3,#636e72)'
                        : 'linear-gradient(180deg,#CD7F32,#8B4513)',
                      borderRadius:'12px 12px 0 0',
                      display:'flex', flexDirection:'column', alignItems:'center',
                      justifyContent:'center', padding:'0 4px',
                    }}>
                      <div style={{ fontSize:'0.65rem', fontWeight:900, textAlign:'center', color:'#1a1a2e', lineHeight:1.2 }}>
                        {r.studentName?.split(' ')[0]}
                      </div>
                      <div style={{ fontSize:'0.75rem', fontWeight:900, color:'#1a1a2e' }}>
                        {r.score}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lista completa */}
          {ranking.map((r, i) => {
            const isMe = r.studentId === studentData?.id;
            const s = students[r.studentId];
            return (
              <div key={r.id} className="ranking-card" style={{
                border: isMe ? '2px solid #fd79a8' : undefined,
                background: isMe ? 'rgba(253,121,168,0.15)' : undefined,
              }}>
                <div className="rank-pos">
                  {i < 3 ? MEDAL[i] : `#${i+1}`}
                </div>
                <CharacterAvatar
                  options={s?.character}
                  size={44}
                  isFirefighter={(r.correctCount || 0) / (r.totalQuestions || 45) > 0.5}
                />
                <div style={{ flex:1 }}>
                  <div className="rank-name">{r.studentName} {isMe && '(você)'}</div>
                  <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>
                    {r.correctCount || 0}/45 acertos
                  </div>
                </div>
                <div className="rank-score">⭐ {r.score}</div>
              </div>
            );
          })}
        </div>
      )}

      <button className="btn btn-primary" style={{ marginTop:32, padding:'14px 32px' }}
        onClick={() => nav('/student/home')}>
        🗺️ Voltar ao Tabuleiro
      </button>
    </div>
  );
}
