export const playSound = (type) => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const note = (freq, t, dur, vol = 0.28, wave = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = wave; osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur + 0.05);
    };
    if (type === 'correct') {
      note(523,0,0.12); note(659,0.1,0.12); note(784,0.2,0.12); note(1047,0.3,0.45);
    } else if (type === 'wrong') {
      note(349,0,0.22,0.22,'sawtooth'); note(311,0.2,0.22,0.22,'sawtooth'); note(261,0.4,0.4,0.22,'sawtooth');
    } else if (type === 'click') {
      note(880,0,0.06,0.12);
    } else if (type === 'start') {
      [523,587,659,784,880,1047].forEach((f,i) => note(f, i*0.09, 0.18, 0.2));
    } else if (type === 'victory') {
      [523,523,523,415,523,659,784].forEach((f,i) => note(f, i*0.13, 0.2, 0.25));
      note(1047, 0.13*7, 0.6, 0.3);
    }
  } catch (_) {}
};
