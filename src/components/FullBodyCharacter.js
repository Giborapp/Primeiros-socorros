import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import {
  DEFAULT_CHARACTER,
  HAIR_COLORS,
  OUTFIT_COLORS,
  SKIN_OPTIONS,
} from './characterOptions';

export const OUTFIT_STYLES = [
  { id: 'camiseta', label: 'Camiseta', emoji: '👕', clothing: 'shirtCrewNeck' },
  { id: 'casual', label: 'Gola V', emoji: '✨', clothing: 'shirtVNeck' },
  { id: 'decote', label: 'Gola redonda', emoji: '🌸', clothing: 'shirtScoopNeck' },
  { id: 'moletom', label: 'Moletom', emoji: '🧥', clothing: 'hoodie' },
  { id: 'jardineira', label: 'Jardineira', emoji: '🩳', clothing: 'overall' },
  { id: 'gola', label: 'Suéter', emoji: '🧶', clothing: 'collarAndSweater' },
  { id: 'social', label: 'Social', emoji: '👔', clothing: 'blazerAndShirt' },
  { id: 'blazer', label: 'Blazer', emoji: '🧥', clothing: 'blazerAndSweater' },
  { id: 'urso', label: 'Ursinho', emoji: '🧸', clothing: 'graphicShirt', graphic: 'bear' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕', clothing: 'graphicShirt', graphic: 'pizza' },
  { id: 'diamante', label: 'Diamante', emoji: '💎', clothing: 'graphicShirt', graphic: 'diamond' },
  { id: 'cervo', label: 'Natureza', emoji: '🌿', clothing: 'graphicShirt', graphic: 'deer' },
  { id: 'musica', label: 'Música', emoji: '🎵', clothing: 'graphicShirt', graphic: 'cumbia' },
  { id: 'ola', label: 'Olá!', emoji: '👋', clothing: 'graphicShirt', graphic: 'hola' },
  { id: 'heroi', label: 'Super-herói', emoji: '🦸', clothing: 'graphicShirt', graphic: 'bat' },
  // Mantém personagens salvos antes da ampliação.
  { id: 'grafica', label: 'Estampada', emoji: '⭐', clothing: 'graphicShirt', graphic: 'bear', legacy: true },
];

export const ACCESSORIES = [
  { id: 'nenhum', field: 'eyewear', label: 'Sem óculos', emoji: '🙂', group: 'Óculos' },
  { id: 'oculos', field: 'eyewear', label: 'Redondos', emoji: '👓', group: 'Óculos' },
  { id: 'oculosQuadrado', field: 'eyewear', label: 'Quadrados', emoji: '👓', group: 'Óculos' },
  { id: 'oculosClassico', field: 'eyewear', label: 'Clássicos', emoji: '🤓', group: 'Óculos' },
  { id: 'oculosLeve', field: 'eyewear', label: 'Leves', emoji: '👓', group: 'Óculos' },
  { id: 'oculosEstiloso', field: 'eyewear', label: 'Estilosos', emoji: '😎', group: 'Óculos' },
  { id: 'oculosSol', field: 'eyewear', label: 'De sol', emoji: '🕶️', group: 'Óculos' },
  { id: 'tapaOlho', field: 'eyewear', label: 'Aventureiro', emoji: '🏴‍☠️', group: 'Óculos' },
  { id: 'nenhum', field: 'headwear', label: 'Sem chapéu', emoji: '🙂', group: 'Cabeça' },
  { id: 'bone', field: 'headwear', label: 'Boné', emoji: '🧢', group: 'Cabeça' },
  { id: 'gorro', field: 'headwear', label: 'Gorro', emoji: '🧢', group: 'Cabeça' },
  { id: 'gorroListrado', field: 'headwear', label: 'Gorro listrado', emoji: '❄️', group: 'Cabeça' },
  { id: 'gorroPompom', field: 'headwear', label: 'Com pompom', emoji: '☃️', group: 'Cabeça' },
  { id: 'gorroAlto', field: 'headwear', label: 'Gorro alto', emoji: '🧶', group: 'Cabeça' },
  { id: 'hijab', field: 'headwear', label: 'Hijab', emoji: '🧕', group: 'Cabeça' },
  { id: 'turbante', field: 'headwear', label: 'Turbante', emoji: '👳', group: 'Cabeça' },
];

export const FACE_STYLES = [
  { id: 'alegre', label: 'Alegre', genders: ['menino', 'menina'] },
  { id: 'tranquilo', label: 'Tranquilo', genders: ['menino', 'menina'] },
  { id: 'curioso', label: 'Curioso', genders: ['menino', 'menina'] },
  { id: 'animado', label: 'Animado', genders: ['menino', 'menina'] },
  { id: 'confiante', label: 'Confiante', genders: ['menino'] },
  { id: 'aventureiro', label: 'Aventureiro', genders: ['menino'] },
  { id: 'delicado', label: 'Delicado', genders: ['menina'] },
  { id: 'sonhadora', label: 'Sonhadora', genders: ['menina'] },
  { id: 'divertido', label: 'Divertido', genders: ['menino', 'menina'] },
  { id: 'surpreso', label: 'Surpreso', genders: ['menino', 'menina'] },
  { id: 'sorridente', label: 'Sorridente', genders: ['menino', 'menina'] },
  { id: 'pensativo', label: 'Pensativo', genders: ['menino', 'menina'] },
  { id: 'brincalhao', label: 'Brincalhão', genders: ['menino'] },
  { id: 'determinado', label: 'Determinado', genders: ['menino'] },
  { id: 'charmosa', label: 'Charmosa', genders: ['menina'] },
  { id: 'fofinha', label: 'Fofinha', genders: ['menina'] },
  { id: 'estrelinha', label: 'Estrelinha', genders: ['menina'] },
  { id: 'timida', label: 'Tímida', genders: ['menina'] },
];

const HAIR_MAP = {
  curto: { menino: 'shortRound', menina: 'bob' },
  medio: { menino: 'shortWaved', menina: 'straightAndStrand' },
  longo: { menino: 'longButNotTooLong', menina: 'straight02' },
  crespo: { menino: 'fro', menina: 'bigHair' },
  coque: { menino: 'bun', menina: 'bun' },
  tranca: { menino: 'dreads02', menina: 'dreads' },
  rabo: { menino: 'straightAndStrand', menina: 'straightAndStrand' },
  franja: { menino: 'theCaesarAndSidePart', menina: 'miaWallace' },
  careca: { menino: 'sides', menina: 'sides' },
};

const FACE_MAP = {
  menino: {
    alegre: { eyes: 'happy', mouth: 'smile', eyebrows: 'raisedExcitedNatural' },
    tranquilo: { eyes: 'default', mouth: 'twinkle', eyebrows: 'defaultNatural' },
    curioso: { eyes: 'side', mouth: 'default', eyebrows: 'upDownNatural' },
    animado: { eyes: 'squint', mouth: 'tongue', eyebrows: 'raisedExcited' },
    confiante: { eyes: 'wink', mouth: 'smile', eyebrows: 'upDown' },
    aventureiro: { eyes: 'winkWacky', mouth: 'twinkle', eyebrows: 'raisedExcitedNatural' },
    divertido: { eyes: 'xDizzy', mouth: 'tongue', eyebrows: 'raisedExcitedNatural' },
    surpreso: { eyes: 'surprised', mouth: 'screamOpen', eyebrows: 'raisedExcited' },
    sorridente: { eyes: 'squint', mouth: 'smile', eyebrows: 'defaultNatural' },
    pensativo: { eyes: 'side', mouth: 'serious', eyebrows: 'upDownNatural' },
    brincalhao: { eyes: 'winkWacky', mouth: 'tongue', eyebrows: 'raisedExcited' },
    determinado: { eyes: 'default', mouth: 'serious', eyebrows: 'flatNatural' },
  },
  menina: {
    alegre: { eyes: 'happy', mouth: 'smile', eyebrows: 'raisedExcitedNatural' },
    tranquilo: { eyes: 'closed', mouth: 'twinkle', eyebrows: 'defaultNatural' },
    curioso: { eyes: 'wink', mouth: 'smile', eyebrows: 'upDownNatural' },
    animado: { eyes: 'squint', mouth: 'tongue', eyebrows: 'raisedExcitedNatural' },
    delicado: { eyes: 'closed', mouth: 'smile', eyebrows: 'defaultNatural' },
    sonhadora: { eyes: 'hearts', mouth: 'twinkle', eyebrows: 'raisedExcitedNatural' },
    divertido: { eyes: 'winkWacky', mouth: 'tongue', eyebrows: 'upDownNatural' },
    surpreso: { eyes: 'surprised', mouth: 'screamOpen', eyebrows: 'raisedExcitedNatural' },
    sorridente: { eyes: 'squint', mouth: 'smile', eyebrows: 'raisedExcitedNatural' },
    pensativo: { eyes: 'side', mouth: 'twinkle', eyebrows: 'upDownNatural' },
    charmosa: { eyes: 'wink', mouth: 'twinkle', eyebrows: 'raisedExcitedNatural' },
    fofinha: { eyes: 'happy', mouth: 'tongue', eyebrows: 'defaultNatural' },
    estrelinha: { eyes: 'hearts', mouth: 'smile', eyebrows: 'raisedExcitedNatural' },
    timida: { eyes: 'closed', mouth: 'twinkle', eyebrows: 'sadConcernedNatural' },
  },
};

const ACCESSORY_MAP = {
  oculos: 'round',
  oculosQuadrado: 'prescription01',
  oculosClassico: 'prescription02',
  oculosLeve: 'kurt',
  oculosEstiloso: 'wayfarers',
  oculosSol: 'sunglasses',
  tapaOlho: 'eyepatch',
};

const HEADWEAR_MAP = {
  gorro: 'winterHat02',
  gorroListrado: 'winterHat1',
  gorroPompom: 'winterHat03',
  gorroAlto: 'winterHat04',
  hijab: 'hijab',
  turbante: 'turban',
  bone: 'hat',
  chapeu: 'hat',
};

const EXPRESSION_MAP = {
  idle: null,
  thinking: { eyes: 'side', mouth: 'serious', eyebrows: 'upDownNatural' },
  happy: { eyes: 'happy', mouth: 'smile', eyebrows: 'raisedExcitedNatural' },
  sad: { eyes: 'cry', mouth: 'sad', eyebrows: 'sadConcernedNatural' },
  happy1: { eyes: 'happy', mouth: 'smile', eyebrows: 'raisedExcitedNatural' },
  happy2: { eyes: 'hearts', mouth: 'smile', eyebrows: 'raisedExcitedNatural' },
  happy3: { eyes: 'squint', mouth: 'tongue', eyebrows: 'raisedExcitedNatural' },
  happy4: { eyes: 'wink', mouth: 'smile', eyebrows: 'raisedExcitedNatural' },
  wrong1: { eyes: 'cry', mouth: 'sad', eyebrows: 'sadConcernedNatural' },
  wrong2: { eyes: 'closed', mouth: 'concerned', eyebrows: 'sadConcernedNatural' },
  wrong3: { eyes: 'surprised', mouth: 'concerned', eyebrows: 'frownNatural' },
  wrong4: { eyes: 'eyeRoll', mouth: 'serious', eyebrows: 'sadConcernedNatural' },
};

function hex(value) {
  return value.replace('#', '');
}

function getMotion(expression, wiggle) {
  if (expression === 'happy' || String(expression).startsWith('happy')) {
    return { y: [0, -12, 0], rotate: [0, -3, 3, 0], scale: [1, 1.04, 1] };
  }
  if (expression === 'sad' || String(expression).startsWith('wrong')) {
    return { y: [0, 4, 0], rotate: [0, -2, 0] };
  }
  if (expression === 'thinking') {
    return { y: [0, -3, 0], rotate: [0, 2, 0] };
  }
  return { y: wiggle ? [0, -10, 0] : [0, -4, 0] };
}

export default function FullBodyCharacter({
  options = {},
  size = 200,
  animate = true,
  wiggle = false,
  expression = 'idle',
  bust = false,
  isFirefighter = false,
}) {
  const opts = { ...DEFAULT_CHARACTER, ...options };
  const gender = opts.gender === 'menina' ? 'menina' : 'menino';
  const skin = SKIN_OPTIONS.find(item => item.id === opts.skinColor)?.color || '#EDBE98';
  const hair = HAIR_COLORS.find(item => item.id === opts.hairColor)?.color || '#69402F';
  const selectedOutfit = OUTFIT_COLORS.find(item => item.id === opts.outfitColor)?.color || '#397BD1';
  const outfit = OUTFIT_STYLES.find(item => item.id === opts.outfitStyle) || OUTFIT_STYLES[0];
  const clothesColor = isFirefighter ? '#D8403A' : selectedOutfit;
  const genderFaces = FACE_MAP[gender];
  const face = EXPRESSION_MAP[expression] || genderFaces[opts.faceStyle] || genderFaces.alegre;
  const legacyAccessory = opts.accessory && opts.accessory !== 'nenhum' ? opts.accessory : null;
  const eyewearValue = opts.eyewear !== 'nenhum' ? opts.eyewear : legacyAccessory;
  const headwearValue = opts.headwear !== 'nenhum' ? opts.headwear : legacyAccessory;
  const headwear = HEADWEAR_MAP[headwearValue];
  const top = isFirefighter
    ? 'hat'
    : headwear || HAIR_MAP[opts.hairStyle]?.[gender] || HAIR_MAP.curto[gender];
  const accessory = ACCESSORY_MAP[eyewearValue];

  const dataUri = useMemo(() => {
    const avatar = createAvatar(avataaars, {
      seed: [`${gender}-${opts.skinColor}-${opts.hairStyle}-${opts.hairColor}`],
      backgroundColor: ['transparent'],
      radius: 0,
      scale: bust ? 108 : 96,
      translateY: bust ? 7 : 4,
      skinColor: [hex(skin)],
      hairColor: [hex(hair)],
      facialHairProbability: 0,
      top: [top],
      topProbability: 100,
      hatColor: [isFirefighter ? 'd8403a' : hex(selectedOutfit)],
      accessories: accessory ? [accessory] : ['round'],
      accessoriesProbability: accessory ? 100 : 0,
      accessoriesColor: ['44355b'],
      clothing: [outfit.clothing],
      clothesColor: [hex(clothesColor)],
      clothingGraphic: [outfit.graphic || 'bear'],
      eyes: [face.eyes],
      mouth: [face.mouth],
      eyebrows: [face.eyebrows],
    });
    return avatar.toDataUri();
  }, [
    accessory, bust, clothesColor, face.eyebrows, face.eyes, face.mouth, gender,
    hair, isFirefighter, opts.hairColor, opts.hairStyle, outfit.clothing, outfit.graphic,
    opts.skinColor, selectedOutfit, skin, top,
  ]);

  const motionState = getMotion(expression, wiggle);
  const happy = expression === 'happy' || String(expression).startsWith('happy');
  const sad = expression === 'sad' || String(expression).startsWith('wrong');

  return (
    <motion.div
      aria-label={`Personagem ${gender}`}
      animate={animate ? motionState : undefined}
      transition={{
        repeat: animate ? Infinity : 0,
        duration: happy ? 0.8 : sad ? 1.8 : 2.7,
        ease: 'easeInOut',
      }}
      style={{
        position: 'relative',
        width: size,
        height: bust ? size * 1.04 : size * 1.18,
        display: 'inline-flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        filter: 'drop-shadow(0 12px 18px rgba(25,16,48,.28))',
      }}
    >
      <img
        src={dataUri}
        alt=""
        width={size}
        height={bust ? size * 1.04 : size * 1.18}
        style={{ display: 'block', objectFit: 'contain', objectPosition: 'center bottom' }}
      />

      {expression === 'thinking' && (
        <motion.span
          animate={{ y: [0, -4, 0], rotate: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: '50%',
            background: '#fff',
            color: '#6c5ce7',
            display: 'grid',
            placeItems: 'center',
            fontSize: size * 0.16,
            fontWeight: 900,
            boxShadow: '0 5px 14px rgba(35,24,66,.25)',
          }}
        >
          ?
        </motion.span>
      )}
    </motion.div>
  );
}
