import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { logout } from '../services/auth';
import { playSound } from '../utils/sound';

export default function RoleSelectScreen() {
  const nav = useNavigate();
  const { schoolData } = useApp();

  function pick(role) {
    playSound('click');
    if (role === 'teacher') nav('/teacher/pin');
    else nav('/student/login');
  }

  return (
    <div className="screen stars-bg" style={{ justifyContent:'center' }}>
      <div style={{ position:'relative', zIndex:1, textAlign:'center', width:'100%', maxWidth:900 }}>

        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:'3rem', marginBottom:8 }}>🏥</div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:900 }}>
            {schoolData?.name || 'Bem-vindo!'}
          </h1>
          {schoolData?.city && (
            <p style={{ color:'rgba(255,255,255,0.5)', marginTop:4 }}>📍 {schoolData.city}</p>
          )}
        </div>

        <p style={{ color:'rgba(255,255,255,0.7)', marginBottom:28, fontSize:'1.1rem' }}>
          Quem está entrando?
        </p>

        <div style={{ display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap' }}>
          {/* Card Professor */}
          <button onClick={() => pick('teacher')} style={{
            background:'linear-gradient(135deg,#6c5ce7,#a29bfe)',
            border:'none', borderRadius:28, padding:'32px 28px',
            cursor:'pointer', width:300, textAlign:'center',
            boxShadow:'0 8px 32px rgba(108,92,231,0.4)',
            transition:'transform 0.2s, box-shadow 0.2s',
            color:'#fff', fontFamily:'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(108,92,231,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 8px 32px rgba(108,92,231,0.4)'; }}
          >
            <div style={{ fontSize:'3.5rem', marginBottom:12 }}>👩‍🏫</div>
            <div style={{ fontSize:'1.2rem', fontWeight:900 }}>Professor</div>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.7)', marginTop:6 }}>
              Acompanhar turmas e alunos
            </div>
          </button>

          {/* Card Aluno */}
          <button onClick={() => pick('student')} style={{
            background:'linear-gradient(135deg,#e84393,#fd79a8)',
            border:'none', borderRadius:28, padding:'32px 28px',
            cursor:'pointer', width:300, textAlign:'center',
            boxShadow:'0 8px 32px rgba(232,67,147,0.4)',
            transition:'transform 0.2s, box-shadow 0.2s',
            color:'#fff', fontFamily:'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(232,67,147,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 8px 32px rgba(232,67,147,0.4)'; }}
          >
            <div style={{ fontSize:'3.5rem', marginBottom:12 }}>🧒</div>
            <div style={{ fontSize:'1.2rem', fontWeight:900 }}>Sou Aluno</div>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.7)', marginTop:6 }}>
              Jogar e aprender!
            </div>
          </button>
        </div>

        <button className="btn btn-ghost" style={{ marginTop:40, fontSize:'0.85rem', padding:'8px 18px' }}
          onClick={async () => { await logout(); nav('/'); }}>
          Sair da conta
        </button>
      </div>
    </div>
  );
}
