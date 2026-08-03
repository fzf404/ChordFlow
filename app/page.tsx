"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Song = {
  title: string;
  artist: string;
  genre: "华语流行" | "民谣" | "经典";
  key: string;
  bpm: number;
  level: string;
  color: string;
  chords: { name: string; notes: string[] }[];
};

const chordNotes: Record<string, string[]> = {
  C: ["C4", "E4", "G4"], D: ["D4", "F#4", "A4"], Dm: ["D4", "F4", "A4"],
  Em: ["E4", "G4", "B4"], E7: ["E4", "G#4", "B4", "D5"], F: ["F3", "A3", "C4"],
  G: ["G3", "B3", "D4"], G7: ["G3", "B3", "D4", "F4"], Am: ["A3", "C4", "E4"],
  Am7: ["A3", "C4", "E4", "G4"], Cmaj7: ["C4", "E4", "G4", "B4"],
};

const progression = (...names: string[]) => names.map(name => ({ name, notes: chordNotes[name] }));

const songs: Song[] = [
  { title: "晴天", artist: "周杰伦", genre: "华语流行", key: "G 大调", bpm: 72, level: "新手", color: "#d6ff62", chords: progression("G", "D", "Em", "C", "G", "D", "C", "D") },
  { title: "稻香", artist: "周杰伦", genre: "华语流行", key: "C 大调", bpm: 82, level: "新手", color: "#ffd86b", chords: progression("C", "G", "Am", "F", "C", "G", "F", "G") },
  { title: "告白气球", artist: "周杰伦", genre: "华语流行", key: "C 大调", bpm: 84, level: "进阶", color: "#ff9ac6", chords: progression("C", "G", "Am", "Em", "F", "C", "Dm", "G") },
  { title: "小幸运", artist: "田馥甄", genre: "华语流行", key: "G 大调", bpm: 72, level: "新手", color: "#9ee7ff", chords: progression("G", "D", "Em", "C", "G", "D", "C", "D") },
  { title: "后来", artist: "刘若英", genre: "经典", key: "C 大调", bpm: 70, level: "新手", color: "#c7b8ff", chords: progression("C", "G", "Am", "Em", "F", "C", "Dm", "G") },
  { title: "童话", artist: "光良", genre: "经典", key: "C 大调", bpm: 68, level: "新手", color: "#9bd8ff", chords: progression("C", "G", "Am", "Em", "F", "C", "Dm", "G") },
  { title: "平凡之路", artist: "朴树", genre: "华语流行", key: "G 大调", bpm: 76, level: "新手", color: "#ffb783", chords: progression("Em", "C", "G", "D", "Em", "C", "G", "D") },
  { title: "夜空中最亮的星", artist: "逃跑计划", genre: "华语流行", key: "C 大调", bpm: 74, level: "新手", color: "#6fc8ff", chords: progression("C", "G", "Am", "F", "C", "G", "F", "G") },
  { title: "成都", artist: "赵雷", genre: "民谣", key: "C 大调", bpm: 66, level: "进阶", color: "#e8a46a", chords: progression("C", "Em", "F", "G", "C", "Am", "Dm", "G") },
  { title: "那些年", artist: "胡夏", genre: "华语流行", key: "C 大调", bpm: 76, level: "进阶", color: "#b4e8a3", chords: progression("C", "G", "Am", "Em", "F", "C", "Dm", "G") },
  { title: "海阔天空", artist: "Beyond", genre: "经典", key: "C 大调", bpm: 72, level: "进阶", color: "#93aaff", chords: progression("C", "G", "Am", "Em", "F", "C", "Dm", "G") },
  { title: "月亮代表我的心", artist: "邓丽君", genre: "经典", key: "C 大调", bpm: 64, level: "新手", color: "#f6e38a", chords: progression("C", "Em", "F", "G", "C", "Am", "Dm", "G7") },
  { title: "起风了", artist: "买辣椒也用券", genre: "华语流行", key: "C 大调", bpm: 82, level: "进阶", color: "#90dec8", chords: progression("C", "G", "Am", "Em", "F", "C", "F", "G") },
  { title: "红豆", artist: "王菲", genre: "经典", key: "C 大调", bpm: 68, level: "进阶", color: "#e88b9c", chords: progression("F", "G", "Em", "Am", "Dm", "G", "C", "Cmaj7") },
];

const whiteNotes = ["C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5","B5","C6"];
const blackNotes = ["C#3","D#3","F#3","G#3","A#3","C#4","D#4","F#4","G#4","A#4","C#5","D#5","F#5","G#5","A#5"];
const keyboardMap: Record<string,string> = { a:"C4", w:"C#4", s:"D4", e:"D#4", d:"E4", f:"F4", t:"F#4", g:"G4", y:"G#4", h:"A4", u:"A#4", j:"B4", k:"C5" };
const noteSemitone: Record<string,number> = { C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11 };

function noteFrequency(note: string) {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  const midi = (Number(match[2]) + 1) * 12 + noteSemitone[match[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export default function Home() {
  const [songIndex, setSongIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [tempo, setTempo] = useState(songs[0].bpm);
  const [muted, setMuted] = useState(false);
  const [genre, setGenre] = useState<"全部" | Song["genre"]>("全部");
  const [query, setQuery] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const song = songs[songIndex];
  const chord = song.chords[step];
  const nextChord = song.chords[(step + 1) % song.chords.length];

  const playNote = useCallback((note: string, duration = .7) => {
    setActiveNotes(prev => prev.includes(note) ? prev : [...prev, note]);
    window.setTimeout(() => setActiveNotes(prev => prev.filter(n => n !== note)), duration * 800);
    if (muted) return;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audioRef.current || new AudioCtx();
    audioRef.current = ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = noteFrequency(note);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.16, now + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + duration + .05);
  }, [muted]);

  const playChord = useCallback(() => chord.notes.forEach((n, i) => window.setTimeout(() => playNote(n, 1.1), i * 45)), [chord, playNote]);

  useEffect(() => {
    if (!playing) return;
    playChord();
    const id = window.setInterval(() => setStep(current => (current + 1) % song.chords.length), (60000 / tempo) * 4);
    return () => window.clearInterval(id);
  }, [playing, song, tempo, playChord]);

  useEffect(() => { if (playing) playChord(); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.repeat || !keyboardMap[event.key.toLowerCase()]) return;
      playNote(keyboardMap[event.key.toLowerCase()]);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [playNote]);

  const activeSet = useMemo(() => new Set([...activeNotes, ...chord.notes]), [activeNotes, chord.notes]);
  const visibleSongs = songs.filter(item => (genre === "全部" || item.genre === genre) && `${item.title}${item.artist}`.toLowerCase().includes(query.toLowerCase()));

  const keyCenter = (note: string) => {
    const clean = note.replace(/\d/, "");
    const octave = Number(note.slice(-1));
    if (!clean.includes("#")) {
      const within = ["C", "D", "E", "F", "G", "A", "B"].indexOf(clean);
      return ((octave - 3) * 7 + within + .5) / whiteNotes.length;
    }
    const base = noteSemitone[clean];
    const boundary = (octave - 3) * 7 + (base === 1 ? 1 : base === 3 ? 2 : base === 6 ? 4 : base === 8 ? 5 : 6);
    return boundary / whiteNotes.length;
  };

  const laneLeft = (note: string) => {
    const ratio = keyCenter(note);
    return `calc(${ratio * 100}% + ${18 - ratio * 36}px)`;
  };

  const chooseSong = (index: number) => {
    setSongIndex(index); setStep(0); setTempo(songs[index].bpm); setPlaying(false);
  };

  return (
    <main className="app-shell">
      <nav className="topbar">
        <button className="brand" aria-label="ChordFlow 首页"><span className="brand-mark">♩</span><span>Chord<span>Flow</span></span></button>
        <div className="nav-center"><button className="nav-active">练习室</button><button>和弦库</button><button>我的进度</button></div>
        <div className="nav-actions"><button className="icon-btn" aria-label="切换声音" onClick={() => setMuted(!muted)}>{muted ? "♩̸" : "♪"}</button><div className="avatar">F</div></div>
      </nav>

      <section className="workspace">
        <aside className="song-panel">
          <div className="panel-heading"><div><span className="eyebrow">选择练习</span><h1>今天弹什么？</h1></div><button className="round-btn">＋</button></div>
          <label className="search"><span>⌕</span><input aria-label="搜索歌曲" placeholder="搜索歌曲或歌手" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <div className="filters">{(["全部", "华语流行", "民谣", "经典"] as const).map(item => <button key={item} className={genre === item ? "selected" : ""} onClick={() => setGenre(item)}>{item}</button>)}</div>
          <div className="song-list">
            {visibleSongs.map(item => { const index = songs.indexOf(item); return <button key={item.title} className={`song-card ${index === songIndex ? "current" : ""}`} onClick={() => chooseSong(index)}>
              <span className="cover" style={{"--cover": item.color} as React.CSSProperties}><i>♪</i></span>
              <span className="song-copy"><strong>{item.title}</strong><small>{item.artist} · {item.level}</small></span>
              <span className="song-key">{item.key.split(" ")[0]}</span>
            </button>})}
          </div>
          <div className="daily-card"><span className="streak">◔</span><div><strong>连续练习 3 天</strong><small>再弹 8 分钟完成今日目标</small><div className="progress"><i /></div></div></div>
        </aside>

        <section className="stage">
          <header className="stage-header">
            <div><span className="eyebrow">正在练习 · 新手简化版</span><h2>{song.title}</h2><p>{song.artist} <i /> {song.key} <i /> 4/4 拍</p></div>
            <div className="stage-actions"><button>移调 <b>0</b></button><button>节拍器 <b>{tempo}</b></button><button className="dots">•••</button></div>
          </header>

          <div className="lesson-card">
            <div className="chord-strip">
              {song.chords.map((item, index) => <button key={`${item.name}-${index}`} className={index === step ? "active" : ""} onClick={() => { setStep(index); setPlaying(false); }}><span>{index === step ? "现在" : index === (step + 1) % song.chords.length ? "下一个" : `${index + 1}`}</span><strong>{item.name}</strong><small>{item.notes.map(n => n.replace(/\d/, "")).join(" · ")}</small></button>)}
            </div>

            <div className="falling-zone">
              <div className="beat-grid"><i/><i/><i/><i/></div>
              <div className="now-line"><span>现在</span></div>
              {chord.notes.map((note, i) => <div key={note} className={`falling-note n${i + 1}`} style={{ left: laneLeft(note), animationPlayState: playing ? "running" : "paused" }}><strong>{note.replace(/\d/, "")}</strong><small>{i === 0 ? "左手" : "右手"}</small></div>)}
              <div className="chord-focus"><span>当前和弦</span><strong>{chord.name}</strong><small>{chord.notes.join(" · ")}</small></div>
              <div className="next-hint">接下来 <strong>{nextChord.name}</strong></div>
            </div>

            <div className="transport">
              <div className="speed"><span>慢</span><input aria-label="速度" type="range" min="50" max="120" value={tempo} onChange={e => setTempo(Number(e.target.value))}/><span>快</span></div>
              <div className="main-controls"><button aria-label="上一个和弦" onClick={() => setStep((step - 1 + song.chords.length) % song.chords.length)}>↶</button><button className="play" aria-label={playing ? "暂停" : "播放"} onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ" : "▶"}</button><button aria-label="下一个和弦" onClick={() => setStep((step + 1) % song.chords.length)}>↷</button></div>
              <button className="loop">↻ 循环</button>
            </div>

            <div className="piano-wrap">
              <div className="keyboard-help"><span><i className="left-dot"/>左手</span><span><i className="right-dot"/>右手</span><small>也可以用电脑键盘 A–K 弹奏</small></div>
              <div className="piano" role="group" aria-label="可弹奏钢琴键盘">
                {whiteNotes.map(note => <button key={note} aria-label={`弹奏 ${note}`} onPointerDown={() => playNote(note)} className={`white-key ${activeSet.has(note) ? "lit" : ""}`}><span>{activeSet.has(note) ? note.replace(/\d/, "") : ""}</span></button>)}
                {blackNotes.map(note => { const base = noteSemitone[note.replace(/\d/, "")]; const octave = Number(note.slice(-1)); const cIndex = (octave - 3) * 7 + ([1,3].includes(base) ? (base === 1 ? 0 : 1) : base === 6 ? 3 : base === 8 ? 4 : 5); return <button key={note} aria-label={`弹奏 ${note}`} onPointerDown={() => playNote(note)} className={`black-key ${activeSet.has(note) ? "lit" : ""}`} style={{ left: `calc(${((cIndex + 1) / whiteNotes.length) * 100}% - 14px)` }}><span>{activeSet.has(note) ? note.replace(/\d/, "") : ""}</span></button> })}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
