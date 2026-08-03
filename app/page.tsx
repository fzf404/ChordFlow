"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Midi } from "@tonejs/midi";

type CatalogSong = { id:string; title:string; artist:string; tone:string; color:string };
type PianoNote = { midi:number; name:string; time:number; duration:number; velocity:number; hand:"left"|"right" };
type ChordMark = { start:number; end:number; name:string };
type SongData = { duration:number; bpm:number; notes:PianoNote[]; melody:PianoNote[]; chords:ChordMark[] };

const catalog:CatalogSong[] = [
  {id:"516",title:"晴天",artist:"周杰伦",tone:"G",color:"#d8ff62"},
  {id:"330",title:"小幸运",artist:"田馥甄",tone:"G",color:"#8ee8ff"},
  {id:"346",title:"平凡之路",artist:"朴树",tone:"A",color:"#f0ad73"},
  {id:"274",title:"夜空中最亮的星",artist:"逃跑计划",tone:"B",color:"#73b8ff"},
  {id:"412",title:"成都",artist:"赵雷",tone:"C",color:"#e79a65"},
  {id:"714",title:"红豆",artist:"王菲",tone:"F",color:"#eb88a9"},
  {id:"823",title:"那些年",artist:"胡夏",tone:"G",color:"#a4df8d"},
  {id:"526",title:"月亮代表我的心",artist:"张国荣",tone:"C",color:"#f1dc7d"},
];

const NOTE_NAMES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const MIN_MIDI=36, MAX_MIDI=96;
const SAMPLE_MIDIS=[33,36,39,42,45,48,51,54,57,60,63,66,69,72,75,78,81,84,87,90,93,96,99,102,105,108];
const sampleFile=(m:number)=>`${NOTE_NAMES[m%12].replace("#","%23")}${Math.floor(m/12)-1}v6.mp3`;
const nearestSample=(m:number)=>SAMPLE_MIDIS.reduce((best,n)=>Math.abs(n-m)<Math.abs(best-m)?n:best,SAMPLE_MIDIS[0]);
const whiteMidis=Array.from({length:MAX_MIDI-MIN_MIDI+1},(_,i)=>MIN_MIDI+i).filter(m=>![1,3,6,8,10].includes(m%12));
const blackMidis=Array.from({length:MAX_MIDI-MIN_MIDI+1},(_,i)=>MIN_MIDI+i).filter(m=>[1,3,6,8,10].includes(m%12));
const midiName=(m:number)=>`${NOTE_NAMES[m%12]}${Math.floor(m/12)-1}`;
const keyX=(m:number)=>{
  const whiteIndex=whiteMidis.indexOf(m);
  if(whiteIndex>=0)return(whiteIndex+.5)/whiteMidis.length;
  const before=whiteMidis.filter(w=>w<m).length;
  return before/whiteMidis.length;
};
const fmt=(seconds:number)=>`${Math.floor(seconds/60)}:${Math.floor(seconds%60).toString().padStart(2,"0")}`;
const chordLabel=(raw:string)=>raw==="N"?"—":raw.replace(":maj","").replace(":min","m").replace(":7","7");

export default function Home(){
  const [songIndex,setSongIndex]=useState(0);
  const [data,setData]=useState<SongData|null>(null);
  const [loading,setLoading]=useState(true);
  const [playing,setPlaying]=useState(false);
  const [currentTime,setCurrentTime]=useState(0);
  const [speed,setSpeed]=useState(1);
  const [activeNotes,setActiveNotes]=useState<number[]>([]);
  const [lyrics,setLyrics]=useState<string[]>([]);
  const [melodyEnabled,setMelodyEnabled]=useState(true);
  const [lyricsEnabled,setLyricsEnabled]=useState(true);
  const [panel,setPanel]=useState<"guide"|"data">("guide");
  const audioRef=useRef<AudioContext|null>(null);
  const sampleBytesRef=useRef(new Map<number,ArrayBuffer>());
  const sampleBuffersRef=useRef(new Map<number,AudioBuffer>());
  const startRef=useRef(0);
  const startTimeRef=useRef(0);
  const hiddenAtRef=useRef<number|null>(null);
  const playedRef=useRef(new Set<string>());
  const song=catalog[songIndex];

  useEffect(()=>{
    SAMPLE_MIDIS.forEach(m=>fetch(`/audio/piano/${sampleFile(m)}`).then(r=>r.arrayBuffer()).then(b=>sampleBytesRef.current.set(m,b)).catch(()=>undefined));
  },[]);

  const playTone=useCallback(async(midi:number,duration=.45,velocity=.6)=>{
    const Ctx=window.AudioContext||(window as typeof window&{webkitAudioContext:typeof AudioContext}).webkitAudioContext;
    const ctx=audioRef.current||new Ctx(); audioRef.current=ctx;
    if(ctx.state==="suspended")await ctx.resume();
    const sample=nearestSample(midi);
    let buffer=sampleBuffersRef.current.get(sample);
    if(!buffer){
      const bytes=sampleBytesRef.current.get(sample)??await fetch(`/audio/piano/${sampleFile(sample)}`).then(r=>r.arrayBuffer());
      buffer=await ctx.decodeAudioData(bytes.slice(0));sampleBuffersRef.current.set(sample,buffer);
    }
    const source=ctx.createBufferSource(),gain=ctx.createGain(),now=ctx.currentTime,release=Math.min(4,Math.max(1.2,duration+1.8));
    source.buffer=buffer;source.playbackRate.value=Math.pow(2,(midi-sample)/12);
    gain.gain.setValueAtTime(Math.max(.04,.42*velocity),now);gain.gain.exponentialRampToValueAtTime(.0001,now+release);
    source.connect(gain).connect(ctx.destination);source.start(now);source.stop(now+release+.05);
    setActiveNotes(p=>p.includes(midi)?p:[...p,midi]);window.setTimeout(()=>setActiveNotes(p=>p.filter(n=>n!==midi)),Math.min(duration,1)*800);
  },[]);

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setLoading(true);setPlaying(false);setCurrentTime(0);playedRef.current.clear();
      const base=`/data/pop909/${song.id}`;
      const [buffer,chordText]=await Promise.all([fetch(`${base}/${song.id}.mid`).then(r=>r.arrayBuffer()),fetch(`${base}/chord_midi.txt`).then(r=>r.text())]);
      const midi=new Midi(buffer);
      const piano=midi.tracks.find(t=>t.name.toUpperCase()==="PIANO")??midi.tracks.at(-1);
      const melody=midi.tracks.find(t=>t.name.toUpperCase()==="MELODY");
      const mapNotes=(notes:typeof piano.notes):PianoNote[]=>notes.filter(n=>n.midi>=MIN_MIDI&&n.midi<=MAX_MIDI).map(n=>({midi:n.midi,name:n.name,time:n.time,duration:n.duration,velocity:n.velocity,hand:n.midi<60?"left":"right"}));
      const chords=chordText.trim().split(/\r?\n/).map(line=>{const [start,end,name]=line.split(/\s+/);return{start:Number(start),end:Number(end),name};});
      if(!cancelled)setData({duration:midi.duration,bpm:midi.header.tempos[0]?.bpm??72,notes:mapNotes(piano?.notes??[]),melody:mapNotes(melody?.notes??[]),chords});
      if(!cancelled)setLoading(false);
    }
    load();return()=>{cancelled=true};
  },[song.id]);

  useEffect(()=>{
    if(!playing||!data)return;
    startRef.current=performance.now();startTimeRef.current=currentTime;
    let frame=0,lastTime=currentTime;
    const tick=()=>{
      const next=Math.min(data.duration,startTimeRef.current+(performance.now()-startRef.current)/1000*speed);
      setCurrentTime(next);
      const scheduleFrom=next-lastTime>.2?next-.04:lastTime-.02;
      data.notes.filter(n=>n.time>scheduleFrom&&n.time<=next+.035).forEach(n=>{const key=`${n.time}-${n.midi}`;if(!playedRef.current.has(key)){playedRef.current.add(key);playTone(n.midi,n.duration/speed,n.velocity)}});
      if(melodyEnabled)data.melody.filter(n=>n.time>scheduleFrom&&n.time<=next+.035).forEach(n=>{const key=`melody-${n.time}-${n.midi}`;if(!playedRef.current.has(key)){playedRef.current.add(key);playTone(n.midi,n.duration/speed,Math.min(1,n.velocity*1.12))}});
      lastTime=next;
      if(next>=data.duration)setPlaying(false);else frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[playing,data,speed,playTone,melodyEnabled]);

  useEffect(()=>{
    const onVisibility=()=>{
      if(document.hidden){hiddenAtRef.current=performance.now();return}
      if(hiddenAtRef.current!==null){
        if(playing)startRef.current+=performance.now()-hiddenAtRef.current;
        hiddenAtRef.current=null;
      }
    };
    document.addEventListener("visibilitychange",onVisibility);
    return()=>document.removeEventListener("visibilitychange",onVisibility);
  },[playing]);

  const seek=(time:number)=>{setPlaying(false);setCurrentTime(Math.max(0,Math.min(data?.duration??0,time)));playedRef.current.clear()};
  const currentChord=data?.chords.find(c=>currentTime>=c.start&&currentTime<c.end);
  const nextChord=data?.chords.find(c=>c.start>(currentChord?.start??currentTime));
  const visibleNotes=useMemo(()=>data?.notes.filter(n=>n.time>=currentTime-.12&&n.time<=currentTime+4.2).slice(0,60)??[],[data,currentTime]);
  const visibleMelody=useMemo(()=>melodyEnabled?(data?.melody.filter(n=>n.time>=currentTime-.12&&n.time<=currentTime+4.2).slice(0,30)??[]):[],[data,currentTime,melodyEnabled]);
  const sections=useMemo(()=>{const d=data?.duration??240;return[{name:"前奏",at:0},{name:"主歌",at:d*.12},{name:"副歌",at:d*.34},{name:"间奏",at:d*.52},{name:"第二段",at:d*.63},{name:"尾奏",at:d*.9}]},[data]);
  const currentSection=sections.slice().reverse().find(s=>currentTime>=s.at)?.name??"前奏";

  const importLrc=async(file?:File)=>{
    if(!file)return;const text=await file.text();setLyrics(text.split(/\r?\n/).map(l=>l.replace(/^\[[^\]]+\]/,"").trim()).filter(Boolean));
  };

  return <main className="cf-app">
    <header className="cf-topbar"><div className="cf-logo"><i>♪</i><span>Chord<b>Flow</b></span></div><div className="source-badge"><span/>POP909 实谱数据</div></header>
    <div className="cf-layout">
      <aside className="library">
        <div className="library-title"><span>专业钢琴数据集</span><h1>选择一首歌</h1><p>8 首真实 MIDI 编配 · 非猜测和弦</p></div>
        <div className="song-list">{catalog.map((item,index)=><button key={item.id} className={songIndex===index?"selected":""} onClick={()=>setSongIndex(index)}><i style={{"--song-color":item.color} as React.CSSProperties}>♪</i><span><strong>{item.title}</strong><small>{item.artist}</small></span><em>{item.tone}</em></button>)}</div>
        <div className="data-credit"><strong>数据与音源</strong><p>POP909 Dataset · ISMIR 2020</p><small>钢琴音色：Salamander Grand Piano V3，Alexander Holm，CC BY 3.0。</small></div>
      </aside>

      <section className="studio">
        <div className="song-head"><div><span className="kicker">现在练习 · {currentSection}</span><h2>{song.title}</h2><p>{song.artist} · {data?`${Math.round(data.bpm)} BPM`:"载入中"} · {song.tone} 调</p></div><div className="head-stats"><span><small>数据编号</small>#{song.id}</span><span><small>总时长</small>{data?fmt(data.duration):"--:--"}</span></div></div>

        <div className="player-card">
          <div className="section-nav"><span>歌曲结构</span>{sections.map(s=><button key={s.name} className={currentSection===s.name?"active":""} onClick={()=>seek(s.at)}><strong>{s.name}</strong><small>{fmt(s.at)}</small></button>)}</div>
          <div className="chord-row"><div className="current-chord"><span>当前和弦</span><strong>{chordLabel(currentChord?.name??"N")}</strong></div>{data?.chords.filter(c=>c.start>=currentTime-.1).slice(0,7).map((c,i)=><button key={`${c.start}-${i}`} className={i===0?"active":""} onClick={()=>seek(c.start)}><small>{fmt(c.start)}</small><strong>{chordLabel(c.name)}</strong></button>)}<div className="next-chord">下一个 <b>{chordLabel(nextChord?.name??"N")}</b></div></div>

          <div className="learn-grid">
            <aside className="lesson-panel">
              <div className="panel-tabs"><button className={panel==="guide"?"active":""} onClick={()=>setPanel("guide")}>跟弹指引</button><button className={panel==="data"?"active":""} onClick={()=>setPanel("data")}>数据详情</button></div>
              {panel==="guide"?<>
                <div className="track-switches"><button className={melodyEnabled?"on":""} aria-pressed={melodyEnabled} onClick={()=>{setPlaying(false);playedRef.current.clear();setMelodyEnabled(v=>!v)}}><span><i/>旋律</span><b>{melodyEnabled?"已开启":"已关闭"}</b></button><button className={lyricsEnabled?"on":""} aria-pressed={lyricsEnabled} onClick={()=>setLyricsEnabled(v=>!v)}><span><i/>歌词</span><b>{lyricsEnabled?"已开启":"已关闭"}</b></button></div>
                <div className="howto"><span>1</span><p><strong>点击播放</strong>音符从上方向琴键移动</p></div><div className="howto"><span>2</span><p><strong>按颜色分手</strong><i className="lh"/>低音区左手 <i className="rh"/>高音区右手</p></div><div className="howto"><span>3</span><p><strong>到达线时弹下</strong>键盘会同步高亮</p></div>
                {melodyEnabled&&<div className="melody-status"><i/><span><strong>旋律轨正在播放</strong><small>紫色音符会落到对应琴键</small></span></div>}
                {lyricsEnabled&&<div className="lyrics-box">{lyrics.length?<><small>当前歌词</small><strong>{lyrics[Math.floor(currentTime/4)%lyrics.length]}</strong></>:<><small>歌词轨已开启</small><strong>导入 LRC 后随播放显示</strong><p>请选择你拥有使用权的歌词文件。</p></>}<label>＋ 导入 LRC<input type="file" accept=".lrc,.txt" onChange={e=>importLrc(e.target.files?.[0])}/></label></div>}
              </>:<div className="data-panel"><dl><div><dt>钢琴音符</dt><dd>{data?.notes.length??0}</dd></div><div><dt>旋律音符</dt><dd>{data?.melody.length??0}</dd></div><div><dt>和弦标记</dt><dd>{data?.chords.length??0}</dd></div><div><dt>左右手规则</dt><dd>C4 分区</dd></div></dl><p>低于 C4 的伴奏音分配给左手，高于或等于 C4 的伴奏音分配给右手。你看到的是 MIDI 中实际出现的音，而不是根据和弦名称生成的音。</p></div>}
            </aside>

            <div className="performance">
              <div className="roll-and-keys">
                <div className="piano-roll">
                  <div className="roll-grid">{whiteMidis.map(m=><i key={m} style={{left:`${keyX(m)*100}%`}}/>)}</div><div className="hit-line"><span>现在弹</span></div>
                  {visibleNotes.map((n,i)=>{const delta=n.time-currentTime;return <div key={`${n.time}-${n.midi}-${i}`} className={`midi-note ${n.hand}`} style={{left:`${keyX(n.midi)*100}%`,top:`${Math.max(0,Math.min(100,(1-delta/4.2)*100))}%`,height:`${Math.max(18,Math.min(70,n.duration*30))}px`}}><b>{n.name.replace(/\d/,"")}</b></div>})}
                  {visibleMelody.map((n,i)=>{const delta=n.time-currentTime;return <div key={`melody-${n.time}-${n.midi}-${i}`} className="midi-note melody" style={{left:`${keyX(n.midi)*100}%`,top:`${Math.max(0,Math.min(100,(1-delta/4.2)*100))}%`,height:`${Math.max(20,Math.min(76,n.duration*34))}px`}}><b>{n.name.replace(/\d/,"")}</b></div>})}
                  {loading&&<div className="loading">正在解析真实 MIDI…</div>}
                </div>
                <div className="keyboard-legend"><span><i className="lh"/>左手低音区</span><span><i className="rh"/>右手高音区</span><small>轨道中心与琴键中心共用同一坐标</small></div>
                <div className="real-piano">{whiteMidis.map(m=><button key={m} className={activeNotes.includes(m)?"lit":""} onPointerDown={()=>playTone(m)}><span>{activeNotes.includes(m)?midiName(m).replace(/\d/,""):""}</span></button>)}{blackMidis.map(m=><button key={m} className={`black ${activeNotes.includes(m)?"lit":""}`} style={{left:`calc(${keyX(m)*100}% - 7px)`}} onPointerDown={()=>playTone(m)}><span>{activeNotes.includes(m)?midiName(m).replace(/\d/,""):""}</span></button>)}</div>
              </div>
            </div>
          </div>

          <div className="transport-new"><div className="time"><b>{fmt(currentTime)}</b><span>/ {data?fmt(data.duration):"--:--"}</span></div><input className="timeline" aria-label="歌曲进度" type="range" min="0" max={data?.duration??1} step=".05" value={currentTime} onChange={e=>seek(Number(e.target.value))}/><div className="controls"><button onClick={()=>seek(currentTime-5)}>−5</button><button className="main-play" disabled={!data} onClick={()=>setPlaying(!playing)}>{playing?"Ⅱ":"▶"}</button><button onClick={()=>seek(currentTime+5)}>+5</button></div><div className="speed-control"><span>速度</span>{[.5,.75,1,2].map(v=><button key={v} className={speed===v?"active":""} onClick={()=>{setPlaying(false);setSpeed(v)}}>{v}×</button>)}</div></div>
        </div>
      </section>
    </div>
  </main>
}
