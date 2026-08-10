"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Midi } from "@tonejs/midi";

type Group = "pop"|"beginner"|"classical";
type CatalogSong = { id:string; title:string; artist:string; tone:string; color:string; group:Group; source:"pop909"|"midi"|"lesson"; midi?:string; lesson?:number[] };
type PianoNote = { midi:number; name:string; time:number; duration:number; velocity:number; hand:"left"|"right" };
type ChordMark = { start:number; end:number; name:string };
type SongData = { duration:number; bpm:number; notes:PianoNote[]; melody:PianoNote[]; chords:ChordMark[] };
const noteIds=new WeakMap<PianoNote,string>();let nextNoteId=0;
const noteKey=(note:PianoNote)=>{let id=noteIds.get(note);if(!id){id=`note-${nextNoteId++}`;noteIds.set(note,id)}return id};

const catalog:CatalogSong[] = [
  {id:"516",title:"晴天",artist:"周杰伦",tone:"G",color:"#d8ff62",group:"pop",source:"pop909"},
  {id:"074",title:"东风破",artist:"周杰伦",tone:"D",color:"#c6a26e",group:"pop",source:"pop909"},
  {id:"149",title:"修炼爱情",artist:"林俊杰",tone:"C",color:"#e88ca6",group:"pop",source:"pop909"},
  {id:"330",title:"小幸运",artist:"田馥甄",tone:"G",color:"#8ee8ff",group:"pop",source:"pop909"},
  {id:"346",title:"平凡之路",artist:"朴树",tone:"A",color:"#f0ad73",group:"pop",source:"pop909"},
  {id:"274",title:"夜空中最亮的星",artist:"逃跑计划",tone:"B",color:"#73b8ff",group:"pop",source:"pop909"},
  {id:"412",title:"成都",artist:"赵雷",tone:"C",color:"#e79a65",group:"pop",source:"pop909"},
  {id:"714",title:"红豆",artist:"王菲",tone:"F",color:"#eb88a9",group:"pop",source:"pop909"},
  {id:"823",title:"那些年",artist:"胡夏",tone:"G",color:"#a4df8d",group:"pop",source:"pop909"},
  {id:"526",title:"月亮代表我的心",artist:"张国荣",tone:"C",color:"#f1dc7d",group:"pop",source:"pop909"},
  {id:"029",title:"一直很安静",artist:"阿桑",tone:"C",color:"#af9cff",group:"pop",source:"pop909"},
  {id:"035",title:"七里香",artist:"刘瑞琦",tone:"E",color:"#f1a67c",group:"pop",source:"pop909"},
  {id:"170",title:"光年之外",artist:"邓紫棋",tone:"B",color:"#809dff",group:"pop",source:"pop909"},
  {id:"210",title:"勇气",artist:"梁静茹",tone:"C",color:"#f3c86c",group:"pop",source:"pop909"},
  {id:"220",title:"十年",artist:"陈奕迅",tone:"F",color:"#7dd4c4",group:"pop",source:"pop909"},
  {id:"017",title:"一剪梅",artist:"费玉清",tone:"G",color:"#d7b5ff",group:"pop",source:"pop909"},
  {id:"lesson-keys",title:"第 01 课 · 找到中央 C",artist:"键盘定位",tone:"C",color:"#d8ff62",group:"beginner",source:"lesson",lesson:[60,60,62,60,59,60,64,60]},
  {id:"lesson-five",title:"第 02 课 · 右手五指",artist:"固定手位 C–G",tone:"C",color:"#93e6ff",group:"beginner",source:"lesson",lesson:[60,62,64,65,67,65,64,62,60]},
  {id:"lesson-left",title:"第 03 课 · 左手五指",artist:"固定手位 C–G",tone:"C",color:"#82d8a5",group:"beginner",source:"lesson",lesson:[48,50,52,53,55,53,52,50,48]},
  {id:"lesson-rhythm",title:"第 04 课 · 基础节奏",artist:"四分与八分音符",tone:"C",color:"#ffad7b",group:"beginner",source:"lesson",lesson:[60,60,62,62,64,65,64,62,60,62,64,60]},
  {id:"lesson-waltz",title:"第 05 课 · 三拍子",artist:"强、弱、弱",tone:"F",color:"#f0bc83",group:"beginner",source:"lesson",lesson:[53,60,64,53,60,64,55,62,65,53,60,64]},
  {id:"lesson-scale",title:"第 06 课 · C 大调音阶",artist:"八度与穿指",tone:"C",color:"#78d7ba",group:"beginner",source:"lesson",lesson:[60,62,64,65,67,69,71,72,71,69,67,65,64,62,60]},
  {id:"lesson-shift",title:"第 07 课 · 换位与跨指",artist:"扩展右手音域",tone:"G",color:"#78d4d1",group:"beginner",source:"lesson",lesson:[55,57,59,60,62,64,66,67,66,64,62,60,59,57,55]},
  {id:"lesson-chords",title:"第 08 课 · 三个基础和弦",artist:"C / F / G",tone:"C",color:"#ffd37c",group:"beginner",source:"lesson",lesson:[48,52,55,53,57,60,55,59,62,48,52,55]},
  {id:"lesson-cadence",title:"第 09 课 · 和弦转换",artist:"I–IV–V–I",tone:"C",color:"#9fc4ff",group:"beginner",source:"lesson",lesson:[48,52,55,53,57,60,55,59,62,48,52,55]},
  {id:"lesson-broken",title:"第 10 课 · 分解和弦",artist:"C / Am / F / G",tone:"C",color:"#90b4ff",group:"beginner",source:"lesson",lesson:[48,52,55,52,45,48,52,48,53,57,60,57,55,59,62,59]},
  {id:"lesson-hands",title:"第 11 课 · 双手固定音",artist:"低音与旋律配合",tone:"C",color:"#c9a4ff",group:"beginner",source:"lesson",lesson:[48,60,48,62,48,64,48,65,55,67,55,65,48,60]},
  {id:"lesson-sight",title:"第 12 课 · 双手短乐句",artist:"四小节不中断",tone:"C",color:"#e49be6",group:"beginner",source:"lesson",lesson:[48,60,52,62,55,64,52,60,53,65,55,67,48,64,48,60]},
  {id:"lesson-minor",title:"第 13 课 · A 小调音阶",artist:"自然小调音色",tone:"Am",color:"#c7a4ee",group:"beginner",source:"lesson",lesson:[57,59,60,62,64,65,67,69,67,65,64,62,60,59,57]},
  {id:"lesson-arpeggio",title:"第 14 课 · 琶音基础",artist:"跨越三个音区",tone:"C",color:"#ffd16f",group:"beginner",source:"lesson",lesson:[48,52,55,60,64,67,72,67,64,60,55,52,48]},
  {id:"lesson-legato",title:"第 15 课 · 连奏与乐句",artist:"旋律呼吸",tone:"F",color:"#ef9fb4",group:"beginner",source:"lesson",lesson:[53,57,60,65,64,62,60,57,55,60,62,65,64,60,57,53]},
  {id:"lesson-piece",title:"第 16 课 · 综合小作品",artist:"节奏、和弦与双手",tone:"C",color:"#d8ff62",group:"beginner",source:"lesson",lesson:[48,60,52,64,55,67,53,65,48,60,55,64,52,62,48,60,64,67,72]},
  {id:"classical-minuet",title:"G 大调小步舞曲",artist:"巴赫 · BWV Anh.114",tone:"G",color:"#e7bd72",group:"classical",source:"midi",midi:"/data/classical/minuet-g.mid"},
  {id:"classical-prelude-c",title:"C 大调前奏曲",artist:"巴赫 · BWV 846",tone:"C",color:"#9bb5eb",group:"classical",source:"midi",midi:"/data/classical/bach-prelude-c-major.mid"},
  {id:"classical-invention",title:"C 大调二部创意曲",artist:"巴赫 · BWV 772",tone:"C",color:"#e0c27b",group:"classical",source:"midi",midi:"/data/classical/bach-invention-1.mid"},
  {id:"classical-goldberg",title:"哥德堡变奏曲 · 咏叹调",artist:"巴赫 · BWV 988",tone:"G",color:"#d8ba78",group:"classical",source:"midi",midi:"/data/classical/bach-goldberg-aria.mid"},
  {id:"classical-handel",title:"小奏鸣曲",artist:"亨德尔",tone:"G",color:"#e6a774",group:"classical",source:"midi",midi:"/data/classical/handel-sonatina.mid"},
  {id:"classical-schumann",title:"旋律",artist:"舒曼 · Op.68 No.1",tone:"C",color:"#e99fb2",group:"classical",source:"midi",midi:"/data/classical/schumann-melody.mid"},
  {id:"classical-arabesque",title:"阿拉贝斯克",artist:"布格缪勒 · Op.100 No.2",tone:"A",color:"#b39fea",group:"classical",source:"midi",midi:"/data/classical/burgmuller-arabesque.mid"},
  {id:"classical-moonlight-1",title:"月光奏鸣曲 · 第一乐章",artist:"贝多芬 · Op.27 No.2",tone:"C#m",color:"#869be8",group:"classical",source:"midi",midi:"/data/classical/beethoven-moonlight-1.mid"},
  {id:"classical-moonlight-2",title:"月光奏鸣曲 · 第二乐章",artist:"贝多芬 · Op.27 No.2",tone:"Db",color:"#9ca9ea",group:"classical",source:"midi",midi:"/data/classical/beethoven-moonlight-2.mid"},
  {id:"classical-moonlight-3",title:"月光奏鸣曲 · 第三乐章",artist:"贝多芬 · Op.27 No.2",tone:"C#m",color:"#727fdd",group:"classical",source:"midi",midi:"/data/classical/beethoven-moonlight-3.mid"},
  {id:"classical-pathetique-1",title:"悲怆奏鸣曲 · 第一乐章",artist:"贝多芬 · Op.13",tone:"Cm",color:"#e0b18c",group:"classical",source:"midi",midi:"/data/classical/beethoven-pathetique-1.mid"},
  {id:"classical-pathetique-2",title:"悲怆奏鸣曲 · 第二乐章",artist:"贝多芬 · Op.13",tone:"Ab",color:"#d6a983",group:"classical",source:"midi",midi:"/data/classical/beethoven-pathetique-2.mid"},
  {id:"classical-pathetique-3",title:"悲怆奏鸣曲 · 第三乐章",artist:"贝多芬 · Op.13",tone:"Cm",color:"#c88e78",group:"classical",source:"midi",midi:"/data/classical/beethoven-pathetique-3.mid"},
  {id:"classical-appassionata",title:"热情奏鸣曲 · 第二乐章",artist:"贝多芬 · Op.57",tone:"Db",color:"#d38d7e",group:"classical",source:"midi",midi:"/data/classical/beethoven-appassionata-2.mid"},
  {id:"classical-k545",title:"C 大调奏鸣曲",artist:"莫扎特 · K.545",tone:"C",color:"#8fdcc2",group:"classical",source:"midi",midi:"/data/classical/mozart-k545.mid"},
  {id:"classical-funeral",title:"C 小调葬礼进行曲",artist:"莫扎特 · K.453a",tone:"Cm",color:"#9f9ca8",group:"classical",source:"midi",midi:"/data/classical/mozart-funeral-march.mid"},
  {id:"classical-prelude-e",title:"E 小调前奏曲",artist:"肖邦 · Op.28 No.4",tone:"Em",color:"#c899aa",group:"classical",source:"midi",midi:"/data/classical/chopin-prelude-e-minor.mid"},
  {id:"classical-nocturne",title:"降 E 大调夜曲",artist:"肖邦 · Op.9 No.2",tone:"Eb",color:"#b5a2df",group:"classical",source:"midi",midi:"/data/classical/chopin-nocturne-op9-2.mid"},
  {id:"classical-schubert-impromptu",title:"降 G 大调即兴曲",artist:"舒伯特 · Op.90 No.3",tone:"Gb",color:"#9eb2d8",group:"classical",source:"midi",midi:"/data/classical/schubert-impromptu-op90-3.mid"},
  {id:"classical-brahms-waltz",title:"降 A 大调圆舞曲",artist:"勃拉姆斯 · Op.39 No.15",tone:"Ab",color:"#d8a9b2",group:"classical",source:"midi",midi:"/data/classical/brahms-waltz-op39-15.mid"},
  {id:"classical-clair-de-lune",title:"月光",artist:"德彪西 · 贝加马斯克组曲",tone:"Db",color:"#88aee0",group:"classical",source:"midi",midi:"/data/classical/debussy-clair-de-lune.mid"},
  {id:"classical-clementi",title:"C 大调小奏鸣曲",artist:"克莱门蒂 · Op.36 No.1",tone:"C",color:"#8fcdb5",group:"classical",source:"midi",midi:"/data/classical/clementi-sonatina-op36-1.mid"},
];

const NOTE_NAMES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const MIN_MIDI=36, MAX_MIDI=96;
const ROLL_WINDOW=4.2,ROLL_HIT=96;
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
const notesBetween=(notes:PianoNote[],start:number,end:number,limit:number)=>{let low=0,high=notes.length;while(low<high){const mid=(low+high)>>1;if(notes[mid].time<start)low=mid+1;else high=mid}const result:PianoNote[]=[];for(let i=low;i<notes.length&&notes[i].time<=end&&result.length<limit;i++)result.push(notes[i]);return result};
const notesInRoll=(notes:PianoNote[],time:number,limit:number)=>notesBetween(notes,time-12,time+ROLL_WINDOW,notes.length).filter(note=>note.time+note.duration>=time-.12).slice(0,limit);
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
  "lesson-keys":{goal:"只围绕中央 C 建立键盘定位感",steps:["找到两颗黑键左侧的 C","用右手拇指反复确认位置","每次离开后重新找回中央 C"]},
  "lesson-five":{goal:"熟悉右手 1–5 指的自然位置",steps:["五指轻放在 C–G","手腕放松，不要抬高手指","先用 0.5×，再尝试原速"]},
  "lesson-chords":{goal:"认识 C、F、G 三个基础和弦",steps:["先看顶部和弦名称","同时按下同色音符","留意和弦切换前的准备时间"]},
  "lesson-hands":{goal:"建立左右手独立配合",steps:["绿色低音交给左手","蓝色高音交给右手","分手练熟后再合手"]},
  "lesson-rhythm":{goal:"区分四分与八分音符的时值",steps:["先用手数出稳定拍点","短音保持轻巧不拖长","确认节奏后再关注音高"]},
  "lesson-scale":{goal:"完整弹奏 C 大调音阶",steps:["右手上行提前准备穿指","下行保持指序连贯","每个音保持相同力度"]},
  "lesson-broken":{goal:"用分解形式连接常用和弦",steps:["先记住每组四个音","手掌保持稳定移动","听清每组和弦的连接"]},
  "lesson-sight":{goal:"让左右手完成一段连续短乐句",steps:["先分别看清左右手音区","保持低音与旋律交替","不中断完成后再修正错音"]},
  "lesson-left":{goal:"建立左手五指的独立控制",steps:["小指放在低音 C","手腕保持自然水平","先慢速上行再下行"]},
  "lesson-waltz":{goal:"感受三拍子的强、弱、弱律动",steps:["第一拍稍有支撑","第二、三拍保持轻巧","边数一二三边跟弹"]},
  "lesson-cadence":{goal:"听辨并弹奏 I–IV–V–I 终止式",steps:["分别找到三个和弦手型","观察共同音减少移动","最后的 C 和弦自然收束"]},
  "lesson-minor":{goal:"熟悉 A 自然小调的音阶结构",steps:["从 A 音开始定位","留意全音与半音关系","上下行保持同样速度"]},
  "lesson-shift":{goal:"通过换位扩展右手活动范围",steps:["先分组记住五指位置","移动前放松手腕","换位后快速确认拇指落点"]},
  "lesson-arpeggio":{goal:"均匀连接四组基础琶音",steps:["每四个音看作一组","手腕顺着音型横向移动","保持每组音量一致"]},
  "lesson-legato":{goal:"弹出连贯旋律与自然乐句",steps:["手指交接时不要留缝","句尾轻轻抬起手腕","先不用踏板练清楚连接"]},
  "lesson-piece":{goal:"综合运用双手、和弦与旋律",steps:["先分别熟悉高低音区","按照颜色分配左右手","完整弹完后再提高速度"]},
};
const classicalGuides:Record<string,{level:string;focus:string;steps:string[]}>= {
  "classical-minuet":{level:"入门",focus:"舞曲节拍与乐句",steps:["先练右手旋律线","左手保持轻巧","每四小节做一次乐句呼吸"]},
  "classical-handel":{level:"入门",focus:"清晰触键与节奏",steps:["慢速分手练习","保持每个音清楚","合手后避免左手过重"]},
  "classical-schumann":{level:"初级",focus:"歌唱性旋律",steps:["突出右手主旋律","伴奏音量保持更轻","句尾自然放松"]},
  "classical-arabesque":{level:"初中级",focus:"快速音型与手腕放松",steps:["分组练习连续音型","用小幅手腕动作带动","先准确再逐步提速"]},
  "classical-k545":{level:"中级",focus:"古典奏鸣曲的均衡与颗粒感",steps:["先分别整理左右手指法","十六分音符保持均匀","合手时从 0.5× 开始"]},
  "classical-moonlight-1":{level:"中级",focus:"三连音织体与旋律层次",steps:["先单练持续三连音","高声部旋律保持歌唱性","用轻触键营造安静氛围"]},
  "classical-moonlight-2":{level:"中级",focus:"轻盈节拍与声部平衡",steps:["保持节拍自然流动","左手不要压住旋律","句尾留出清楚呼吸"]},
  "classical-moonlight-3":{level:"高级",focus:"快速琶音与力度控制",steps:["分组练习快速音型","保持手臂与手腕放松","从低速逐段衔接"]},
  "classical-prelude-c":{level:"初中级",focus:"分解和弦与和声流动",steps:["按和声位置分组练习","每组音型保持均匀","低音变化时提前准备手位"]},
  "classical-goldberg":{level:"中级",focus:"装饰音与复调层次",steps:["先弹清楚主题骨架","装饰音保持轻巧自然","低声部线条不要被覆盖"]},
  "classical-prelude-e":{level:"初中级",focus:"和声进行与旋律呼吸",steps:["先听清左手和声变化","右手旋律保持连贯","延长音处控制自然衰减"]},
  "classical-nocturne":{level:"中高级",focus:"装饰音与夜曲式歌唱性",steps:["先略去装饰音理顺旋律","左手伴奏保持均匀","装饰音轻巧融入拍点"]},
  "classical-pathetique-1":{level:"高级",focus:"强烈对比与快速音型",steps:["分别练习慢速引子与主题","和弦整齐有支撑","快速段落从分组慢练开始"]},
  "classical-pathetique-2":{level:"中级",focus:"歌唱性旋律与宽广伴奏",steps:["右手主题保持深连奏","左手和弦控制音量","重复乐句做出层次变化"]},
  "classical-pathetique-3":{level:"中高级",focus:"回旋主题与轻巧触键",steps:["先固定主题指法","保持快速音符清楚均匀","主题返回时做出层次变化"]},
  "classical-appassionata":{level:"中高级",focus:"变奏层次与长线条",steps:["先建立主题的平静脉搏","每次变奏逐步增强张力","低音声部保持清晰"]},
  "classical-invention":{level:"中级",focus:"二声部独立与模仿",steps:["分别唱出两个声部","左右手都保持清楚触键","主题进入时稍作突出"]},
  "classical-clementi":{level:"初中级",focus:"古典句法与快速音阶",steps:["划分四小节乐句","音阶指法保持稳定","伴奏轻于主旋律"]},
  "classical-funeral":{level:"中级",focus:"进行曲脉搏与沉稳音色",steps:["保持稳定而克制的速度","和弦整齐落键","强弱变化不要突然"]},
  "classical-schubert-impromptu":{level:"高级",focus:"长线条与连续音型",steps:["先分层练习旋律与伴奏","连续音型保持均匀放松","用和声变化推动乐句"]},
  "classical-brahms-waltz":{level:"中级",focus:"圆舞曲律动与内声部",steps:["保持三拍子的自然摆动","旋律高于伴奏声部","句尾做出柔和收束"]},
  "classical-clair-de-lune":{level:"高级",focus:"音色层次与自由呼吸",steps:["先确定旋律声部走向","和弦保持柔和透明","速度变化服从乐句呼吸"]},
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

  const playTone=useCallback(async(midi:number,duration=.45,velocity=.6,hand:"left"|"right"=midi<60?"left":"right",delay=0,scheduleVersion?:number,visualize=true)=>{
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
    if(visualize){const activeKey=`${midi}-${hand}`;window.setTimeout(()=>{setActiveKeys(p=>p.includes(activeKey)?p:[...p,activeKey]);window.setTimeout(()=>setActiveKeys(p=>p.filter(key=>key!==activeKey)),Math.min(duration,1)*800)},Math.max(0,delay)*1000)}
  },[]);

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setLoading(true);setPlaying(false);setCurrentTime(0);playedRef.current.clear();
      if(song.source==="lesson"){
        const sequence=song.lesson??[];
        const chordLesson=song.id==="lesson-chords"||song.id==="lesson-cadence";
        const notes:PianoNote[]=sequence.map((midi,index)=>({midi,name:midiName(midi),time:chordLesson?Math.floor(index/3)*1.8:index*.72,duration:chordLesson?1.35:.56,velocity:.72,hand:midi<60?"left":"right"}));
        const chordNames=chordLesson?["C","F","G","C"]:song.id==="lesson-broken"?["C","Am","F","G"]:[];
        const chordSpan=chordLesson?1.8:2.88;
        const chords=chordNames.map((name,index)=>({start:index*chordSpan,end:(index+1)*chordSpan,name}));
        const duration=Math.max(6,(notes.at(-1)?.time??0)+(chordLesson?1.8:1.1));
        if(!cancelled)setData({duration,bpm:84,notes,melody:[],chords});
        if(!cancelled)setLoading(false);return;
      }
      const base=`/data/pop909/${song.id}`;
      const [buffer,chordText]=await Promise.all([fetch(song.source==="midi"?song.midi!:`${base}/${song.id}.mid`).then(r=>r.arrayBuffer()),song.source==="pop909"?fetch(`${base}/chord_midi.txt`).then(r=>r.text()):Promise.resolve("")]);
      const midi=new Midi(buffer);
      const piano=midi.tracks.find(t=>t.name.toUpperCase()==="PIANO")??midi.tracks.at(-1)!;
      const melody=midi.tracks.find(t=>t.name.toUpperCase()==="MELODY");
      const mapNotes=(notes:typeof piano.notes,fixedHand?:"left"|"right"):PianoNote[]=>notes.filter(n=>n.midi>=MIN_MIDI&&n.midi<=MAX_MIDI).map(n=>({midi:n.midi,name:n.name,time:n.time,duration:n.duration,velocity:n.velocity,hand:fixedHand??(n.midi<60?"left":"right")}));
      const chords=chordText.trim()?chordText.trim().split(/\r?\n/).map(line=>{const [start,end,name]=line.split(/\s+/);return{start:Number(start),end:Number(end),name};}):[];
      const noteTracks=midi.tracks.filter(track=>track.notes.length>0);
      const trackAverages=noteTracks.map(track=>track.notes.reduce((sum,note)=>sum+note.midi,0)/track.notes.length);
      const handSplit=trackAverages.length>1?(Math.min(...trackAverages)+Math.max(...trackAverages))/2:60;
      const pianoNotes=song.source==="midi"?noteTracks.flatMap((track,index)=>mapNotes(track.notes,noteTracks.length>1?(trackAverages[index]>=handSplit?"right":"left"):undefined)).sort((a,b)=>a.time-b.time):mapNotes(piano?.notes??[]);
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
    const nowTime=()=>Math.min(data.duration,startTimeRef.current+(performance.now()-startRef.current)/1000*speed);
    const firstAtOrAfter=(notes:PianoNote[],time:number)=>{let low=0,high=notes.length;while(low<high){const mid=(low+high)>>1;if(notes[mid].time<time)low=mid+1;else high=mid}return low};
    let noteIndex=firstAtOrAfter(data.notes,currentTime-.04);
    let melodyIndex=firstAtOrAfter(data.melody,currentTime-.04);
    const scheduleAudio=()=>{
      const next=nowTime(),scheduleUntil=Math.min(data.duration,next+12*speed);
      while(noteIndex<data.notes.length&&data.notes[noteIndex].time<=scheduleUntil){const n=data.notes[noteIndex++];if(n.time>=next-.04)playTone(n.midi,n.duration/speed,n.velocity,n.hand,Math.max(0,(n.time-next)/speed),scheduleVersion,false)}
      if(melodyEnabled)while(melodyIndex<data.melody.length&&data.melody[melodyIndex].time<=scheduleUntil){const n=data.melody[melodyIndex++];if(n.time>=next-.04)playTone(n.midi,n.duration/speed,Math.min(1,n.velocity*1.12),"right",Math.max(0,(n.time-next)/speed),scheduleVersion,false)}
    };
    scheduleAudio();
    const scheduler=window.setInterval(scheduleAudio,1000);
    let frame=0,lastPaint=0;
    const paint=(timestamp:number)=>{
      const next=nowTime();
      if(timestamp-lastPaint>=32){lastPaint=timestamp;setCurrentTime(next)}
      if(next>=data.duration)setPlaying(false);else frame=requestAnimationFrame(paint);
    };
    frame=requestAnimationFrame(paint);
    return()=>{window.clearInterval(scheduler);cancelAnimationFrame(frame);scheduleVersionRef.current++;scheduledSourcesRef.current.forEach(source=>{try{source.stop()}catch{}});scheduledSourcesRef.current.clear()};
  },[playing,data,speed,playTone,melodyEnabled]);

  const seek=(time:number)=>{setPlaying(false);setCurrentTime(Math.max(0,Math.min(data?.duration??0,time)));playedRef.current.clear()};
  const currentChord=data?.chords.find(c=>currentTime>=c.start&&currentTime<c.end);
  const nextChord=data?.chords.find(c=>c.start>(currentChord?.start??currentTime));
  const visibleNotes=useMemo(()=>data?notesInRoll(data.notes,currentTime,160):[],[data,currentTime]);
  const visibleMelody=useMemo(()=>melodyEnabled&&data?notesInRoll(data.melody,currentTime,80):[],[data,currentTime,melodyEnabled]);
  const soundingKeys=useMemo(()=>{const keys=new Set(activeKeys);visibleNotes.forEach(n=>{if(n.time<=currentTime+.04&&n.time+n.duration>=currentTime)keys.add(`${n.midi}-${n.hand}`)});visibleMelody.forEach(n=>{if(n.time<=currentTime+.04&&n.time+n.duration>=currentTime)keys.add(`${n.midi}-right`)});return keys},[activeKeys,visibleNotes,visibleMelody,currentTime]);
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
        <div className="library-title"><h1>{group==="pop"?"流行练习":group==="beginner"?"教学课程":"古典钢琴"}</h1><p>{groupSongs.length} {group==="beginner"?"节循序渐进课程":group==="pop"?"首真实 MIDI 编配":"首开放许可经典曲目"}</p></div>
        <div className="library-groups"><button className={group==="beginner"?"active":""} onClick={()=>selectGroup("beginner")}>教学</button><button className={group==="pop"?"active":""} onClick={()=>selectGroup("pop")}>流行</button><button className={group==="classical"?"active":""} onClick={()=>selectGroup("classical")}>古典</button></div>
        <button className="mobile-song-picker" aria-expanded={mobileLibraryOpen} onClick={()=>setMobileLibraryOpen(open=>!open)}><i style={{"--song-color":song.color} as React.CSSProperties}>♪</i><span><small>当前{group==="beginner"?"课程":"曲目"}</small><strong>{song.title}</strong></span><em>{song.tone}</em><b>{mobileLibraryOpen?"收起":"更换"}</b></button>
        <div className={`song-list${mobileLibraryOpen?" mobile-open":""}`}>{groupSongs.map(({item,index})=><button key={item.id} className={songIndex===index?"selected":""} onClick={()=>selectSong(index)}><i style={{"--song-color":item.color} as React.CSSProperties}>♪</i><span><strong>{item.title}</strong><small>{item.artist}</small></span><em>{item.tone}</em></button>)}</div>
        <div className="data-credit"><strong>数据与音源</strong><p>POP909 · Mutopia Project</p><small>古典曲目使用开放许可 MIDI<br/>钢琴音色使用 Salamander Grand Piano</small></div>
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
                  {visibleNotes.map(n=>{const delta=n.time-currentTime;return <div key={noteKey(n)} className={`midi-note ${n.hand}`} style={{left:`${keyX(n.midi)*100}%`,top:`${Math.max(0,Math.min(340,ROLL_HIT-delta/ROLL_WINDOW*ROLL_HIT))}%`,height:`max(7px, ${Math.max(.8,n.duration/ROLL_WINDOW*ROLL_HIT)}%)`}}><b>{n.name.replace(/\d/,"")}</b></div>})}
                  {visibleMelody.map(n=>{const delta=n.time-currentTime;return <div key={noteKey(n)} className="midi-note melody" style={{left:`${keyX(n.midi)*100}%`,top:`${Math.max(0,Math.min(340,ROLL_HIT-delta/ROLL_WINDOW*ROLL_HIT))}%`,height:`max(7px, ${Math.max(.8,n.duration/ROLL_WINDOW*ROLL_HIT)}%)`}}><b>{n.name.replace(/\d/,"")}</b></div>})}
                  {loading&&<div className="loading">正在解析真实 MIDI…</div>}
                </div>
                <div className="keyboard-legend"><span><i className="lh"/>左手低音区</span><span><i className="rh"/>右手高音区</span><small>轨道中心与琴键中心共用同一坐标</small></div>
                <div className="real-piano">{whiteMidis.map(m=>{const hand=soundingKeys.has(`${m}-right`)?"right":soundingKeys.has(`${m}-left`)?"left":"";return <button key={m} className={hand?`lit ${hand}`:""} onPointerDown={()=>playTone(m)}><span>{hand?midiName(m).replace(/\d/,""):""}</span></button>})}{blackMidis.map(m=>{const hand=soundingKeys.has(`${m}-right`)?"right":soundingKeys.has(`${m}-left`)?"left":"";return <button key={m} className={`black ${hand?`lit ${hand}`:""}`} style={{left:`calc(${keyX(m)*100}% - 7px)`}} onPointerDown={()=>playTone(m)}><span>{hand?midiName(m).replace(/\d/,""):""}</span></button>})}</div>
              </div>
            </div>
          </div>

          <div className="transport-new"><div className="time"><b>{fmt(currentTime)}</b><span>/ {data?fmt(data.duration):"--:--"}</span></div><input className="timeline" aria-label="歌曲进度" type="range" min="0" max={data?.duration??1} step=".05" value={currentTime} onChange={e=>seek(Number(e.target.value))}/><div className="controls"><button onClick={()=>seek(currentTime-5)}>−5</button><button className="main-play" disabled={!data} onClick={()=>setPlaying(!playing)}>{playing?"Ⅱ":"▶"}</button><button onClick={()=>seek(currentTime+5)}>+5</button></div><div className="speed-control"><span>速度</span>{[.5,.75,1,2].map(v=><button key={v} className={speed===v?"active":""} onClick={()=>setSpeed(v)}>{v}×</button>)}</div></div>
        </div>
      </section>
    </div>
  </main>
}
