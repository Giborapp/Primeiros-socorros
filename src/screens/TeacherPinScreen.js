import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function TeacherPinScreen() {
  const nav = useNavigate();
  const { schoolData, setIsTeacher } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef();

  function handleCheck(e) {
    e.preventDefault();
    if (!schoolData) { setError('Dados da escola não encontrados.'); return; }
    if (pin === schoolData.pin) {
      setIsTeacher(true);
      nav('/teacher/dashboard');
    } else {
      setError('PIN incorreto. Tente novamente.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
      inputRef.current?.focus();
    }
  }

  const dots = Array.from({ length: Math.max(4, (schoolData?.pin||'0000').length) });

  return (
    <div className="screen stars-bg" style={{ justifyContent:'center' }}>
      <div style={{ position:'relative', zIndex:1, textAlign:'center', width:'100%', maxWidth:560 }}>
        <button className="btn btn-ghost" style={{ alignSelf:'flex-start', marginBottom:24, padding:'8px 16px', fontSize:'0.85rem' }}
          onClick={() => nav('/role')}>
          ← Voltar
        </button>

        <div style={{ fontSize:'3rem', marginBottom:8 }}>🔐</div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:6 }}>Acesso do Professor</h2>
        <p style={{ color:'rgba(255,255,255,0.5)', marginBottom:32 }}>
          Digite o PIN definido no cadastro da escola
        </p>

        <div className="card" style={{ animation: shake ? 'shake 0.4s' : 'none' }}>
          {/* Indicador visual de dígitos */}
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:24 }}>
            {dots.map((_,i) => (
              <div key={i} style={{
                width:18, height:18, borderRadius:'50%',
                background: i < pin.length ? '#fd79a8' : 'rgba(255,255,255,0.2)',
                transition:'background 0.15s',
                boxShadow: i < pin.length ? '0 0 8px rgba(253,121,168,0.6)' : 'none',
              }} />
            ))}
          </div>

          <form onSubmit={handleCheck}>
            <input
              ref={inputRef}
              className="input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="PIN"
              maxLength={6}
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g,'')); setError(''); }}
              style={{ textAlign:'center', fontSize:'1.5rem', letterSpacing:'0.5rem' }}
              autoFocus
            />
            {error && <div className="error-msg" style={{ marginTop:12 }}>{error}</div>}
            <button type="submit" className="btn btn-secondary btn-full" style={{ marginTop:20 }}
              disabled={!pin}>
              Entrar como Professor 👩‍🏫
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
