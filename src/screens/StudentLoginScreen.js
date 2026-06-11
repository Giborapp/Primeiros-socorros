import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getStudents, createStudent, findStudent, createAttemptId, updateStudentProgress } from '../services/firestore';
import { playSound } from '../utils/sound';
import CharacterAvatar from '../components/CharacterAvatar';

export default function StudentLoginScreen() {
  const nav = useNavigate();
  const { schoolData, setStudentData, resetGame, loadGame } = useApp();

  const [step, setStep]           = useState('class');   // 'class' | 'name'
  const [selectedClass, setClass] = useState('');
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [isFirst, setIsFirst]     = useState(false);
  const [newName, setNewName]     = useState('');
  const [error, setError]         = useState('');

  const classes = schoolData?.classes || [];

  async function handleClassSelect(cls) {
    playSound('click');
    setClass(cls);
    setLoading(true);
    try {
      const list = await getStudents(schoolData.id, cls);
      setStudents(list);
    } catch { setStudents([]); }
    setLoading(false);
    setStep('name');
  }

  async function handleStudentSelect(student) {
    playSound('start');
    let selectedStudent = student;
    if (!student.currentAttemptId) {
      const currentAttemptId = createAttemptId();
      selectedStudent = { ...student, currentAttemptId };
      await updateStudentProgress(
        schoolData.id,
        student.id,
        student.completedTopics || [],
        student.totalScore || 0,
        currentAttemptId
      ).catch(() => {});
    }
    if (student.completedTopics?.length > 0) {
      loadGame(student.completedTopics, student.totalScore);
    } else {
      resetGame();
    }
    setStudentData(selectedStudent);
    if (!student.character) nav('/character');
    else nav('/student/home');
  }

  async function handleFirstTime(e) {
    e.preventDefault();
    setError('');

    if (!newName.trim()) {
      setError('Digite seu nome.');
      return;
    }
    if (!schoolData?.id || !selectedClass) {
      setError('Não foi possível identificar a escola ou a turma. Volte e tente novamente.');
      return;
    }

    setLoading(true);
    try {
      const exists = await findStudent(schoolData.id, selectedClass, newName.trim());
      if (exists) {
        setError('Já existe um aluno com esse nome nessa turma. Escolha seu nome na lista.');
        return;
      }

      const created = await createStudent(schoolData.id, {
        name: newName.trim(),
        className: selectedClass,
      });
      const student = {
        id: created.id,
        currentAttemptId: created.currentAttemptId,
        name: newName.trim(),
        class: selectedClass,
        schoolId: schoolData.id,
        character: null,
        completedTopics: [],
        totalScore: 0,
      };
      resetGame();
      setStudentData(student);
      nav('/character');
    } catch (err) {
      console.error('Erro ao criar perfil do aluno:', err);
      if (err?.code === 'permission-denied') {
        setError('O Firebase bloqueou a criação. As regras do banco precisam ser publicadas.');
      } else {
        setError('Erro ao criar perfil. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen stars-bg" style={{ justifyContent:'flex-start', paddingTop:32, paddingBottom:40 }}>
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:760 }}>
        <button className="btn btn-ghost" style={{ marginBottom:20, padding:'8px 16px', fontSize:'0.85rem' }}
          onClick={() => step==='class' ? nav('/role') : setStep('class')}>
          ← Voltar
        </button>

        {step === 'class' && (
          <div className="card">
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:'2.5rem' }}>🎒</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, marginTop:8 }}>Qual é a sua turma?</h2>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {classes.map(cls => (
                <button key={cls} className="btn btn-secondary btn-full"
                  style={{ fontSize:'1.1rem', padding:'16px' }}
                  onClick={() => handleClassSelect(cls)}>
                  {cls}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'name' && (
          <div className="card">
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:'2.5rem' }}>👋</div>
              <h2 style={{ fontSize:'1.3rem', fontWeight:900, marginTop:8 }}>Quem é você?</h2>
              <p style={{ color:'rgba(255,255,255,0.5)', marginTop:4 }}>Turma: <strong>{selectedClass}</strong></p>
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:20 }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
            ) : !isFirst ? (
              <>
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:280, overflowY:'auto', marginBottom:16 }}>
                  {students.map(s => (
                    <button key={s.id} onClick={() => handleStudentSelect(s)} style={{
                      background:'rgba(255,255,255,0.08)', border:'2px solid rgba(255,255,255,0.15)',
                      borderRadius:14, padding:'14px 18px', color:'#fff', fontFamily:'inherit',
                      fontSize:'1rem', fontWeight:700, cursor:'pointer', textAlign:'left',
                      display:'flex', alignItems:'center', gap:12,
                      transition:'background 0.15s, border-color 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; }}
                    >
                      {s.character ? (
                        <CharacterAvatar options={s.character} size={48} />
                      ) : (
                        <span style={{
                          width:48, height:48, borderRadius:'50%',
                          display:'grid', placeItems:'center',
                          background:'rgba(255,255,255,.08)', fontSize:'1.5rem',
                        }}>👤</span>
                      )}
                      <span>{s.name}</span>
                      {s.totalScore > 0 && (
                        <span style={{ marginLeft:'auto', color:'#fdcb6e', fontSize:'0.85rem' }}>
                          ⭐ {s.totalScore} pts
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary btn-full" onClick={() => setIsFirst(true)}>
                  ✨ Primeira vez aqui!
                </button>
              </>
            ) : (
              <form onSubmit={handleFirstTime}>
                <div style={{ marginBottom:16 }}>
                  <label className="label">Qual é o seu nome?</label>
                  <input className="input" placeholder="Seu nome completo"
                    value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn btn-success btn-full" style={{ marginTop:12 }} disabled={loading}>
                  {loading ? 'Criando perfil...' : '🚀 Criar meu perfil!'}
                </button>
                <button type="button" className="btn btn-ghost btn-full" style={{ marginTop:8 }}
                  onClick={() => setIsFirst(false)}>
                  Voltar à lista
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
