'use client';
import { useEffect, useRef, useState } from 'react';
import { THEMES, DEFAULTS } from '@/lib/defaults';

export default function Proposal({ p }) {
  const t = { ...DEFAULTS, ...Object.fromEntries(Object.entries(p).filter(([, v]) => v)) };
  const [step, setStep] = useState('ask');
  const [noCount, setNoCount] = useState(0);
  const [pos, setPos] = useState(null);
  const [hearts, setHearts] = useState([]);
  const [burst, setBurst] = useState([]);
  const [playing, setPlaying] = useState(false);
  const vid = useRef(null);

  useEffect(() => {
    setHearts(Array.from({ length: 26 }, (_, i) => ({
      i, left: Math.random() * 100, size: 14 + Math.random() * 28,
      dur: 7 + Math.random() * 8, delay: -Math.random() * 12, e: ['❤️', '💖', '💜', '💗', '🌸'][i % 5],
    })));
  }, []);

  const dodge = () => {
    setNoCount((c) => c + 1);
    setPos({ x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 });
  };
  const yes = () => {
    setBurst(Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2, d = 120 + Math.random() * 180;
      return { i, dx: Math.cos(a) * d, dy: Math.sin(a) * d, e: ['❤️', '💖', '💗', '💜'][i % 4] };
    }));
    setStep('yay');
    setTimeout(() => setStep('video'), 2600);
  };
  const toggle = () => {
    const v = vid.current; if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-5 text-white text-center"
      style={{ background: (THEMES[t.theme] || THEMES.rose).bg }}>
      {hearts.map((h) => (
        <span key={h.i} className="pointer-events-none fixed top-0 select-none"
          style={{ left: `${h.left}%`, fontSize: h.size, animation: `floatUp ${h.dur}s linear ${h.delay}s infinite` }}>{h.e}</span>
      ))}

      {step === 'ask' && (
        <section className="glass relative z-10 w-full max-w-md rounded-3xl p-7 pop">
          <div className="text-5xl beat mb-4">💌</div>
          <h1 className="text-2xl font-bold leading-relaxed mb-4">{t.intro}</h1>
          <p className="text-xl leading-relaxed mb-8">{t.question}</p>
          <div className="flex items-center justify-center gap-4 min-h-[56px]">
            <button onClick={yes} className="px-8 py-3 rounded-full bg-white text-pink-600 font-bold text-lg shadow-lg active:scale-95 transition hover:scale-105 beat">{t.yes_label}</button>
            <button onClick={dodge}
              style={pos ? { position: 'fixed', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)', zIndex: 20 } : {}}
              className="px-8 py-3 rounded-full bg-purple-900/60 font-bold text-lg shadow-lg transition-all duration-300">{t.no_label}</button>
          </div>
          {noCount >= 3 && <p className="mt-6 text-lg pop">{t.no_hint}</p>}
        </section>
      )}

      {step === 'yay' && (
        <section className="relative z-10">
          {burst.map((b) => (
            <span key={b.i} className="fixed left-1/2 top-1/2 text-3xl pointer-events-none"
              style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, animation: 'burst 1.8s ease-out forwards' }}>{b.e}</span>
          ))}
          <div className="text-8xl beat">❤️</div>
          <h1 className="text-4xl font-bold mt-6 pop">{t.yay_text}</h1>
        </section>
      )}

      {step === 'video' && (
        <section className="glass relative z-10 w-full max-w-md rounded-3xl p-5 pop">
          <h1 className="text-2xl font-bold leading-relaxed mb-4">{t.teaser}</h1>
          <video ref={vid} src={p.video_url} playsInline preload="metadata" controls
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
            className="w-full rounded-2xl bg-black max-h-[65vh]" />
          <button onClick={toggle} className="mt-4 px-8 py-3 rounded-full bg-white text-pink-600 font-bold shadow-lg active:scale-95 transition">
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
        </section>
      )}
    </main>
  );
        }
