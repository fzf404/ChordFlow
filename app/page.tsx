"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Midi } from "@tonejs/midi";

type Group = "pop"|"beginner"|"classical";
type CatalogSong = { id:string; title:string; artist:string; tone:string; color:string; group:Group; source:"pop909"|"midi"|"lesson"; midi?:string; lesson?:number[] };
type PianoNote = { midi:number; name:string; time:number; duration:number; velocity:number; hand:"left"|"right" };
type ChordMark = { start:number; end:number; name:string };
type SongData = { duration:number; bpm:number; notes:PianoNote[]; melody:PianoNote[]; chords:ChordMark[] };

const catalog:CatalogSong[] = [
  {id:"516",title:"晴天",artist:"周杰伦",tone:"G",color:"#d8ff62",group:"pop",source:"pop909"},
  {id:"330",title:"小幸运",artist:"田馥甄",tone:"G",color:"#8ee8ff",group:"pop",source:"pop909"},
  {id:"346",title:"平凡之路",artist:"朴树",tone:"A",color:"#f0ad73",group:"pop",source:"pop909"},
  {id:"274",title:"夜空中最亮的星",artist:"逃跑计划",tone:"B",color:"#73b8ff",group:"pop",source:"pop909"},
  {id:"412",title:"成都",artist:"赵雷",tone:"C",color:"#e79a65",group:"pop",source:"pop909"},
  {id:"714",title:"红豆",artist:"王菲",tone:"F",color:"#eb88a9",group:"pop",source:"pop909"},
  {id:"823",title:"那些年",artist:"胡夏",tone:"G",color:"#a4df8d",group:"pop",source:"pop909"},
  {id:"526",title:"月亮代表我的心",artist:"张国荣",tone:"C",color:"#f1dc7d",group:"pop",source:"pop909"},
  {id:"029",title:"一直很安静",artist:"阿桑",tone:"C",color:"#af9cff",group:"pop",source:"pop909"},
  {id:"035",title:"七里香",artist:"刘瑞琦",tone:"E",color:"#f1a67c",group:"pop",source:"pop909"},
  {id:"074",title:"东风破",artist:"周杰伦",tone:"D",color:"#c6a26e",group:"pop",source:"pop909"},
  {id:"149",title:"修炼爱情",artist:"林俊杰",tone:"C",color:"#e88ca6",group:"pop",source:"pop909"},
  {id:"170",title:"光年之外",artist:"邓紫棋",tone:"B",color:"#809dff",group:"pop",source:"pop909"},
  {id:"210",title:"勇气",artist:"梁静茹",tone:"C",color:"#f3c86c",group:"pop",source:"pop909"},
  {id:"220",title:"十年",artist:"陈奕迅",tone:"F",color:"#7dd4c4",group:"pop",source:"pop909"},
  {id:"lesson-keys",title:"认识中央 C",artist:"第 1 课 · 键盘定位",tone:"C",color:"#d8ff62",group:"beginner",source:"lesson",lesson:[60,62,64,65,67,65,64,62,60]},
  {id:"lesson-five",title:"右手五指练习",artist:"第 2 课 · C–G",tone:"C",color:"#93e6ff",group:"beginner",source:"lesson",lesson:[60,62,64,65,67,67,65,64,62,60]},
  {id:"lesson-chords",title:"三个基础和弦",artist:"第 3 课 · C / F / G",tone:"C",color:"#ffd37c",group:"beginner",source:"lesson",lesson:[48,52,55,53,57,60,55,59,62,48,52,55]},
  {id:"lesson-hands",title:"双手协调入门",artist:"第 4 课 · 固定低音",tone:"C",color:"#c9a4ff",group:"beginner",source:"lesson",lesson:[48,60,52,62,55,64,53,65,55,67,48,60]},
  {id:"lesson-rhythm",title:"四分与八分节奏",artist:"第 5 课 · 稳定拍点",tone:"C",color:"#ffad7b",group:"beginner",source:"lesson",lesson:[60,60,62,62,64,65,64,62,60,60,60,60]},
  {id:"lesson-scale",title:"C 大调音阶",artist:"第 6 课 · 穿指准备",tone:"C",color:"#78d7ba",group:"beginner",source:"lesson",lesson:[60,62,64,65,67,69,71,72,71,69,67,65,64,62,60]},
  {id:"lesson-broken",title:"分解和弦练习",artist:"第 7 课 · C / Am / F / G",tone:"C",color:"#90b4ff",group:"beginner",source:"lesson",lesson:[48,52,55,52,45,48,52,48,53,57,60,57,55,59,62,59]},
  {id:"lesson-sight",title:"八小节视奏",artist:"第 8 课 · 综合练习",tone:"C",color:"#e49be6",group:"beginner",source:"lesson",lesson:[60,62,64,60,65,67,64,62,60,64,67,65,64,62,60,60]},
  {id:"classical-minuet",title:"G 大调小步舞曲",artist:"巴赫 · BWV Anh.114",tone:"G",color:"#e7bd72",group:"classical",source:"midi",midi:"/data/classical/minuet-g.mid"},
  {id:"classical-handel",title:"小奏鸣曲",artist:"亨德尔 · Allegretto",tone:"G",color:"#e6a774",group:"classical",source:"midi",midi:"/data/classical/handel-sonatina.mid"},
  {id:"classical-schumann",title:"旋律",artist:"舒曼 · 少年曲集 Op.68 No.1",tone:"C",color:"#e99fb2",group:"classical",source:"midi",midi:"/data/classical/schumann-melody.mid"},
  {id:"classical-arabesque",title:"阿拉贝斯克",artist:"布格缪勒 · Op.100 No.2",tone:"A",color:"#b39fea",group:"classical",source:"midi",midi:"/data/classical/burgmuller-arabesque.mid"},
  {id:"classical-elise",title:"致爱丽丝",artist:"贝多芬 · WoO 59",tone:"A",color:"#a8a3ff",group:"classical",source:"midi",midi:"/data/classical/fur-elise.mid"},
  {id:"classical-k545",title:"C 大调奏鸣曲",artist:"莫扎特 · K.545 第一乐章",tone:"C",color:"#8fdcc2",group:"classical",source:"midi",midi:"/data/classical/mozart-k545.mid"},
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
const pitchNames=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const pitchIndex:Record<string,number>={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,Fb:4,"E#":5,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11,Cb:11};
const chordLabel=(raw:string)=>{
  if(raw==="N"||!raw)return"—";
  const match=raw.match(/^([A-G])([#b]?):([^/]+)(?:\/(\d))?$/);
  if(!match)return raw.replace(":maj","").replace(":min","m");
  const [,letter,accidental,quality,inversion]=match;
  const root=`${letter}${accidental}`,rootMidi=pitchIndex[root]??-1;
  const suffix=quality==="maj"?"":quality==="min"?"m":quality==="min7"?"m7":quality==="maj7"?"maj7":quality;
  if(!inversion||rootMidi<0)return`${root}${suffix}`;
  const degree=Number(inversion),interval=degree===3?(quality.startsWith("min")?3:4):degree===5?7:degree===7?(quality==="maj7"?11:10):0;
  return`${root}${suffix}/${pitchNames[(rootMidi+interval)%12]}`;
};

const beginnerGuides:Record<string,{goal:string;steps:string[]}>= {
  "lesson-keys":{goal:"找到中央 C，建立键盘方向感",steps:["先观察中央 C 的位置","用右手拇指跟随下落音符","保持均匀速度完成一遍"]},
  "lesson-five":{goal:"熟悉右手 1–5 指的自然位置",steps:["五指轻放在 C–G","手腕放松，不要抬高手指","先用 0.5×，再尝试原速"]},
  "lesson-chords":{goal:"认识 C、F、G 三个基础和弦",steps:["先看顶部和弦名称","同时按下同色音符","留意和弦切换前的准备时间"]},
  "lesson-hands":{goal:"建立左右手独立配合",steps:["绿色低音交给左手","蓝色高音交给右手","分手练熟后再合手"]},
  "lesson-rhythm":{goal:"稳定四分与八分音符节拍",steps:["跟着落点保持匀速","短音不要拖长","卡顿时降到 0.75×"]},
  "lesson-scale":{goal:"完整弹奏 C 大调音阶",steps:["右手上行提前准备穿指","下行保持指序连贯","每个音保持相同力度"]},
  "lesson-broken":{goal:"用分解形式连接常用和弦",steps:["先记住每组四个音","手掌保持稳定移动","听清每组和弦的连接"]},
  "lesson-sight":{goal:"完成八小节综合视奏",steps:["先看音区和节奏","不中断完成第一次","第二次再修正错音"]},
};
const classicalGuides:Record<string,{level:string;focus:string;steps:string[]}>= {
  "classical-minuet":{level:"入门",focus:"舞曲节拍与乐句",steps:["先练右手旋律线","左手保持轻巧","每四小节做一次乐句呼吸"]},
  "classical-handel":{level:"入门",focus:"清晰触键与节奏",steps:["慢速分手练习","保持每个音清楚","合手后避免左手过重"]},
  "classical-schumann":{level:"初级",focus:"歌唱性旋律",steps:["突出右手主旋律","伴奏音量保持更轻","句尾自然放松"]},
  "classical-arabesque":{level:"初中级",focus:"快速音型与手腕放松",steps:["分组练习连续音型","用小幅手腕动作带动","先准确再逐步提速"]},
  "classical-elise":{level:"初中级",focus:"弱起、连奏与层次",steps:["先固定主题指法","左手分解和弦保持均匀","主题重复时控制力度变化"]},
  "classical-k545":{level:"中级",focus:"古典奏鸣曲的均衡与颗粒感",steps:["先分别整理左右手指法","十六分音符保持均匀","合手时从 0.5× 开始"]},
};

export default function Home(){
  const [songIndex,setSongIndex]=useState(()=>catalog.findIndex(item=>item.group==="beginner"));
  const [group,setGroup]=useState<Group>("beginner");
  const [data,setData]=useState<SongData|null>(null);
  const [loading,setLoading]=useState(true);
  const [playing,setPlaying]=useState(false);
  const [currentTime,setCurrentTime]=useState(0);
  const [speed,setSpeed]=useState(1);
  const [activeKeys,setActiveKeys]=useState<string[]>([]);
  const [lyrics,setLyrics]=useState<string[]>([]);
  const [melodyEnabled,setMelodyEnabled]=useState(true);
  const [lyricsEnabled,setLyricsEnabled]=useState(true);
  const [panel,setPanel]=useState<"guide"|"data">("guide");
  const [mobileLibraryOpen,setMobileLibraryOpen]=useState(false);
  const [mobileGuideOpen,setMobileGuideOpen]=useState(false);
  const audioRef=useRef<AudioContext|null>(null);
  const sampleBytesRef=useRef(new Map<number,ArrayBuffer>());
  const sampleBuffersRef=useRef(new Map<number,AudioBuffer>());
  const startRef=useRef(0);
  const startTimeRef=useRef(0);
  const playedRef=useRef(new Set<string>());
  const scheduledSourcesRef=useRef(new Set<AudioBufferSourceNode>());
  const scheduleVersionRef=useRef(0);
  const song=catalog[songIndex];
  const groupSongs=catalog.map((item,index)=>({item,index})).filter(({item})=>item.group===group);

  const selectSong=(index:number)=>{
    setPlaying(false);setCurrentTime(0);setActiveKeys([]);playedRef.current.clear();setSongIndex(index);setMobileLibraryOpen(false);
  };
  const selectGroup=(next:Group)=>{
    setGroup(next);const first=catalog.findIndex(item=>item.group===next);if(first>=0)selectSong(first);
  };

  useEffect(()=>{
    SAMPLE_MIDIS.forEach(m=>fetch(`/audio/piano/${sampleFile(m)}`).then(r=>r.arrayBuffer()).then(b=>sampleBytesRef.current.set(m,b)).catch(()=>undefined));
  },[]);

  const playTone=useCallback(async(midi:number,duration=.45,velocity=.6,hand:"left"|"right"=midi<60?"left":"right",delay=0,scheduleVersion?:number)=>{
    const Ctx=window.AudioContext||(window as typeof window&{webkitAudioContext:typeof AudioContext}).webkitAudioContext;
    const ctx=audioRef.current||new Ctx(); audioRef.current=ctx;
    if(ctx.state==="suspended")await ctx.resume();
    const sample=nearestSample(midi);
    let buffer=sampleBuffersRef.current.get(sample);
    if(!buffer){
      const cachedBytes=sampleBytesRef.current.get(sample);
      const bytes:ArrayBuffer=cachedBytes??await fetch(`/audio/piano/${sampleFile(sample)}`).then(r=>r.arrayBuffer());
      buffer=await ctx.decodeAudioData(bytes.slice(0));sampleBuffersRef.current.set(sample,buffer);
    }
    if(scheduleVersion!==undefined&&scheduleVersion!==scheduleVersionRef.current)return;
    const source=ctx.createBufferSource(),gain=ctx.createGain(),now=ctx.currentTime,startAt=now+Math.max(0,delay),release=Math.min(4,Math.max(1.2,duration+1.8));
    source.buffer=buffer;source.playbackRate.value=Math.pow(2,(midi-sample)/12);
    gain.gain.setValueAtTime(Math.max(.04,.42*velocity),startAt);gain.gain.exponentialRampToValueAtTime(.0001,startAt+release);
    source.connect(gain).connect(ctx.destination);source.start(startAt);source.stop(startAt+release+.05);
    if(scheduleVersion!==undefined){scheduledSourcesRef.current.add(source);source.onended=()=>scheduledSourcesRef.current.delete(source)}
    const activeKey=`${midi}-${hand}`;
    window.setTimeout(()=>{setActiveKeys(p=>p.includes(activeKey)?p:[...p,activeKey]);window.setTimeout(()=>setActiveKeys(p=>p.filter(key=>key!==activeKey)),Math.min(duration,1)*800)},Math.max(0,delay)*1000);
  },[]);

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setLoading(true);setPlaying(false);setCurrentTime(0);playedRef.current.clear();
      if(song.source==="lesson"){
        const sequence=song.lesson??[];
        const notes:PianoNote[]=sequence.map((midi,index)=>({midi,name:midiName(midi),time:index*.72,duration:.56,velocity:.72,hand:midi<60?"left":"right"}));
        const chordNames=song.id==="lesson-chords"?["C","F","G","C"]:[];
        const chords=chordNames.map((name,index)=>({start:index*2.16,end:(index+1)*2.16,name}));
        if(!cancelled)setData({duration:Math.max(6,sequence.length*.72+.8),bpm:84,notes,melody:[],chords});
        if(!cancelled)setLoading(false);return;
      }
      const base=`/data/pop909/${song.id}`;
      const [buffer,chordText]=await Promise.all([fetch(song.source==="midi"?song.midi!:`${base}/${song.id}.mid`).then(r=>r.arrayBuffer()),song.source==="pop909"?fetch(`${base}/chord_midi.txt`).then(r=>r.text()):Promise.resolve("")]);
      const midi=new Midi(buffer);
      const piano=midi.tracks.find(t=>t.name.toUpperCase()==="PIANO")??midi.tracks.at(-1)!;
      const melody=midi.tracks.find(t=>t.name.toUpperCase()==="MELODY");
      const mapNotes=(notes:typeof piano.notes):PianoNote[]=>notes.filter(n=>n.midi>=MIN_MIDI&&n.midi<=MAX_MIDI).map(n=>({midi:n.midi,name:n.name,time:n.time,duration:n.duration,velocity:n.velocity,hand:n.midi<60?"left":"right"}));
      const chords=chordText.trim()?chordText.trim().split(/\r?\n/).map(line=>{const [start,end,name]=line.split(/\s+/);return{start:Number(start),end:Number(end),name};}):[];
      const pianoNotes=song.source==="midi"?midi.tracks.flatMap(t=>mapNotes(t.notes)).sort((a,b)=>a.time-b.time):mapNotes(piano?.notes??[]);
      if(!cancelled)setData({duration:midi.duration,bpm:midi.header.tempos[0]?.bpm??72,notes:pianoNotes,melody:song.source==="midi"?[]:mapNotes(melody?.notes??[]),chords});
      if(!cancelled)setLoading(false);
    }
    load();return()=>{cancelled=true};
  },[song.id]);

  useEffect(()=>{
    if(!playing||!data)return;
    startRef.current=performance.now();startTimeRef.current=currentTime;
    const scheduleVersion=++scheduleVersionRef.current;
    playedRef.current.clear();
    let timer=0;
    const tick=()=>{
      const next=Math.min(data.duration,startTimeRef.current+(performance.now()-startRef.current)/1000*speed);
      setCurrentTime(next);
      const scheduleUntil=Math.min(data.duration,next+12*speed);
      data.notes.filter(n=>n.time>=next-.04&&n.time<=scheduleUntil).forEach(n=>{const key=`${n.time}-${n.midi}`;if(!playedRef.current.has(key)){playedRef.current.add(key);playTone(n.midi,n.duration/speed,n.velocity,n.hand,Math.max(0,(n.time-next)/speed),scheduleVersion)}});
      if(melodyEnabled)data.melody.filter(n=>n.time>=next-.04&&n.time<=scheduleUntil).forEach(n=>{const key=`melody-${n.time}-${n.midi}`;if(!playedRef.current.has(key)){playedRef.current.add(key);playTone(n.midi,n.duration/speed,Math.min(1,n.velocity*1.12),"right",Math.max(0,(n.time-next)/speed),scheduleVersion)}});
      if(next>=data.duration)setPlaying(false);else timer=window.setTimeout(tick,500);
    };
    tick();return()=>{window.clearTimeout(timer);scheduleVersionRef.current++;scheduledSourcesRef.current.forEach(source=>{try{source.stop()}catch{}});scheduledSourcesRef.current.clear()};
  },[playing,data,speed,playTone,melodyEnabled]);

  const seek=(time:number)=>{setPlaying(false);setCurrentTime(Math.max(0,Math.min(data?.duration??0,time)));playedRef.current.clear()};
  const currentChord=data?.chords.find(c=>currentTime>=c.start&&currentTime<c.end);
  const nextChord=data?.chords.find(c=>c.start>(currentChord?.start??currentTime));
  const visibleNotes=useMemo(()=>data?.notes.filter(n=>n.time>=currentTime-.12&&n.time<=currentTime+4.2).slice(0,60)??[],[data,currentTime]);
  const visibleMelody=useMemo(()=>melodyEnabled?(data?.melody.filter(n=>n.time>=currentTime-.12&&n.time<=currentTime+4.2).slice(0,30)??[]):[],[data,currentTime,melodyEnabled]);
  const visibleChords=useMemo(()=>data?.chords.filter(c=>c.end>currentTime).slice(0,6)??[],[data,currentTime]);
  const beginnerGuide=beginnerGuides[song.id];
  const classicalGuide=classicalGuides[song.id];

  const importLrc=async(file?:File)=>{
    if(!file)return;const text=await file.text();setLyrics(text.split(/\r?\n/).map(l=>l.replace(/^\[[^\]]+\]/,"").trim()).filter(Boolean));
  };

  return <main className="cf-app">
    <header className="cf-topbar"><div className="cf-logo"><i>♪</i><span>Chord<b>Flow</b></span></div></header>
    <div className="cf-layout">
      <aside className="library">
        <div className="library-title"><h1>{group==="pop"?"流行练习":group==="beginner"?"教学课程":"古典钢琴"}</h1><p>{group==="pop"?"15 首真实 MIDI 编配":group==="beginner"?"8 节循序渐进课程":"6 首开放许可经典曲目"}</p></div>
        <div className="library-groups"><button className={group==="beginner"?"active":""} onClick={()=>selectGroup("beginner")}>教学</button><button className={group==="pop"?"active":""} onClick={()=>selectGroup("pop")}>流行</button><button className={group==="classical"?"active":""} onClick={()=>selectGroup("classical")}>古典</button></div>
        <button className="mobile-song-picker" aria-expanded={mobileLibraryOpen} onClick={()=>setMobileLibraryOpen(open=>!open)}><i style={{"--song-color":song.color} as React.CSSProperties}>♪</i><span><small>当前{group==="beginner"?"课程":"曲目"}</small><strong>{song.title}</strong></span><em>{song.tone}</em><b>{mobileLibraryOpen?"收起":"更换"}</b></button>
        <div className={`song-list${mobileLibraryOpen?" mobile-open":""}`}>{groupSongs.map(({item,index})=><button key={item.id} className={songIndex===index?"selected":""} onClick={()=>selectSong(index)}><i style={{"--song-color":item.color} as React.CSSProperties}>♪</i><span><strong>{item.title}</strong><small>{item.artist}</small></span><em>{item.tone}</em></button>)}</div>
        <div className="data-credit"><strong>数据来源</strong><p>POP909 · Mutopia Project</p><small>古典曲目使用开放许可 MIDI<br/>钢琴音色使用 Salamander Grand Piano</small></div>
      </aside>

      <section className="studio">
        <div className="song-head"><div><span className="kicker">{song.group==="beginner"?"教学课程":song.group==="pop"?"流行练习":"古典钢琴"}</span><h2>{song.title}</h2><p><span>{song.artist}</span><span>{data?`${Math.round(data.bpm)} BPM`:"载入中"}</span><span>{song.tone} 调</span><span>{data?fmt(data.duration):"--:--"}</span></p></div></div>

        <div className="player-card">
          {data?.chords.length?<div className="chord-row"><div className="current-chord"><span>当前和弦</span><strong>{chordLabel(currentChord?.name??"N")}</strong></div>{visibleChords.map((c,i)=><button key={`${c.start}-${i}`} className={c===currentChord?"active":""} onClick={()=>seek(c.start)}><small>{fmt(c.start)}</small><strong>{chordLabel(c.name)}</strong></button>)}<div className="next-chord">下一个 <b>{chordLabel(nextChord?.name??"N")}</b></div></div>:<div className="no-chords"><span>此曲没有可靠的和弦标注，因此不显示推测结果</span></div>}

          <div className="learn-grid">
            <button className="mobile-guide-toggle" aria-expanded={mobileGuideOpen} onClick={()=>setMobileGuideOpen(open=>!open)}><span>{song.group==="beginner"?"课程指导":song.group==="classical"?"练习提示":"跟弹设置"}</span><b>{mobileGuideOpen?"收起":"查看"}</b></button>
            <aside className={`lesson-panel${mobileGuideOpen?" mobile-open":""}`}>
              <div className="panel-tabs"><button className={panel==="guide"?"active":""} onClick={()=>setPanel("guide")}>{song.group==="beginner"?"课程指导":song.group==="classical"?"练习提示":"跟弹指引"}</button><button className={panel==="data"?"active":""} onClick={()=>setPanel("data")}>数据详情</button></div>
              {panel==="guide"?<>
                {song.group==="beginner"&&beginnerGuide&&<div className="course-guide"><span className="guide-label">本课目标</span><h3>{beginnerGuide.goal}</h3><ol>{beginnerGuide.steps.map((step,index)=><li key={step}><b>{index+1}</b><span>{step}</span></li>)}</ol><div className="hand-key"><span><i className="lh"/>左手低音</span><span><i className="rh"/>右手高音</span></div></div>}
                {song.group==="classical"&&classicalGuide&&<div className="course-guide classical-guide"><div className="piece-meta"><span><small>难度</small><b>{classicalGuide.level}</b></span><span><small>练习重点</small><b>{classicalGuide.focus}</b></span></div><ol>{classicalGuide.steps.map((step,index)=><li key={step}><b>{index+1}</b><span>{step}</span></li>)}</ol><p className="source-note">开放许可 MIDI · Mutopia Project</p></div>}
                {song.group==="pop"&&<><div className="track-switches"><button className={melodyEnabled?"on":""} aria-pressed={melodyEnabled} onClick={()=>{setPlaying(false);playedRef.current.clear();setMelodyEnabled(v=>!v)}}><span><i/>旋律</span><b>{melodyEnabled?"已开启":"已关闭"}</b></button><button className={lyricsEnabled?"on":""} aria-pressed={lyricsEnabled} onClick={()=>setLyricsEnabled(v=>!v)}><span><i/>歌词</span><b>{lyricsEnabled?"已开启":"已关闭"}</b></button></div><div className="howto"><span>1</span><p><strong>点击播放</strong>音符从上方向琴键移动</p></div><div className="howto"><span>2</span><p><strong>按颜色分手</strong><i className="lh"/>低音区左手 <i className="rh"/>高音区右手</p></div><div className="howto"><span>3</span><p><strong>到达线时弹下</strong>键盘会同步高亮</p></div>{melodyEnabled&&<div className="melody-status"><i/><span><strong>旋律轨正在播放</strong><small>紫色音符会落到对应琴键</small></span></div>}{lyricsEnabled&&<div className="lyrics-box">{lyrics.length?<><small>当前歌词</small><strong>{lyrics[Math.floor(currentTime/4)%lyrics.length]}</strong></>:<><small>歌词轨已开启</small><strong>导入 LRC 后随播放显示</strong><p>请选择你拥有使用权的歌词文件。</p></>}<label>＋ 导入 LRC<input type="file" accept=".lrc,.txt" onChange={e=>importLrc(e.target.files?.[0])}/></label></div>}</>}
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
                <div className="real-piano">{whiteMidis.map(m=>{const hand=activeKeys.includes(`${m}-right`)?"right":activeKeys.includes(`${m}-left`)?"left":"";return <button key={m} className={hand?`lit ${hand}`:""} onPointerDown={()=>playTone(m)}><span>{hand?midiName(m).replace(/\d/,""):""}</span></button>})}{blackMidis.map(m=>{const hand=activeKeys.includes(`${m}-right`)?"right":activeKeys.includes(`${m}-left`)?"left":"";return <button key={m} className={`black ${hand?`lit ${hand}`:""}`} style={{left:`calc(${keyX(m)*100}% - 7px)`}} onPointerDown={()=>playTone(m)}><span>{hand?midiName(m).replace(/\d/,""):""}</span></button>})}</div>
              </div>
            </div>
          </div>

          <div className="transport-new"><div className="time"><b>{fmt(currentTime)}</b><span>/ {data?fmt(data.duration):"--:--"}</span></div><input className="timeline" aria-label="歌曲进度" type="range" min="0" max={data?.duration??1} step=".05" value={currentTime} onChange={e=>seek(Number(e.target.value))}/><div className="controls"><button onClick={()=>seek(currentTime-5)}>−5</button><button className="main-play" disabled={!data} onClick={()=>setPlaying(!playing)}>{playing?"Ⅱ":"▶"}</button><button onClick={()=>seek(currentTime+5)}>+5</button></div><div className="speed-control"><span>速度</span>{[.5,.75,1,2].map(v=><button key={v} className={speed===v?"active":""} onClick={()=>setSpeed(v)}>{v}×</button>)}</div></div>
        </div>
      </section>
    </div>
  </main>
}
