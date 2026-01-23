import { useEffect, useRef, useState } from "react";
import BeatProgressRing from "./BeatProgressRing";

export default function App() {
  // ===== Language =====
  const [lang, setLang] = useState("en"); // "ja" | "en"

  const TEXT = {
    ja: {
      title: "メトロノーム",
      themeToLight: "☀️ Light",
      themeToDark: "🌙 Dark",
      presetLabel: "音色プリセット",
      beats: "拍数",
      beatsHint: "（1〜60）",
      status: "状態",
      running: "再生中",
      stopped: "停止",
      start: "Start",
      stop: "Stop",
      langBtn: "EN",
    },
    en: {
      title: "Metronome",
      themeToLight: "☀️ Light",
      themeToDark: "🌙 Dark",
      presetLabel: "Sound Preset",
      beats: "Beats",
      beatsHint: "(1–60)",
      status: "Status",
      running: "Running",
      stopped: "Stopped",
      start: "Start",
      stop: "Stop",
      langBtn: "日本語",
    },
  };

  const t = (key) => TEXT[lang][key];

  // ===== Sound Presets =====
  const SOUND_PRESETS = {
    Precision: {
      label: "Precision",
      description: {
        ja: "硬質・精密(優しさと両立)",
        en: "Hard & precise (with gentleness)",
      },
      wave: "triangle",
      baseFreq: 850,
      accentFreq: 1200,
      attack: 0.0025,
      decay: 0.035,
      duration: 0.045,
      gain: 0.22,
      accentGain: 0.28,
      filter: {
        type: "lowpass",
        freq: 3200,
      },
      pitchDrop: 0,
    },
    Soft: {
      label: "Soft",
      description: {
        ja: "やわらか・耳に優しい(どこまでもあなたと)",
        en: "Soft & gentle (always with you)",
      },
      wave: "sine",
      baseFreq: 820,
      accentFreq: 1100,
      attack: 0.003,
      decay: 0.06,
      duration: 0.08,
      gain: 0.22,
      accentGain: 0.28,
      filter: { type: "lowpass", freq: 2800 },
      pitchDrop: 0.01,
    },
    Flow: {
      label: "Flow",
      description: {
        ja: "音楽的・流れる感じ(流れとともに)",
        en: "Musical flow (go with the stream)",
      },
      wave: "triangle",
      baseFreq: 780,
      accentFreq: 1040,
      attack: 0.004,
      decay: 0.07,
      duration: 0.09,
      gain: 0.2,
      accentGain: 0.27,
      filter: { type: "lowpass", freq: 2400 },
      pitchDrop: 0.02,
    },
    Groove: {
      label: "Groove",
      description: {
        ja: "ノリ・前に進む(体が揺れる)",
        en: "Momentum (your body moves)",
      },
      wave: "triangle",
      baseFreq: 720,
      accentFreq: 980,
      attack: 0.0035,
      decay: 0.075,
      duration: 0.1,
      gain: 0.21,
      accentGain: 0.26,
      filter: { type: "lowpass", freq: 2600 },
      pitchDrop: 0.05,
      accentPitchDrop: 0.035,
    },
    Rhythm: {
      label: "Rhythm",
      description: {
        ja: "重心・床(キックのように)",
        en: "Ground & weight (kick-like)",
      },
      wave: "triangle",
      baseFreq: 520,
      accentFreq: 820,
      attack: 0.002,
      decay: 0.065,
      duration: 0.085,
      gain: 0.24,
      accentGain: 0.3,
      filter: { type: "lowpass", freq: 1800 },
      pitchDrop: 0.065,
      accentPitchDrop: 0.03,
    },
    Orbit: {
      label: "Orbit",
      description: {
        ja: "没入・集中(深く潜る)",
        en: "Immersion & focus (dive deep)",
      },
      wave: "sine",
      baseFreq: 660,
      accentFreq: 990,
      attack: 0.006,
      decay: 0.1,
      duration: 0.12,
      gain: 0.18,
      accentGain: 0.24,
      filter: { type: "lowpass", freq: 2200 },
      pitchDrop: 0.03,
    },
  };

  const [soundPresetKey, setSoundPresetKey] = useState("Soft");

  const [bpm, setBpm] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  
  //ボリューム調節
  const [volume, setVolume] = useState(0.8); // 0..1
  const masterGainRef = useRef(null);


  // 表示用
  const [beat, setBeat] = useState(1);
  const [progress, setProgress] = useState(0); // 0..1（小節内）

  // ---- Audio & Scheduler refs ----
  const audioCtxRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const beatIndexRef = useRef(0); // 0..beatsPerBar-1
  const schedulerTimerRef = useRef(null);

  // 「最後に鳴らした拍の開始時刻」と「次の拍の時刻」
  const lastBeatStartTimeRef = useRef(0);
  const nextBeatTimeRef = useRef(0);

  // ダークモード
  const [isDark, setIsDark] = useState(true);

  const btnStyle = (enabled) => ({
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${
      isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"
    }`,
    background: enabled
      ? isDark
        ? "rgba(96,165,250,0.18)"
        : "rgba(37,99,235,0.12)"
      : isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.04)",
    color: "inherit",
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.6,
  });

  const ensureAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass();
  const ctx = audioCtxRef.current;

  if (!masterGainRef.current) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(volume, ctx.currentTime);
    g.connect(ctx.destination);
    masterGainRef.current = g;
  }

  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};


  // Click scheduler
  const scheduleClick = (time, isAccent) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const p = SOUND_PRESETS[soundPresetKey];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq = isAccent ? p.accentFreq : p.baseFreq;
    const peak = isAccent ? p.accentGain : p.gain;

    osc.type = p.wave;

    // ★ここ重要：accentPitchDrop を反映（今まで効いてなかったやつ）
    const drop =
      isAccent && typeof p.accentPitchDrop === "number"
        ? p.accentPitchDrop
        : p.pitchDrop;

    if (drop && drop > 0) {
      const startF = freq * (1 + drop);
      osc.frequency.setValueAtTime(startF, time);
      osc.frequency.exponentialRampToValueAtTime(
        freq,
        time + Math.max(0.006, p.attack * 3)
      );
    } else {
      osc.frequency.setValueAtTime(freq, time);
    }

    // Envelope
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + p.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + p.decay);

    // Filter
    let lastNode = osc;
    if (p.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = p.filter.type;
      filter.frequency.setValueAtTime(p.filter.freq, time);
      lastNode.connect(filter);
      lastNode = filter;
    }

    lastNode.connect(gain);
    gain.connect(masterGainRef.current ?? ctx.destination);

    osc.start(time);
    osc.stop(time + p.duration);
  };

  // requestAnimationFrame
  const rafRef = useRef(null);

  const scheduleAheadTime = 0.1; // 秒
  const lookahead = 25; // ms

  const advanceNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    lastBeatStartTimeRef.current = nextNoteTimeRef.current;
    nextNoteTimeRef.current += secondsPerBeat;
    nextBeatTimeRef.current = nextNoteTimeRef.current;

    beatIndexRef.current = (beatIndexRef.current + 1) % beatsPerBar;
  };

  const scheduler = () => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const isAccent = beatIndexRef.current === 0;
      const scheduledBeat = beatIndexRef.current + 1;

      scheduleClick(nextNoteTimeRef.current, isAccent);

      setBeat(scheduledBeat);
      advanceNote();
    }
  };

  const start = () => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    beatIndexRef.current = 0;
    setBeat(1);

    const startTime = ctx.currentTime + 0.05;
    nextNoteTimeRef.current = startTime;
    lastBeatStartTimeRef.current = startTime;
    nextBeatTimeRef.current = startTime + 60.0 / bpm;

    setProgress(0);
    setIsRunning(true);
  };

  const stop = () => {
    setIsRunning(false);
    setBeat(1);
    setProgress(0);
  };

  //volume変更
  useEffect(() => {
  const ctx = audioCtxRef.current;
  const mg = masterGainRef.current;
  if (!ctx || !mg) return;

  const now = ctx.currentTime;
  mg.gain.cancelScheduledValues(now);
  mg.gain.setValueAtTime(mg.gain.value, now);
  mg.gain.linearRampToValueAtTime(volume, now + 0.03);
}, [volume]);


  // scheduler開始/停止
  useEffect(() => {
    if (schedulerTimerRef.current) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    if (!isRunning) return;

    schedulerTimerRef.current = setInterval(scheduler, lookahead);

    return () => {
      if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
      }
    };
  }, [isRunning, bpm, beatsPerBar, soundPresetKey]);

  // ぬるぬるUI：AudioContextの時間に同期してprogressを更新
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (!isRunning) return;

    const loop = () => {
      const ctx = ensureAudioContext();
      if (ctx) {
        const now = ctx.currentTime;

        const startT = lastBeatStartTimeRef.current;
        const endT = nextBeatTimeRef.current;
        const beatSpan = Math.max(0.0001, endT - startT);

        const withinBeat = Math.min(
          1,
          Math.max(0, (now - startT) / beatSpan)
        );
        const barProgress = (beatIndexRef.current + withinBeat) / beatsPerBar;

        setProgress(barProgress);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isRunning, beatsPerBar, bpm]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: isDark ? "#0b0f14" : "#ffffff",
        color: isDark ? "#e6edf3" : "#111827",
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "92vw",
          padding: 28,
          fontFamily: "sans-serif",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,

          background: isDark ? "#0f172a" : "#f9fafb",
          border: isDark
            ? "1px solid rgba(255,255,255,0.10)"
            : "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          boxShadow: isDark
            ? "0 20px 60px rgba(0,0,0,0.45)"
            : "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        <h1>{t("title")}</h1>

        {/* Top controls */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setIsDark((v) => !v)}
            style={{
              marginTop: 6,
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${
                isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"
              }`,
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {isDark ? t("themeToLight") : t("themeToDark")}
          </button>

          <button
            onClick={() => setLang((v) => (v === "ja" ? "en" : "ja"))}
            style={{
              marginTop: 6,
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${
                isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"
              }`,
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {t("langBtn")}
          </button>
        </div>

        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>
          {t("presetLabel")}
        </div>

        <select
          value={soundPresetKey}
          onChange={(e) => setSoundPresetKey(e.target.value)}
          disabled={isRunning}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${
              isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"
            }`,
            background: isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.9)",
            color: isDark ? "white" : "#111827",
            outline: "none",
          }}
        >
          {Object.entries(SOUND_PRESETS).map(([key, v]) => (
            <option key={key} value={key}>
              {v.label} — {v.description[lang]}
            </option>
          ))}
        </select>

        <BeatProgressRing
          progress={progress}
          beatsPerBar={beatsPerBar}
          currentBeat={beat}
        />

        <div style={{ fontSize: 22 }}>
          BPM: <strong>{bpm}</strong>
        </div>

        <input
          type="range"
          min={40}
          max={240}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          style={{
            width: 320,
            accentColor: isDark ? "#60a5fa" : "#2563eb",
          }}
        />
        
        <div style={{ fontSize: 14, opacity: 0.85, marginTop: 6 }}>
        Volume: <strong>{Math.round(volume * 100)}%</strong>
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{
          width: 320,
          accentColor: isDark ? "#60a5fa" : "#2563eb",
          }}
        />
        <div>
          <label>
            {t("beats")}:
            <input
              type="number"
              min={1}
              max={60}
              step={1}
              value={beatsPerBar}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isInteger(v) && v >= 1 && v <= 60)
                  setBeatsPerBar(v);
              }}
              style={{ marginLeft: 8, width: 70 }}
            />
          </label>
          <span
            style={{
              marginLeft: 8,
              color: isDark ? "rgba(230,237,243,0.65)" : "#6b7280",
            }}
          >
            {t("beatsHint")}
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={start} disabled={isRunning} style={btnStyle(!isRunning)}>
            {t("start")}
          </button>
          <button onClick={stop} disabled={!isRunning} style={btnStyle(isRunning)}>
            {t("stop")}
          </button>
        </div>

        <div>
          {t("status")}:{" "}
          <strong>{isRunning ? t("running") : t("stopped")}</strong>
        </div>
      </div>
    </div>
  );
}
