import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

export default function LandingScreen() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, pass);
      nav('/role');
    } catch {
      setError('E-mail ou senha incorretos. Verifique e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen stars-bg landing-web" style={{ justifyContent:'center', minHeight:'100vh' }}>
      {/* Logo */}
      <div className="landing-web-brand" style={{ textAlign:'center', marginBottom:40, position:'relative', zIndex:1 }}>
        <div style={{ fontSize:'5rem', marginBottom:8, filter:'drop-shadow(0 0 20px rgba(253,121,168,0.6))' }}>🏥</div>
        <h1 style={{ fontSize:'2rem', fontWeight:900, lineHeight:1.2 }}>
          Heróis dos<br />
          <span style={{ color:'#fd79a8' }}>Primeiros Socorros</span>
        </h1>
        <p style={{ color:'rgba(255,255,255,0.6)', marginTop:8, fontSize:'0.95rem' }}>
          Plataforma educacional para escolas
        </p>
      </div>

      {/* Card de login */}
      <div className="card landing-web-card" style={{ position:'relative', zIndex:1 }}>
        <h2 style={{ textAlign:'center', marginBottom:24, fontSize:'1.3rem', fontWeight:800 }}>
          Entrar na escola
        </h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="label">E-mail da escola</label>
            <input className="input" type="email" placeholder="escola@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Senha</label>
            <input className="input" type="password" placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)} required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop:20 }} disabled={loading}>
            {loading ? 'Entrando...' : '🚀 Entrar'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:20 }}>
          <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.9rem' }}>Escola nova? </span>
          <button className="btn btn-ghost" style={{ fontSize:'0.9rem', padding:'8px 16px', marginLeft:4 }}
            onClick={() => nav('/register')}>
            Criar conta
          </button>
        </div>
      </div>

      {/* Decoração */}
      <div style={{ position:'fixed', bottom:20, left:0, right:0, textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'0.75rem', zIndex:1 }}>
        Heróis dos Primeiros Socorros © 2025
      </div>
    </div>
  );
}
