import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/auth';
import { createSchool } from '../services/firestore';
import { useApp } from '../context/AppContext';

function formatCNPJ(v) {
  return v.replace(/\D/g,'').slice(0,14)
    .replace(/^(\d{2})(\d)/,'$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
    .replace(/\.(\d{3})(\d)/,'.$1/$2')
    .replace(/(\d{4})(\d)/,'$1-$2');
}

export default function RegisterSchoolScreen() {
  const nav = useNavigate();
  const { setSchoolData } = useApp();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    schoolName:'', cnpj:'', responsible:'', city:'', email:'', password:'', confirmPass:'', pin:'',
    numClasses:'1', classNames:[''],
  });

  function set(k, v) { setForm(f => ({ ...f, [k]:v })); }

  function handleClasses(count) {
    const n = Math.max(1, Math.min(30, parseInt(count)||1));
    const names = Array.from({ length:n }, (_,i) => form.classNames[i]||'');
    set('numClasses', String(n));
    setForm(f => ({ ...f, numClasses:String(n), classNames:names }));
  }

  function setClassName(i, v) {
    const names = [...form.classNames];
    names[i] = v;
    setForm(f => ({ ...f, classNames:names }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPass) { setError('As senhas não coincidem.'); return; }
    if (form.password.length < 6)           { setError('Senha deve ter pelo menos 6 caracteres.'); return; }
    if (!/^\d{4,6}$/.test(form.pin))        { setError('PIN deve ter 4 a 6 números.'); return; }
    const emptyClass = form.classNames.some(c => !c.trim());
    if (emptyClass) { setError('Preencha o nome de todas as turmas.'); return; }

    setLoading(true);
    try {
      const user = await register(form.schoolName, form.email, form.password, 'school');
      const schoolDoc = await createSchool(user.uid, {
        name: form.schoolName,
        cnpj: form.cnpj,
        responsible: form.responsible,
        city: form.city,
        pin: form.pin,
        classes: form.classNames.map(c => c.trim()),
      });
      setSchoolData(schoolDoc);
      nav('/role');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('E-mail já cadastrado.');
      else setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen stars-bg" style={{ justifyContent:'flex-start', paddingTop:32, paddingBottom:40 }}>
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:760 }}>
        <button className="btn btn-ghost" style={{ marginBottom:20, padding:'8px 16px', fontSize:'0.85rem' }}
          onClick={() => step===1 ? nav('/') : setStep(1)}>
          ← Voltar
        </button>

        <div className="card">
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:'2.5rem' }}>🏫</div>
            <h2 style={{ fontSize:'1.4rem', fontWeight:900, marginTop:8 }}>Cadastro da Escola</h2>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:12 }}>
              {[1,2].map(s => (
                <div key={s} style={{ width:32, height:6, borderRadius:3,
                  background: step >= s ? '#fd79a8' : 'rgba(255,255,255,0.2)' }} />
              ))}
            </div>
          </div>

          <form onSubmit={step===1 ? (e)=>{e.preventDefault();setStep(2)} : handleSubmit}>
            {step === 1 && <>
              <div className="form-group">
                <label className="label">Nome da Escola</label>
                <input className="input" placeholder="Ex: Escola Municipal João Paulo"
                  value={form.schoolName} onChange={e => set('schoolName', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">CNPJ</label>
                  <input className="input" placeholder="00.000.000/0000-00"
                    value={form.cnpj} onChange={e => set('cnpj', formatCNPJ(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="label">Cidade</label>
                  <input className="input" placeholder="Curitiba"
                    value={form.city} onChange={e => set('city', e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Responsável</label>
                <input className="input" placeholder="Nome do diretor/responsável"
                  value={form.responsible} onChange={e => set('responsible', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">E-mail</label>
                <input className="input" type="email" placeholder="escola@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Senha</label>
                  <input className="input" type="password" placeholder="••••••"
                    value={form.password} onChange={e => set('password', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Confirmar Senha</label>
                  <input className="input" type="password" placeholder="••••••"
                    value={form.confirmPass} onChange={e => set('confirmPass', e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop:8 }}>
                Continuar →
              </button>
            </>}

            {step === 2 && <>
              <div className="form-group">
                <label className="label">PIN dos Professores (4-6 dígitos)</label>
                <input className="input" type="password" placeholder="Ex: 1234" maxLength={6}
                  value={form.pin} onChange={e => set('pin', e.target.value.replace(/\D/g,''))} required />
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', marginTop:4 }}>
                  Os professores usarão esse PIN para acessar o painel.
                </p>
              </div>
              <div className="form-group">
                <label className="label">Quantidade de Turmas</label>
                <input className="input" type="number" min="1" max="30"
                  value={form.numClasses} onChange={e => handleClasses(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Nome das Turmas</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
                  {form.classNames.map((c,i) => (
                    <input key={i} className="input" placeholder={`Ex: 4ºano/A`}
                      value={c} onChange={e => setClassName(i, e.target.value)} required />
                  ))}
                </div>
              </div>
              {error && <div className="error-msg">{error}</div>}
              <button type="submit" className="btn btn-success btn-full" style={{ marginTop:12 }} disabled={loading}>
                {loading ? 'Criando conta...' : '✅ Finalizar Cadastro'}
              </button>
            </>}
          </form>
        </div>
      </div>
    </div>
  );
}
