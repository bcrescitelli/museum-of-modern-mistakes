import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  arrayUnion, 
  runTransaction 
} from 'firebase/firestore';
import { 
  Palette, Pencil, Trash2, Users, Timer, 
  Gavel, Image as ImageIcon, Award, CheckCircle2,
  Trophy, Coins, Volume2, VolumeX,
  AlertCircle, History,
  PenTool,
  Star,
  Zap,
  Target
} from 'lucide-react';

// --- Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBysJI5RAeRDiVNI36lXD8g4CmiF2tXCUk",
  authDomain: "museum-of-modern-mistakes.firebaseapp.com",
  projectId: "museum-of-modern-mistakes",
  storageBucket: "museum-of-modern-mistakes.firebasestorage.app",
  messagingSenderId: "244324872382",
  appId: "1:244324872382:web:955dc0385a1e4177f0eeef"
};

const appId = 'museum-modern-mistakes';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PHASES = {
  LOBBY: 'LOBBY',
  STUDIO_DRAW: 'STUDIO_DRAW',
  STUDIO_APPRAISE: 'STUDIO_APPRAISE',
  AUCTION: 'AUCTION',
  CURATION: 'CURATION',
  PRESENTATION: 'PRESENTATION', 
  VOTING: 'VOTING',
  RESULTS: 'RESULTS'
};

const PROMPTS = ["A failed invention", "A cursed heirloom", "A luxury snack", "A DIY haircut gone wrong", "The world's smallest problem", "A suspicious gift", "An invisible pet", "A sentient appliance", "A forgotten time capsule", "Forbidden modern art"];
const THEMES = ["Items Found at the Bottom of the Ocean", "Gifts for a Bitter Ex", "Evidence of a Time Traveler", "Found in a Haunted Basement", "Relics of a Forgotten Future"];

const OBJECTIVES = [
  { id: 'HOARDER', title: 'The Hoarder', desc: 'Own 3 items at the end', bonus: 400 },
  { id: 'BARGAIN', title: 'Bargain Hunter', desc: 'Buy an item for < $100', bonus: 300 },
  { id: 'PRODUCER', title: 'The Producer', desc: 'Someone else buys your art', bonus: 300 },
  { id: 'FAN_FAVE', title: 'Fan Favorite', desc: 'Get 2+ votes', bonus: 500 },
  { id: 'THRIFTY', title: 'Thrifty Curator', desc: 'Finish with > $400 cash', bonus: 300 }
];

const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

// --- Components ---

const DrawingCanvas = ({ onSave, prompt, timeLimit }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [thickness, setThickness] = useState(8);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const contextRef = useRef(null);

  useEffect(() => {
    const initCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const context = canvas.getContext("2d");
      context.scale(dpr, dpr);
      context.lineCap = "round";
      context.strokeStyle = color;
      context.lineWidth = thickness;
      contextRef.current = context;
    };
    const handle = requestAnimationFrame(initCanvas);
    window.addEventListener('resize', initCanvas);
    return () => { cancelAnimationFrame(handle); window.removeEventListener('resize', initCanvas); };
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = thickness;
    }
  }, [color, thickness]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleSave(); clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 0.5);
    onSave(dataUrl);
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    const pos = getPos(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    contextRef.current.lineTo(pos.x, pos.y);
    contextRef.current.stroke();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 p-2 overflow-hidden">
      <div className="flex justify-between items-center p-3 bg-slate-800 rounded-2xl mb-2">
        <div className="max-w-[70%]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sketchpad</p>
          <h2 className="text-lg font-black text-white leading-tight truncate">{prompt}</h2>
        </div>
        <div className={`px-4 py-2 rounded-xl font-mono text-xl font-bold ${timeLeft < 10 ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'} text-white`}>
          {timeLeft}s
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 relative bg-white rounded-[2rem] shadow-2xl overflow-hidden touch-none cursor-crosshair border-8 border-slate-800">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
          onTouchMove={(e) => { e.preventDefault(); draw(e); }}
          onTouchEnd={() => setIsDrawing(false)}
          className="block w-full h-full"
        />
      </div>

      <div className="py-4 px-2 space-y-4">
        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap flex-1">
            {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f59e0b', '#ec4899', '#78350f', '#64748b', '#ffffff'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full border-4 ${color === c ? 'border-indigo-400 scale-110' : 'border-slate-700 shadow-lg'} transition-all`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button onClick={() => contextRef.current.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)} className="p-3 bg-slate-800 text-slate-400 rounded-xl">
            <Trash2 size={24} />
          </button>
        </div>
        <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-2xl">
          <input type="range" min="2" max="35" value={thickness} onChange={(e) => setThickness(parseInt(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg active:scale-95 transition-all">DONE</button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [items, setItems] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        const cred = await signInAnonymously(auth);
        setUser(cred.user);
      } else { setUser(u); }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const roomPath = ['artifacts', appId, 'public', 'data', 'rooms', roomId];
    const unsubRoom = onSnapshot(doc(db, ...roomPath), (doc) => { if (doc.exists()) setRoom({ id: doc.id, ...doc.data() }); });
    const unsubPlayers = onSnapshot(collection(db, ...roomPath, 'players'), (snap) => { setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubItems = onSnapshot(collection(db, ...roomPath, 'items'), (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => { unsubRoom(); unsubPlayers(); unsubItems(); };
  }, [roomId, user]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
    if (room?.phase === PHASES.RESULTS && audioRef.current) audioRef.current.pause();
  }, [isMuted, room?.phase]);

  // Host Logic
  useEffect(() => {
    if (view !== 'host' || !room) return;
    let timer;
    const phaseUptime = Date.now() - (room.phaseStartedAt || 0);
    const isSettled = phaseUptime > 3000;

    if (isSettled && players.length > 0 && players.every(p => p.ready)) {
      if (room.phase === PHASES.STUDIO_DRAW) startPhase(PHASES.STUDIO_APPRAISE);
      else if (room.phase === PHASES.STUDIO_APPRAISE) startPhase(PHASES.AUCTION);
      else if (room.phase === PHASES.CURATION) startPhase(PHASES.PRESENTATION);
      else if (room.phase === PHASES.VOTING) startPhase(PHASES.RESULTS);
      return;
    }

    if (room.phase === PHASES.PRESENTATION) {
      timer = setInterval(async () => {
        const currentIdx = room.presentingIdx || 0;
        if (room.presentationTimer > 0) {
          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), { presentationTimer: room.presentationTimer - 1 });
        } else {
          if (currentIdx < players.length - 1) {
            updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), { presentingIdx: currentIdx + 1, presentationTimer: 10 });
          } else { startPhase(PHASES.VOTING); }
        }
      }, 1000);
    }

    if (room.phase === PHASES.AUCTION) {
      if (!room.currentAuction) {
        const nextItem = items.find(i => i.appraised && !i.auctioned);
        if (nextItem) {
          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
            currentAuction: { itemId: nextItem.id, item: nextItem, type: 'STANDARD', highestBid: 0, highestBidder: null, highestBidderName: null, timer: 15 }
          });
        } else if (items.length > 0 && items.every(i => i.auctioned)) { startPhase(PHASES.CURATION); }
      } else {
        timer = setInterval(async () => {
          const auction = room.currentAuction;
          const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
          if (auction.timer <= 0) { clearInterval(timer); finalizeAuction(); }
          else { updateDoc(roomRef, { 'currentAuction.timer': auction.timer - 1 }); }
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [view, room?.phase, room?.currentAuction, room?.presentingIdx, room?.presentationTimer, players, items]);

  const finalizeAuction = async () => {
    if (!room?.currentAuction) return;
    const auction = room.currentAuction;
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items', auction.itemId);
    if (auction.highestBidder) {
      await updateDoc(itemRef, { ownerId: auction.highestBidder, pricePaid: auction.highestBid, auctioned: true, returned: false });
      const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', auction.highestBidder);
      const pSnap = await getDoc(pRef);
      await updateDoc(pRef, { cash: (pSnap.data().cash || 0) - auction.highestBid, inventory: arrayUnion(auction.itemId) });
    } else {
      await updateDoc(itemRef, { ownerId: auction.item.artistId, pricePaid: 0, returned: true, auctioned: true });
      const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', auction.item.artistId);
      await updateDoc(pRef, { inventory: arrayUnion(auction.itemId) });
    }
    await updateDoc(roomRef, { currentAuction: null });
  };

  const startPhase = async (phase) => {
    const data = { phase, phaseStartedAt: Date.now(), presentingIdx: 0, presentationTimer: 10 };
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), data);
    for (const p of players) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', p.id), { ready: false }); }
  };

  const placeBid = async (amount) => {
    const me = players.find(p => p.id === user?.uid);
    if (!room?.currentAuction || !me || (me.inventory?.length || 0) >= 3) return;
    if (amount > me.cash) return;
    if (navigator.vibrate) navigator.vibrate(50);
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
      const roomSnap = await transaction.get(roomRef);
      const current = roomSnap.data().currentAuction;
      if (amount <= current.highestBid) return;
      transaction.update(roomRef, { 'currentAuction.highestBid': amount, 'currentAuction.highestBidder': user.uid, 'currentAuction.highestBidderName': name, 'currentAuction.timer': 7 });
    });
  };

  const hostGame = async () => {
    if (!audioRef.current) { audioRef.current = new Audio('/intro.mp3'); audioRef.current.loop = true; audioRef.current.volume = 0.3; audioRef.current.play().catch(() => {}); }
    const code = generateRoomCode();
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code), { hostId: user.uid, phase: PHASES.LOBBY, theme: THEMES[Math.floor(Math.random() * THEMES.length)], currentAuction: null, phaseStartedAt: Date.now() });
    setRoomId(code); setView('host');
  };

  const joinGame = async (code) => {
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code.toUpperCase());
    const snap = await getDoc(roomRef);
    if (!snap.exists()) { setStatusMsg("Invalid Room"); return; }
    const objective = OBJECTIVES[Math.floor(Math.random() * OBJECTIVES.length)];
    await setDoc(doc(roomRef, 'players', user.uid), { name, cash: 1000, inventory: [], ready: false, votes: 0, wingTitle: '', objective });
    setRoomId(code.toUpperCase()); setView('client');
  };

  const handleDrawingSubmit = async (dataUrl) => {
    const itemRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items'));
    await setDoc(itemRef, { id: itemRef.id, artistId: user.uid, artistName: name, image: dataUrl, prompt: PROMPTS[currentPromptIdx % PROMPTS.length], title: '', history: '', appraised: false, ownerId: null, pricePaid: 0, auctioned: false, returned: false });
    if (currentPromptIdx < 2) { setCurrentPromptIdx(prev => prev + 1); } 
    else { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true }); }
  };

  const submitAppraisal = async (itemId, title, history) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items', itemId), { title, history, appraised: true, appraiserId: user.uid });
    const remaining = items.filter(i => i.artistId !== user.uid && !i.appraised && i.id !== itemId);
    if (remaining.length === 0) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true }); }
  };

  // --- Views ---

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full space-y-10 text-center">
          <div className="space-y-1 transform -rotate-2">
            <h1 className="text-8xl font-black tracking-tighter text-indigo-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-none">MMM</h1>
            <p className="text-lg font-bold text-slate-500 tracking-[0.2em] uppercase">Museum of Modern Mistakes</p>
          </div>
          <div className="bg-slate-800 p-8 rounded-[3rem] shadow-2xl border border-slate-700 space-y-6">
            <input type="text" placeholder="Curator Name" className="w-full p-5 bg-slate-900 rounded-2xl border border-slate-700 focus:border-indigo-500 text-lg outline-none" value={name} onChange={e => setName(e.target.value)} />
            <input type="text" placeholder="Room Code" className="w-full p-5 bg-slate-900 rounded-2xl border border-slate-700 text-center font-mono text-3xl tracking-widest uppercase outline-none" value={roomId} onChange={e => setRoomId(e.target.value)} />
            <button onClick={() => joinGame(roomId)} disabled={!name || !roomId} className="w-full py-5 bg-indigo-600 rounded-2xl font-black text-2xl shadow-xl hover:bg-indigo-500 disabled:opacity-50 transition-all border-b-8 border-indigo-800 active:border-b-0 active:translate-y-2">JOIN GALLERY</button>
            <div className="flex items-center gap-4 text-slate-500 py-2"><hr className="flex-1 border-slate-700" /><span>OR</span><hr className="flex-1 border-slate-700" /></div>
            <button onClick={hostGame} className="w-full py-4 bg-slate-700 rounded-2xl font-bold hover:bg-slate-600 transition-all">HOST ROOM</button>
          </div>
          {statusMsg && <p className="text-red-500 font-bold">{statusMsg}</p>}
        </div>
      </div>
    );
  }

  if (view === 'host') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col p-12 overflow-hidden relative">
        <div className="flex justify-between items-start z-10">
          <div>
            <h1 className="text-4xl font-black text-indigo-600 flex items-center gap-3"><ImageIcon size={40}/> MODERN MISTAKES</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Main Gallery Display</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-indigo-600 text-center transform -rotate-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">Room Code</p>
            <p className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{room?.id}</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          {room?.phase === PHASES.LOBBY && (
            <div className="text-center space-y-12 max-w-5xl animate-in zoom-in">
              <h2 className="text-6xl font-black text-slate-800 drop-shadow-sm italic">Assembling the Elite...</h2>
              <div className="flex flex-wrap justify-center gap-6">
                {players.map(p => (
                  <div key={p.id} className="bg-white px-10 py-5 rounded-[2rem] shadow-xl border-b-8 border-indigo-200 font-black text-2xl animate-in slide-in-from-bottom">{p.name}</div>
                ))}
              </div>
              {players.length >= 2 && <button onClick={() => startPhase(PHASES.STUDIO_DRAW)} className="px-16 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-4xl shadow-2xl hover:scale-110 transition-transform uppercase tracking-widest border-b-[10px] border-indigo-800">Start Exhibition</button>}
            </div>
          )}

          {(room?.phase === PHASES.STUDIO_DRAW || room?.phase === PHASES.STUDIO_APPRAISE) && (
            <div className="text-center space-y-12 animate-in zoom-in">
              {room.phase === PHASES.STUDIO_DRAW ? <PenTool size={120} className="mx-auto text-indigo-500 animate-bounce" /> : <History size={120} className="mx-auto text-orange-500 animate-spin-slow" />}
              <h2 className="text-8xl font-black text-slate-900 leading-none">
                {room.phase === PHASES.STUDIO_DRAW ? "Studio Phase" : "Appraisal Phase"}
              </h2>
              <p className="text-3xl text-slate-500 font-medium italic">
                {room.phase === PHASES.STUDIO_DRAW ? "Painting for the masses..." : "Writing the history books..."}
              </p>
              <div className="flex flex-wrap justify-center gap-6 pt-8">
                {players.map(p => (
                   <div key={p.id} className="flex flex-col items-center gap-3">
                     <div className={`w-12 h-12 rounded-full shadow-2xl border-4 border-white ${p.ready ? 'bg-indigo-600' : 'bg-slate-300'} transition-all transform ${p.ready ? 'scale-110' : ''}`} />
                     <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">{p.name}</p>
                   </div>
                ))}
              </div>
            </div>
          )}

          {room?.phase === PHASES.AUCTION && (
            room.currentAuction ? (
              <div className="w-full max-w-7xl grid grid-cols-2 gap-20 animate-in fade-in slide-in-from-bottom duration-700 px-8">
                <div className="bg-white p-12 rounded-[4rem] shadow-2xl space-y-8 border-4 border-white relative overflow-hidden">
                  <div className="aspect-square bg-slate-50 rounded-[3rem] overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-100">
                    <img src={room.currentAuction.item.image} className="max-h-full max-w-full object-contain p-4" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-6xl font-black text-slate-900 leading-tight">{room.currentAuction.item.title || "Untitled"}</h3>
                    <p className="text-3xl text-slate-500 mt-4 italic font-medium leading-relaxed">"{room.currentAuction.item.history || "No history available."}"</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center space-y-12">
                  <div className="p-20 rounded-[4rem] shadow-2xl text-center space-y-8 bg-indigo-900 text-white relative border-b-[20px] border-indigo-950">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-12 py-4 rounded-full font-black text-lg uppercase shadow-xl tracking-widest border-4 border-indigo-500">
                      Standard Auction
                    </div>
                    <p className="text-[14rem] font-black tracking-tighter font-mono leading-none">${room.currentAuction.highestBid}</p>
                    <p className="text-5xl font-black text-indigo-400 uppercase italic tracking-tighter">{room.currentAuction.highestBidderName || "Waiting for bidder..."}</p>
                  </div>
                  <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex items-center justify-between border-b-8 border-slate-200">
                    <div className="flex items-center gap-8">
                      <Timer className={`text-slate-300 ${room.currentAuction.timer < 5 ? 'text-red-500 animate-pulse' : ''}`} size={80} />
                      <span className="text-8xl font-black font-mono">{(room.currentAuction.timer || 0)}s</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Original Artist</p>
                      <p className="text-5xl font-black text-slate-800">{room.currentAuction.item.artistName}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-12 animate-pulse">
                <Gavel size={160} className="mx-auto text-indigo-500" />
                <h2 className="text-7xl font-black text-slate-800 uppercase italic tracking-[0.2em]">Next Lot Loading...</h2>
              </div>
            )
          )}

          {room?.phase === PHASES.PRESENTATION && (
            <div className="w-full h-full max-h-[85vh] max-w-[98vw] flex flex-col items-center justify-center animate-in zoom-in duration-700 px-4">
              {players[room.presentingIdx] && (
                <>
                  {/* Compact Header */}
                  <div className="text-center mb-6 space-y-1">
                    <div className="inline-block px-6 py-1 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg mb-1">Theme: {room.theme}</div>
                    <p className="text-slate-400 font-black text-lg uppercase tracking-[0.2em] leading-none mb-1">{players[room.presentingIdx].name}'s Gallery</p>
                    <h2 className="text-5xl font-black text-slate-900 leading-tight italic">"{players[room.presentingIdx].wingTitle}"</h2>
                  </div>
                  
                  {/* Single Row Gallery */}
                  <div className="flex w-full gap-4 justify-center items-start overflow-hidden">
                    {items.filter(i => (players[room.presentingIdx].inventory || []).includes(i.id)).map(item => (
                      <div key={item.id} className="flex-1 max-w-[31%] bg-white p-4 rounded-[2rem] shadow-xl relative border-2 border-white transform transition-transform hover:scale-[1.02]">
                        {item.returned && (
                          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-red-600 text-white px-6 py-2 rounded-lg font-black text-3xl border-4 border-white shadow-2xl z-20">MISTAKE!</div>
                        )}
                        <div className="bg-slate-50 rounded-2xl p-2 mb-3 shadow-inner">
                          <img src={item.image} className="w-full h-40 object-contain mx-auto" />
                        </div>
                        <div className="px-1">
                          <h4 className="text-xl font-black text-slate-800 leading-tight mb-1 truncate">{item.title}</h4>
                          <p className="text-sm text-slate-500 italic font-bold leading-tight border-t pt-2 border-slate-100 line-clamp-3">"{item.history}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {room?.phase === PHASES.RESULTS && (
            <div className="w-full max-w-6xl space-y-6 animate-in slide-in-from-bottom">
              <h2 className="text-[8rem] font-black text-center mb-20 flex items-center justify-center gap-10 leading-none">
                <Trophy className="text-yellow-400" size={150} /> Results
              </h2>
              {[...players].sort((a,b) => {
                const getScore = (p) => {
                  const itemsOwned = items.filter(i => (p.inventory || []).includes(i.id));
                  const mistakePenalty = items.filter(i => i.returned && i.artistId === p.id).length * 100;
                  let objBonus = 0;
                  if (p.objective?.id === 'HOARDER' && (p.inventory?.length || 0) >= 3) objBonus = 400;
                  if (p.objective?.id === 'BARGAIN' && itemsOwned.some(i => i.pricePaid < 100)) objBonus = 300;
                  if (p.objective?.id === 'PRODUCER' && items.some(i => i.artistId === p.id && i.ownerId && i.ownerId !== p.id)) objBonus = 300;
                  if (p.objective?.id === 'FAN_FAVE' && p.votes >= 2) objBonus = 500;
                  if (p.objective?.id === 'THRIFTY' && p.cash > 400) objBonus = 300;
                  return (p.cash || 0) + (p.votes || 0) * 200 - mistakePenalty + objBonus;
                };
                return getScore(b) - getScore(a);
              }).map((p, i) => {
                const mistakePenalty = items.filter(i => i.returned && i.artistId === p.id).length * 100;
                let objBonus = 0;
                const itemsOwned = items.filter(i => (p.inventory || []).includes(i.id));
                if (p.objective?.id === 'HOARDER' && (p.inventory?.length || 0) >= 3) objBonus = 400;
                if (p.objective?.id === 'BARGAIN' && itemsOwned.some(i => i.pricePaid < 100)) objBonus = 300;
                if (p.objective?.id === 'PRODUCER' && items.some(i => i.artistId === p.id && i.ownerId && i.ownerId !== p.id)) objBonus = 300;
                if (p.objective?.id === 'FAN_FAVE' && p.votes >= 2) objBonus = 500;
                if (p.objective?.id === 'THRIFTY' && p.cash > 400) objBonus = 300;
                const totalScore = (p.cash || 0) + (p.votes || 0) * 200 - mistakePenalty + objBonus;
                return (
                  <div key={p.id} className="bg-white p-10 rounded-[3rem] shadow-2xl flex items-center justify-between border-l-[30px] border-indigo-500 transform transition-all hover:-translate-x-6">
                    <div className="flex items-center gap-12">
                      <span className="text-8xl font-black text-slate-200">#{i+1}</span>
                      <div>
                        <h3 className="text-6xl font-black text-slate-800 mb-2">{p.name}</h3>
                        <div className="flex gap-10 text-2xl text-slate-400 font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-2"><Star className="text-indigo-400" /> Votes: {p.votes || 0}</span>
                          {objBonus > 0 && <span className="text-green-500 flex items-center gap-2"><Target /> {p.objective.title}: +${objBonus}</span>}
                          <span className="text-red-400">Mistakes: -${mistakePenalty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-9xl font-black text-indigo-600 font-mono tracking-tighter leading-none">${totalScore}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-12 right-12 bg-white p-8 rounded-full shadow-2xl text-slate-600 z-50 hover:scale-110 transition-transform">
          {isMuted ? <VolumeX size={50} /> : <Volume2 size={50} />}
        </button>
      </div>
    );
  }

  // --- Mobile Client ---
  const me = players.find(p => p.id === user?.uid);
  const isPanic = room?.phase === PHASES.AUCTION && (room.currentAuction?.timer || 0) < 5;

  return (
    <div className={`min-h-[100dvh] flex flex-col max-w-md mx-auto relative overflow-hidden font-sans transition-colors duration-200 ${isPanic ? 'bg-red-500 animate-pulse' : 'bg-slate-50'}`}>
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center z-10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center font-black text-3xl shadow-inner shadow-black/30">
            {name ? name[0] : me?.name ? me.name[0] : '?'}
          </div>
          <div>
            <span className="font-black text-lg tracking-tight block leading-none mb-1">{name || me?.name || 'Curator'}</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 uppercase font-black tracking-widest">
              Stock: {me?.inventory?.length || 0}/3
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700 shadow-inner">
          <Coins size={24} className="text-yellow-400" />
          <span className="font-mono font-black text-2xl tracking-tighter">${me?.cash || 0}</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {!room ? (
          <div className="p-16 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Connecting...</div>
        ) : room.phase === PHASES.LOBBY ? (
          <div className="p-8 text-center space-y-10 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <Users size={120} className="text-indigo-500 animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-lg">!</div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter">Joined!</h2>
              {me?.objective && (
                <div className="bg-white p-6 rounded-[2.5rem] border-4 border-indigo-100 shadow-xl animate-in fade-in slide-in-from-bottom delay-500">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center justify-center gap-2"><Target size={14}/> Secret Endowment</p>
                  <h3 className="text-2xl font-black text-slate-800">{me.objective.title}</h3>
                  <p className="text-slate-500 font-bold text-sm italic mt-1">{me.objective.desc}</p>
                </div>
              )}
            </div>
          </div>
        ) : room.phase === PHASES.STUDIO_DRAW ? (
          <>
            {me?.ready ? (
              <div className="p-16 text-center space-y-8 flex flex-col items-center justify-center min-h-[60vh] animate-in slide-in-from-bottom">
                <CheckCircle2 size={140} className="text-indigo-500" />
                <h3 className="text-4xl font-black text-slate-900 uppercase italic leading-none">Art Delivered</h3>
                <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Waiting for others to finish their mistakes.</p>
              </div>
            ) : (
              <DrawingCanvas key={currentPromptIdx} prompt={PROMPTS[currentPromptIdx % PROMPTS.length]} timeLimit={90} onSave={handleDrawingSubmit} />
            )}
          </>
        ) : room.phase === PHASES.STUDIO_APPRAISE ? (
          <div className="p-6 space-y-6">
            {me?.ready ? (
               <div className="p-16 text-center space-y-8 flex flex-col items-center justify-center min-h-[60vh]">
                 <CheckCircle2 size={140} className="text-indigo-500" />
                 <h3 className="text-4xl font-black text-slate-900 uppercase italic leading-none">Certified!</h3>
                 <p className="text-slate-400 font-black tracking-widest uppercase text-xs">The catalog is at the printers.</p>
               </div>
            ) : (
              <>
                {items.filter(i => i.artistId !== user?.uid && !i.appraised).slice(0, 1).map(item => (
                  <div key={item.id} className="space-y-6 animate-in zoom-in">
                    <div className="text-center">
                      <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter">APPRAISE</h2>
                      <p className="text-slate-500 font-black uppercase text-xs tracking-widest mt-1">Assign Name & Significance</p>
                    </div>
                    <div className="aspect-square bg-white rounded-[3.5rem] border-[12px] border-white shadow-2xl overflow-hidden">
                      <img src={item.image} className="w-full h-full object-contain p-2 bg-slate-50" />
                    </div>
                    <div className="space-y-4 pt-4">
                      <input type="text" id="appraisal-title" placeholder="Give it a title..." className="w-full p-6 bg-white rounded-2xl border-4 border-slate-200 font-black text-2xl outline-none focus:border-indigo-500 shadow-inner" />
                      <textarea id="appraisal-history" placeholder="Write a short history..." className="w-full p-6 bg-white rounded-2xl border-4 border-slate-200 font-black text-lg outline-none focus:border-indigo-500 h-28 shadow-inner" />
                      <button onClick={() => {
                          const t = document.getElementById('appraisal-title').value;
                          const h = document.getElementById('appraisal-history').value;
                          if (t && h) submitAppraisal(item.id, t, h);
                        }} className="w-full py-7 bg-indigo-600 text-white rounded-3xl font-black text-3xl shadow-xl active:scale-95 transition-all border-b-8 border-indigo-800 uppercase tracking-tighter"
                      >Submit Report</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : room.phase === PHASES.AUCTION && room.currentAuction ? (
          <div className="p-6 space-y-8 min-h-[85vh] flex flex-col justify-center animate-in fade-in">
            <div className="text-center space-y-1">
              <p className={`text-xs font-black uppercase tracking-[0.3em] ${isPanic ? 'text-white' : 'text-slate-400'}`}>Auction Block</p>
              <h3 className={`text-3xl font-black leading-tight ${isPanic ? 'text-white' : 'text-slate-900'}`}>"{room.currentAuction.item.title || "Unknown Art"}"</h3>
            </div>

            <div className={`w-full bg-slate-900 rounded-[4rem] p-12 text-center text-white shadow-2xl relative border-8 ${(me?.inventory?.length || 0) >= 3 ? 'border-red-600' : isPanic ? 'border-white animate-bounce' : 'border-indigo-500'}`}>
              <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-40">Highest Bid</p>
              <p className="text-8xl font-black font-mono tracking-tighter leading-none">${room.currentAuction.highestBid}</p>
              <p className="text-indigo-400 mt-6 font-black text-2xl uppercase italic tracking-tighter leading-none">{room.currentAuction.highestBidderName || "NO BIDS"}</p>
              
              {(me?.inventory?.length || 0) >= 3 && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 rounded-[4rem] text-center border-4 border-red-500 animate-in zoom-in">
                  <AlertCircle size={80} className="text-red-500 mb-4" />
                  <p className="font-black text-3xl text-white italic tracking-tighter leading-none uppercase">WING FULL</p>
                  <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px]">No more bidding!</p>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[10, 50].map(amt => (
                  <button key={amt} disabled={(me?.inventory?.length || 0) >= 3} onClick={() => placeBid((room.currentAuction.highestBid || 0) + amt)} className={`py-6 rounded-3xl font-black text-3xl shadow-xl transition-all border-b-8 active:border-b-0 active:translate-y-2 ${isPanic ? 'bg-white text-red-600 border-slate-200' : 'bg-white text-indigo-600 border-slate-200'}`}>+${amt}</button>
                ))}
              </div>
              {/* Refined Bid Button: No random dollar, acts as a "Hammer Bid" (+50) */}
              <button disabled={(me?.inventory?.length || 0) >= 3} onClick={() => placeBid((room.currentAuction.highestBid || 0) + 50)} className={`w-full py-10 rounded-[3rem] font-black text-5xl shadow-2xl active:scale-95 transition-all border-b-[12px] ${isPanic ? 'bg-white text-red-600 border-slate-200 animate-pulse' : 'bg-indigo-600 text-white border-indigo-800'}`}>PLACE BID</button>
            </div>
          </div>
        ) : room.phase === PHASES.CURATION ? (
          <div className="p-8 space-y-8 animate-in slide-in-from-right">
            <div className="bg-indigo-600 text-white p-8 rounded-[3rem] space-y-4 shadow-2xl border-b-[12px] border-indigo-800">
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 leading-none">Exhibition Theme</p>
              <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">{room.theme}</h2>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">1. Exhibit Name</p>
                <input type="text" id="w-title" placeholder="A Clever Title..." className="w-full p-6 bg-white rounded-3xl border-4 border-slate-200 font-black text-2xl outline-none focus:border-indigo-500 shadow-inner" />
              </div>
              <div className="space-y-4">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2 italic">2. Your Collection (All 3 pieces)</p>
                <div className="grid grid-cols-3 gap-4">
                  {items.filter(i => (me?.inventory || []).includes(i.id)).map(item => (
                    <div key={item.id} className="aspect-square bg-white rounded-3xl border-4 border-indigo-500 overflow-hidden shadow-xl p-1 animate-in zoom-in">
                      <img src={item.image} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => {
                const title = document.getElementById('w-title').value;
                updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { wingTitle: title || "Modern Art", ready: true });
              }} className="w-full py-10 bg-indigo-600 text-white rounded-[3rem] font-black text-4xl shadow-2xl border-b-[15px] border-indigo-800 uppercase italic tracking-tighter">Open Exhibit</button>
            </div>
          </div>
        ) : room.phase === PHASES.VOTING && !me?.ready ? (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom">
            <div className="text-center space-y-1">
              <h2 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Cast Your Vote</h2>
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Who curated the best wing?</p>
            </div>
            <div className="space-y-5">
              {players.filter(p => p.id !== user.uid && p.wingTitle).map(p => (
                <button key={p.id} onClick={async () => {
                  if (navigator.vibrate) navigator.vibrate(100);
                  const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', p.id);
                  const snap = await getDoc(pRef);
                  await updateDoc(pRef, { votes: (snap.data().votes || 0) + 1 });
                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true });
                }} className="w-full bg-white p-8 rounded-[3rem] border-4 border-slate-200 shadow-2xl text-left border-b-[12px] active:translate-y-2 active:border-b-0 transition-all border-indigo-100">
                  <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic leading-none">{p.name}'s Collection</p>
                  <p className="text-4xl font-black text-slate-800 leading-none">"{p.wingTitle}"</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-16 text-center space-y-10 flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in">
            <div className="relative">
              <CheckCircle2 size={160} className="text-indigo-500 animate-bounce" />
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center font-black shadow-lg">✓</div>
            </div>
            <div className="space-y-4">
              <h3 className="text-6xl font-black text-slate-900 uppercase italic leading-none tracking-tighter">Done!</h3>
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm">Watch the big screen</p>
            </div>
          </div>
        )}
      </main>

      <div className="bg-white border-t-8 border-slate-200 p-8 flex justify-around items-center text-slate-400 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
         <div className={`flex flex-col items-center ${room?.phase?.includes('STUDIO') ? 'text-indigo-600 scale-150' : 'opacity-10'} transition-all duration-500`}><Palette size={35} /></div>
         <div className={`flex flex-col items-center ${room?.phase === PHASES.AUCTION ? 'text-indigo-600 scale-150' : 'opacity-10'} transition-all duration-500`}><Gavel size={35} /></div>
         <div className={`flex flex-col items-center ${room?.phase === PHASES.RESULTS ? 'text-indigo-600 scale-150' : 'opacity-10'} transition-all duration-500`}><Award size={35} /></div>
      </div>
    </div>
  );
}