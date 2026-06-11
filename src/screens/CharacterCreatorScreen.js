import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { updateStudentCharacter } from '../services/firestore';
import { playSound } from '../utils/sound';
import FullBodyCharacter, {
  ACCESSORIES,
  FACE_STYLES,
  OUTFIT_STYLES,
} from '../components/FullBodyCharacter';
import {
  DEFAULT_CHARACTER,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFIT_COLORS,
  SKIN_OPTIONS,
} from '../components/CharacterAvatar';

const TABS = [
  { id: 'aparencia', label: 'Aparência', emoji: '😊' },
  { id: 'cabelo', label: 'Cabelo', emoji: '💇' },
  { id: 'rosto', label: 'Rosto', emoji: '😄' },
  { id: 'roupa', label: 'Roupa', emoji: '👕' },
  { id: 'extras', label: 'Acessórios', emoji: '⭐' },
];

function SectionTitle({ children }) {
  return <h3 className="creator-section-title">{children}</h3>;
}

function ArrowCarousel({ children, label }) {
  const rowRef = useRef(null);

  function move(direction) {
    rowRef.current?.scrollBy({
      left: direction * Math.max(280, rowRef.current.clientWidth * 0.72),
      behavior: 'smooth',
    });
  }

  return (
    <div className="creator-carousel" aria-label={label}>
      <button className="creator-carousel-arrow left" onClick={() => move(-1)} aria-label="Ver opções anteriores">
        ‹
      </button>
      <div className="creator-carousel-track" ref={rowRef}>
        {children}
      </div>
      <button className="creator-carousel-arrow right" onClick={() => move(1)} aria-label="Ver próximas opções">
        ›
      </button>
    </div>
  );
}

function ChoiceGrid({ children, roomy = false }) {
  return (
    <div className={`creator-choice-grid ${roomy ? 'roomy' : ''}`}>
      {children}
    </div>
  );
}

function CharacterChoice({ options, patch, label, selected, onClick, wide = false }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`creator-choice ${wide ? 'wide' : ''} ${selected ? 'selected' : ''}`}
    >
      <div className="creator-choice-avatar">
        <FullBodyCharacter options={{ ...options, ...patch }} size={wide ? 108 : 92} bust animate={false} />
      </div>
      <span>{label}</span>
      {selected && <b className="creator-check">✓</b>}
    </motion.button>
  );
}

function ColorChoice({ option, selected, onClick }) {
  return (
    <button
      type="button"
      className={`creator-color ${selected ? 'selected' : ''}`}
      onClick={onClick}
      title={option.label}
    >
      <span style={{ background: option.color }} />
      <small>{option.label}</small>
    </button>
  );
}

function AppearancePanel({ opts, setOption }) {
  return (
    <>
      <SectionTitle>Escolha seu personagem</SectionTitle>
      <div className="creator-gender-grid">
        <CharacterChoice
          options={opts}
          patch={{ gender: 'menino', faceStyle: 'alegre' }}
          label="Menino"
          selected={opts.gender === 'menino'}
          onClick={() => setOption('gender', 'menino')}
          wide
        />
        <CharacterChoice
          options={opts}
          patch={{ gender: 'menina', faceStyle: 'alegre' }}
          label="Menina"
          selected={opts.gender === 'menina'}
          onClick={() => setOption('gender', 'menina')}
          wide
        />
      </div>

      <SectionTitle>Tom de pele</SectionTitle>
      <div className="creator-color-grid">
        {SKIN_OPTIONS.map(option => (
          <ColorChoice
            key={option.id}
            option={option}
            selected={opts.skinColor === option.id}
            onClick={() => setOption('skinColor', option.id)}
          />
        ))}
      </div>
    </>
  );
}

function HairPanel({ opts, setOption }) {
  return (
    <>
      <SectionTitle>Estilo do cabelo</SectionTitle>
      <ArrowCarousel label="Estilos de cabelo">
        {HAIR_STYLES.map(item => (
          <CharacterChoice
            key={item.id}
            options={opts}
            patch={{ hairStyle: item.id, accessory: 'nenhum', headwear: 'nenhum' }}
            label={item.label}
            selected={opts.hairStyle === item.id}
            onClick={() => setOption('hairStyle', item.id)}
          />
        ))}
      </ArrowCarousel>

      <SectionTitle>Cor do cabelo</SectionTitle>
      <div className="creator-color-grid compact">
        {HAIR_COLORS.map(option => (
          <ColorChoice
            key={option.id}
            option={option}
            selected={opts.hairColor === option.id}
            onClick={() => setOption('hairColor', option.id)}
          />
        ))}
      </div>
    </>
  );
}

function FacePanel({ opts, setOption }) {
  const faces = FACE_STYLES.filter(face => face.genders.includes(opts.gender));
  return (
    <>
      <SectionTitle>Rostos para {opts.gender === 'menina' ? 'meninas' : 'meninos'}</SectionTitle>
      <p className="creator-helper">Cada opção muda olhos, sobrancelhas e sorriso.</p>
      <ChoiceGrid roomy>
        {faces.map(face => (
          <CharacterChoice
            key={face.id}
            options={opts}
            patch={{ faceStyle: face.id }}
            label={face.label}
            selected={opts.faceStyle === face.id}
            onClick={() => setOption('faceStyle', face.id)}
          />
        ))}
      </ChoiceGrid>

    </>
  );
}

function OutfitPanel({ opts, setOption }) {
  return (
    <>
      <SectionTitle>Escolha uma roupa</SectionTitle>
      <p className="creator-helper">Tem roupas clássicas e camisetas estampadas. Use as setas para ver todas.</p>
      <ArrowCarousel label="Modelos de roupa">
        {OUTFIT_STYLES.filter(item => !item.legacy).map(item => (
          <CharacterChoice
            key={item.id}
            options={opts}
            patch={{ outfitStyle: item.id }}
            label={`${item.emoji} ${item.label}`}
            selected={opts.outfitStyle === item.id}
            onClick={() => setOption('outfitStyle', item.id)}
          />
        ))}
      </ArrowCarousel>

      <SectionTitle>Cor da roupa</SectionTitle>
      <div className="creator-color-grid compact">
        {OUTFIT_COLORS.map(option => (
          <ColorChoice
            key={option.id}
            option={option}
            selected={opts.outfitColor === option.id}
            onClick={() => setOption('outfitColor', option.id)}
          />
        ))}
      </div>
    </>
  );
}

function ExtrasPanel({ opts, setOption }) {
  const groups = ['Óculos', 'Cabeça'];
  return (
    <>
      <p className="creator-helper">Você pode combinar um item de cada grupo.</p>
      {groups.map(group => (
        <React.Fragment key={group}>
          <SectionTitle>{group}</SectionTitle>
          <ChoiceGrid roomy>
            {ACCESSORIES.filter(item => item.group === group).map(item => (
              <CharacterChoice
                key={`${item.field}-${item.id}`}
                options={opts}
                patch={{ [item.field]: item.id, accessory: 'nenhum' }}
                label={`${item.emoji} ${item.label}`}
                selected={(opts[item.field] || 'nenhum') === item.id}
                onClick={() => setOption(item.field, item.id)}
              />
            ))}
          </ChoiceGrid>
        </React.Fragment>
      ))}
    </>
  );
}

const PANELS = {
  aparencia: AppearancePanel,
  cabelo: HairPanel,
  rosto: FacePanel,
  roupa: OutfitPanel,
  extras: ExtrasPanel,
};

export default function CharacterCreatorScreen() {
  const nav = useNavigate();
  const { studentData, setStudentData } = useApp();
  const [opts, setOpts] = useState(() => {
    const saved = { ...DEFAULT_CHARACTER, ...studentData?.character };
    const gender = saved.gender === 'menina' ? 'menina' : 'menino';
    const allowedFaces = FACE_STYLES.filter(face => face.genders.includes(gender)).map(face => face.id);
    return {
      ...saved,
      gender,
      faceStyle: allowedFaces.includes(saved.faceStyle) ? saved.faceStyle : 'alegre',
      eyewear: saved.eyewear !== 'nenhum'
        ? saved.eyewear
        : ['oculos', 'oculosQuadrado', 'oculosClassico', 'oculosLeve', 'oculosEstiloso', 'oculosSol', 'tapaOlho'].includes(saved.accessory)
          ? saved.accessory
          : 'nenhum',
      headwear: saved.headwear !== 'nenhum'
        ? saved.headwear
        : ['gorro', 'gorroListrado', 'gorroPompom', 'gorroAlto', 'hijab', 'turbante', 'bone', 'chapeu'].includes(saved.accessory)
          ? saved.accessory
          : 'nenhum',
      accessory: 'nenhum',
    };
  });
  const [tab, setTab] = useState('aparencia');
  const [saving, setSaving] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const wiggleTimer = useRef(null);

  const validFaceIds = useMemo(
    () => FACE_STYLES.filter(face => face.genders.includes(opts.gender)).map(face => face.id),
    [opts.gender],
  );

  const setOption = useCallback((key, value) => {
    playSound('click');
    setOpts(current => {
      const updated = { ...current, [key]: value };
      if (key === 'gender') {
        const allowed = FACE_STYLES.filter(face => face.genders.includes(value)).map(face => face.id);
        if (!allowed.includes(updated.faceStyle)) updated.faceStyle = 'alegre';
      }
      return updated;
    });
    clearTimeout(wiggleTimer.current);
    setWiggle(true);
    wiggleTimer.current = setTimeout(() => setWiggle(false), 500);
  }, []);

  async function handleSave() {
    if (!validFaceIds.includes(opts.faceStyle)) return;
    setSaving(true);
    playSound('start');
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.58 },
      colors: ['#a855f7', '#6366f1', '#f59e0b', '#10b981', '#ec4899', '#ffffff'],
    });

    try {
      await updateStudentCharacter(studentData.schoolId, studentData.id, opts);
      setStudentData(current => ({ ...current, character: opts }));
      setTimeout(() => nav('/student/home'), 800);
    } catch {
      setSaving(false);
      alert('Erro ao salvar. Verifique sua conexão e tente novamente.');
    }
  }

  const ActivePanel = PANELS[tab];

  return (
    <main className="creator-page">
      <div className="creator-orb orb-one" />
      <div className="creator-orb orb-two" />

      <header className="creator-header web-container">
        <div>
          <span className="creator-eyebrow">MEU HERÓI</span>
          <h1>Crie seu personagem</h1>
          <p>
            Olá, <strong>{studentData?.name}</strong>. Escolha cada detalhe do seu companheiro de aventura.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => nav('/student/home')}>Voltar</button>
      </header>

      <div className="creator-workspace web-container">
        <section className="creator-stage">
          <div className="creator-stage-badge">Prévia ao vivo</div>
          <div className="creator-stage-glow" />
          <FullBodyCharacter options={opts} size={330} animate wiggle={wiggle} />
          <div className="creator-nameplate">
            <b>{studentData?.name}</b>
            <span>{opts.gender === 'menina' ? 'Heroína em treinamento' : 'Herói em treinamento'}</span>
          </div>
        </section>

        <section className="creator-editor">
          <nav className="creator-tabs">
            {TABS.map(item => (
              <button
                key={item.id}
                className={tab === item.id ? 'active' : ''}
                onClick={() => { playSound('click'); setTab(item.id); }}
              >
                <span>{item.emoji}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="creator-options">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <ActivePanel opts={opts} setOption={setOption} />
              </motion.div>
            </AnimatePresence>
          </div>

          <button className="creator-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando personagem...' : 'Começar a aventura →'}
          </button>
        </section>
      </div>
    </main>
  );
}
