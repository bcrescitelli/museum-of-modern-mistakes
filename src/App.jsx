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
  TrendingDown, Trophy, Coins, Volume2, VolumeX,
  PlusCircle, MinusCircle, AlertCircle, History,
  PenTool
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
    
    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener('resize', initCanvas);
    };
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
        if (prev <= 1) {
          handleSave();
          clearInterval(timer);
          return 0;
        }
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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Draw This:</p>
          <h2 className="text-lg font-black text-white leading-tight truncate">{prompt}</h2>
        </div>
        <div className={`px-4 py-2 rounded-xl font-mono text-xl font-bold ${timeLeft < 10 ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'} text-white`}>
          {timeLeft}s
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 relative bg-white rounded-[2rem] shadow-2xl overflow-hidden touch-none cursor-crosshair border-8 border-slate-800"
      >
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
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2 flex-wrap flex-1">
            {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#78350f', '#64748b', '#ffffff'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full border-4 ${color === c ? 'border-indigo-400 scale-110' : 'border-slate-700 hover:scale-105'} transition-all shadow-lg`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button onClick={() => contextRef.current.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors">
            <Trash2 size={24} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-2xl">
          <Pencil size={20} className="text-slate-400" />
          <input type="range" min="2" max="30" value={thickness} onChange={(e) => setThickness(parseInt(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
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
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
    if (room?.phase === PHASES.RESULTS && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isMuted, room?.phase]);

  // Host Loop logic with race-condition protection
  useEffect(() => {
    if (view !== 'host' || !room) return;
    let timer;

    // Safety: Don't check readiness until phase has been active for at least 3 seconds
    const phaseUptime = Date.now() - (room.phaseStartedAt || 0);
    const isSettled = phaseUptime > 3000;

    // Phase transitions
    if (isSettled && players.length > 0 && players.every(p => p.ready)) {
      if (room.phase === PHASES.STUDIO_DRAW) startPhase(PHASES.STUDIO_APPRAISE);
      else if (room.phase === PHASES.STUDIO_APPRAISE) startPhase(PHASES.AUCTION);
      else if (room.phase === PHASES.CURATION) startPhase(PHASES.PRESENTATION);
      else if (room.phase === PHASES.VOTING) startPhase(PHASES.RESULTS);
      return;
    }

    // Presentation logic
    if (room.phase === PHASES.PRESENTATION) {
      timer = setInterval(async () => {
        const currentIdx = room.presentingIdx || 0;
        if (room.presentationTimer > 0) {
          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), { presentationTimer: room.presentationTimer - 1 });
        } else {
          if (currentIdx < players.length - 1) {
            updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), { presentingIdx: currentIdx + 1, presentationTimer: 10 });
          } else {
            startPhase(PHASES.VOTING);
          }
        }
      }, 1000);
    }

    // Auction logic
    if (room.phase === PHASES.AUCTION) {
      if (!room.currentAuction) {
        const nextItem = items.find(i => i.appraised && !i.auctioned);
        if (nextItem) {
          const isDutch = Math.random() > 0.6;
          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
            currentAuction: {
              itemId: nextItem.id,
              item: nextItem,
              type: isDutch ? 'DUTCH' : 'STANDARD',
              highestBid: isDutch ? 1000 : 0,
              highestBidder: null,
              highestBidderName: null,
              timer: isDutch ? 1000 : 15 
            }
          });
        } else if (items.length > 0 && items.every(i => i.auctioned)) {
          startPhase(PHASES.CURATION);
        }
      } else {
        timer = setInterval(async () => {
          const auction = room.currentAuction;
          const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
          
          if (auction.type === 'STANDARD') {
            if (auction.timer <= 0) {
              clearInterval(timer);
              finalizeAuction();
            } else {
              updateDoc(roomRef, { 'currentAuction.timer': auction.timer - 1 });
            }
          } else if (auction.type === 'DUTCH') {
            if (auction.highestBid <= 50) {
              clearInterval(timer);
              finalizeAuction();
            } else {
              updateDoc(roomRef, { 'currentAuction.highestBid': auction.highestBid - 25 });
            }
          }
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
      await updateDoc(itemRef, { ownerId: auction.highestBidder, pricePaid: auction.highestBid, auctioned: true });
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
    const data = { 
      phase, 
      phaseStartedAt: Date.now(),
      presentingIdx: 0,
      presentationTimer: 10
    };
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), data);
    
    // Reset player ready states one by one
    for (const p of players) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', p.id), { ready: false });
    }
  };

  const placeBid = async (amount) => {
    const me = players.find(p => p.id === user?.uid);
    if (!room?.currentAuction || !me || (me.inventory?.length || 0) >= 3) return;
    const auction = room.currentAuction;
    if (amount > me.cash) return;

    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
      const roomSnap = await transaction.get(roomRef);
      const current = roomSnap.data().currentAuction;

      if (current.type === 'DUTCH') {
        transaction.update(roomRef, {
          'currentAuction.highestBidder': user.uid,
          'currentAuction.highestBidderName': name,
          'currentAuction.timer': 0, 
          'currentAuction.highestBid': current.highestBid
        });
      } else {
        if (amount <= current.highestBid) return;
        transaction.update(roomRef, {
          'currentAuction.highestBid': amount,
          'currentAuction.highestBidder': user.uid,
          'currentAuction.highestBidderName': name,
          'currentAuction.timer': 7 
        });
      }
    });
  };

  const hostGame = async () => {
    if (!audioRef.current) {
      const audio = new Audio('/intro.mp3');
      audio.loop = true;
      audio.volume = 0.3;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
    const code = generateRoomCode();
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code), {
      hostId: user.uid, phase: PHASES.LOBBY, theme: THEMES[Math.floor(Math.random() * THEMES.length)], currentAuction: null, phaseStartedAt: Date.now()
    });
    setRoomId(code); setView('host');
  };

  const joinGame = async (code) => {
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code.toUpperCase());
    const snap = await getDoc(roomRef);
    if (!snap.exists()) { setStatusMsg("Invalid Room"); return; }
    await setDoc(doc(roomRef, 'players', user.uid), { name, cash: 1000, inventory: [], ready: false, votes: 0, wingTitle: '' });
    setRoomId(code.toUpperCase()); setView('client');
  };

  const handleDrawingSubmit = async (dataUrl) => {
    const itemRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items'));
    await setDoc(itemRef, {
      id: itemRef.id, artistId: user.uid, artistName: name, image: dataUrl,
      prompt: PROMPTS[currentPromptIdx % PROMPTS.length],
      title: '', history: '', appraised: false, ownerId: null, pricePaid: 0, auctioned: false
    });
    
    if (currentPromptIdx < 2) {
      setCurrentPromptIdx(prev => prev + 1);
    } else {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true });
    }
  };

  const submitAppraisal = async (itemId, title, history) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items', itemId), {
      title, history, appraised: true, appraiserId: user.uid
    });
    const remaining = items.filter(i => i.artistId !== user.uid && !i.appraised && i.id !== itemId);
    if (remaining.length === 0) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true });
    }
  };

  // --- Views ---

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-md w-full space-y-10 text-center">
          <div className="space-y-2 transform -rotate-2">
            <h1 className="text-7xl font-black tracking-tighter text-indigo-400 drop-shadow-2xl">MMM</h1>
            <p className="text-xl font-medium text-slate-400 italic">Museum of Modern Mistakes</p>
          </div>
          <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-slate-700 space-y-6">
            <input type="text" placeholder="Curator Name" className="w-full p-5 bg-slate-900 rounded-2xl border border-slate-700 focus:border-indigo-500 text-lg outline-none" value={name} onChange={e => setName(e.target.value)} />
            <input type="text" placeholder="Room Code" className="w-full p-5 bg-slate-900 rounded-2xl border border-slate-700 text-center font-mono text-2xl tracking-widest uppercase outline-none" value={roomId} onChange={e => setRoomId(e.target.value)} />
            <button onClick={() => joinGame(roomId)} disabled={!name || !roomId} className="w-full py-5 bg-indigo-600 rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition-all">JOIN GALLERY</button>
            <div className="flex items-center gap-4 text-slate-500 py-2"><hr className="flex-1 border-slate-700" /><span>OR</span><hr className="flex-1 border-slate-700" /></div>
            <button onClick={hostGame} className="w-full py-4 bg-slate-700 rounded-2xl font-bold hover:bg-slate-600 transition-all">HOST EXHIBITION</button>
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
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Main Display Screen</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-indigo-600 text-center transform -rotate-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">Join Code</p>
            <p className="text-6xl font-black text-slate-900 tracking-tighter">{room?.id}</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          {room?.phase === PHASES.LOBBY && (
            <div className="text-center space-y-12 max-w-5xl">
              <h2 className="text-5xl font-black text-slate-800 drop-shadow-sm">Welcome, Curators</h2>
              <div className="flex flex-wrap justify-center gap-6">
                {players.map(p => (
                  <div key={p.id} className="bg-white px-10 py-5 rounded-3xl shadow-xl border-b-8 border-indigo-200 font-black text-2xl animate-in zoom-in">{p.name}</div>
                ))}
              </div>
              {players.length >= 2 && <button onClick={() => startPhase(PHASES.STUDIO_DRAW)} className="px-16 py-6 bg-indigo-600 text-white rounded-3xl font-black text-3xl shadow-2xl hover:scale-110 transition-transform">START THE STUDIO</button>}
            </div>
          )}

          {(room?.phase === PHASES.STUDIO_DRAW || room?.phase === PHASES.STUDIO_APPRAISE) && (
            <div className="text-center space-y-12 animate-in zoom-in">
              {room.phase === PHASES.STUDIO_DRAW ? <PenTool size={100} className="mx-auto text-indigo-500 animate-bounce" /> : <History size={100} className="mx-auto text-orange-500 animate-spin-slow" />}
              <h2 className="text-6xl font-black text-slate-900">
                {room.phase === PHASES.STUDIO_DRAW ? "Creation Phase" : "Appraisal Phase"}
              </h2>
              <p className="text-2xl text-slate-500 font-medium italic">
                {room.phase === PHASES.STUDIO_DRAW ? "Sketching masterpieces..." : "Assigning titles and histories..."}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {players.map(p => (
                   <div key={p.id} className="flex flex-col items-center gap-2">
                     <div className={`w-6 h-6 rounded-full ${p.ready ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                     <p className="text-xs font-bold text-slate-400 uppercase">{p.name}</p>
                   </div>
                ))}
              </div>
            </div>
          )}

          {room?.phase === PHASES.AUCTION && (
            room.currentAuction ? (
              <div className="w-full max-w-6xl grid grid-cols-2 gap-16 animate-in fade-in slide-in-from-bottom duration-700">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl space-y-8 border-4 border-white">
                  <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-100">
                    <img src={room.currentAuction.item.image} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-5xl font-black text-slate-900 leading-tight">{room.currentAuction.item.title || "Untitled Masterpiece"}</h3>
                    <p className="text-2xl text-slate-500 mt-4 italic font-medium leading-relaxed">"{room.currentAuction.item.history || "A mystery of the modern world."}"</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center space-y-10">
                  <div className={`p-16 rounded-[3rem] shadow-2xl text-center space-y-6 ${room.currentAuction.type === 'DUTCH' ? 'bg-orange-600' : 'bg-indigo-900'} text-white relative`}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-8 py-2 rounded-full font-black text-sm uppercase shadow-lg">
                      {room.currentAuction.type} Auction
                    </div>
                    <p className="text-9xl font-black tracking-tighter font-mono">${room.currentAuction.highestBid}</p>
                    <p className="text-3xl font-bold opacity-90">{room.currentAuction.highestBidderName || "Waiting for curator..."}</p>
                  </div>
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-xl flex items-center justify-between border-b-8 border-slate-200">
                    <div className="flex items-center gap-6">
                      <Timer className={`text-slate-300 ${room.currentAuction.timer < 5 ? 'text-red-500 animate-pulse' : ''}`} size={48} />
                      <span className="text-5xl font-black font-mono">{room.currentAuction.type === 'DUTCH' ? '-' : (room.currentAuction.timer || 0) + 's'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Artist</p>
                      <p className="text-3xl font-black text-slate-800">{room.currentAuction.item.artistName}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <Gavel size={80} className="mx-auto text-indigo-500 animate-bounce" />
                <h2 className="text-4xl font-black text-slate-800">Preparing Next Lot...</h2>
              </div>
            )
          )}

          {room?.phase === PHASES.PRESENTATION && (
            <div className="w-full max-w-5xl space-y-12 text-center animate-in zoom-in duration-500">
              {players[room.presentingIdx] && (
                <>
                  <div className="space-y-4">
                    <p className="text-indigo-600 font-black text-2xl uppercase tracking-[0.2em]">{players[room.presentingIdx].name} Presents:</p>
                    <h2 className="text-8xl font-black text-slate-900">"{players[room.presentingIdx].wingTitle}"</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    {items.filter(i => players[room.presentingIdx].finalInventory?.includes(i.id)).map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[3rem] shadow-2xl transform rotate-1 border-2 border-slate-100">
                        <img src={item.image} className="w-full aspect-square object-contain mb-6" />
                        <h4 className="text-3xl font-black text-slate-800">{item.title}</h4>
                        <p className="text-slate-500 italic mt-2 font-medium">"{item.history}"</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {room?.phase === PHASES.RESULTS && (
            <div className="w-full max-w-4xl space-y-8">
              <h2 className="text-7xl font-black text-center mb-16 flex items-center justify-center gap-6">
                <Trophy className="text-yellow-500" size={80} /> Lead Curator
              </h2>
              {[...players].sort((a,b) => {
                const getScore = (p) => (p.cash || 0) + (p.votes || 0) * 200 - (items.filter(i => i.returned && i.artistId === p.id).length * 100);
                return getScore(b) - getScore(a);
              }).map((p, i) => {
                const mistakePenalty = items.filter(i => i.returned && i.artistId === p.id).length * 100;
                const totalScore = (p.cash || 0) + (p.votes || 0) * 200 - mistakePenalty;
                return (
                  <div key={p.id} className="bg-white p-8 rounded-3xl shadow-xl flex items-center justify-between border-l-[16px] border-indigo-500 transform transition-all hover:-translate-x-2">
                    <div className="flex items-center gap-10">
                      <span className="text-5xl font-black text-slate-200">#{i+1}</span>
                      <div>
                        <h3 className="text-4xl font-black text-slate-800">{p.name}</h3>
                        <div className="flex gap-6 mt-2 text-slate-500 font-bold">
                          <span>Cash: ${p.cash}</span>
                          <span className="text-indigo-400">Votes: {p.votes || 0}</span>
                          <span className="text-red-400">Mistakes: -${mistakePenalty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-4xl font-black text-indigo-600 font-mono">${totalScore}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-12 right-12 bg-white p-6 rounded-full shadow-2xl text-slate-600 z-50 hover:scale-110 transition-transform">
          {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
        </button>
      </div>
    );
  }

  // --- Mobile Client ---
  const me = players.find(p => p.id === user?.uid);

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden font-sans">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center font-black text-xl">
            {name ? name[0] : me?.name ? me.name[0] : '?'}
          </div>
          <span className="font-black tracking-tight truncate max-w-[100px]">{name || me?.name || 'Curator'}</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-inner">
            <Coins size={16} className="text-yellow-400" />
            <span className="font-mono font-black text-lg">${me?.cash || 0}</span>
          </div>
          <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">Inventory: {me?.inventory?.length || 0}/3</p>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
        {!room ? (
          <div className="p-16 text-center text-slate-400 italic">Waiting for connection...</div>
        ) : room.phase === PHASES.LOBBY ? (
          <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
            <Users size={80} className="text-indigo-500 animate-pulse" />
            <h2 className="text-3xl font-black">Waiting for Lobby...</h2>
            <p className="text-slate-500 font-medium">Sit tight! The host will begin the studio shortly.</p>
          </div>
        ) : room.phase === PHASES.STUDIO_DRAW ? (
          <>
            {me?.ready ? (
              <div className="p-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
                <CheckCircle2 size={100} className="text-indigo-500 animate-bounce" />
                <h3 className="text-3xl font-black text-slate-900">Masterpieces Sent!</h3>
                <p className="text-slate-500 font-medium italic">Wait for the appraisal phase to begin.</p>
              </div>
            ) : (
              <DrawingCanvas key={currentPromptIdx} prompt={PROMPTS[currentPromptIdx % PROMPTS.length]} timeLimit={90} onSave={handleDrawingSubmit} />
            )}
          </>
        ) : room.phase === PHASES.STUDIO_APPRAISE ? (
          <div className="p-6 space-y-6 animate-in slide-in-from-bottom">
            {me?.ready ? (
               <div className="p-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
                 <CheckCircle2 size={100} className="text-indigo-500 animate-bounce" />
                 <h3 className="text-3xl font-black text-slate-900">Appraisal Complete!</h3>
                 <p className="text-slate-500 font-medium italic">Preparing the auction catalog...</p>
               </div>
            ) : (
              <>
                {items.filter(i => i.artistId !== user?.uid && !i.appraised).slice(0, 1).map(item => (
                  <div key={item.id} className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-black text-slate-900">Step 2: Appraisal</h2>
                      <p className="text-slate-500 font-medium italic">Give this artifact a Name and a History.</p>
                    </div>
                    <div className="aspect-square bg-white rounded-3xl border-4 border-slate-200 p-2 shadow-xl">
                      <img src={item.image} className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Formal Name</label>
                        <input 
                          type="text" id="appraisal-title" 
                          placeholder="e.g. The Gilded Pretzel"
                          className="w-full p-4 bg-white rounded-2xl border-4 border-slate-200 font-black outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Brief History</label>
                        <textarea 
                          id="appraisal-history" 
                          placeholder="e.g. Once owned by a very salty Queen..."
                          className="w-full p-4 bg-white rounded-2xl border-4 border-slate-200 font-black outline-none focus:border-indigo-500 transition-colors h-24"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const t = document.getElementById('appraisal-title').value;
                          const h = document.getElementById('appraisal-history').value;
                          if (t && h) submitAppraisal(item.id, t, h);
                        }}
                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all"
                      >
                        SUBMIT APPRAISAL
                      </button>
                    </div>
                  </div>
                ))}
                {items.filter(i => i.artistId !== user?.uid && !i.appraised).length === 0 && (
                  <div className="p-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
                    <CheckCircle2 size={100} className="text-indigo-500 animate-bounce" />
                    <h3 className="text-3xl font-black text-slate-900">Wait for items...</h3>
                    <p className="text-slate-500 font-medium italic">Others are still painting!</p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : room.phase === PHASES.AUCTION && room.currentAuction ? (
          <div className="p-6 space-y-8 min-h-[80vh] flex flex-col justify-center animate-in fade-in">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-slate-900 leading-tight">Lot: {room.currentAuction.item.title || "Unknown Art"}</h3>
              <div className="inline-block px-4 py-1 bg-slate-200 rounded-full text-xs font-black uppercase text-slate-600">
                {room.currentAuction.type} Style
              </div>
            </div>

            <div className={`w-full bg-slate-900 rounded-[3rem] p-12 text-center text-white shadow-2xl relative border-4 ${(me?.inventory?.length || 0) >= 3 ? 'border-red-500' : 'border-indigo-500'}`}>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Current Price</p>
              <p className="text-8xl font-black font-mono tracking-tighter">${room.currentAuction.highestBid}</p>
              <p className="text-indigo-400 mt-4 font-black text-xl">{room.currentAuction.highestBidderName || "---"}</p>
              {(me?.inventory?.length || 0) >= 3 && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-8 rounded-[3rem] text-center">
                  <AlertCircle size={48} className="text-red-500 mb-2" />
                  <p className="font-black text-lg">MUSEUM FULL</p>
                  <p className="text-sm opacity-70">You already have 3 pieces! You cannot bid.</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[10, 50, 100, 250].map(amt => (
                  <button key={amt} disabled={(me?.inventory?.length || 0) >= 3} onClick={() => placeBid((room.currentAuction.highestBid || 0) + amt)} className="py-4 bg-white border-4 border-slate-200 rounded-2xl font-black text-indigo-600 shadow-sm active:scale-95 disabled:opacity-50 transition-all">
                    +${amt}
                  </button>
                ))}
              </div>
              <button 
                disabled={(me?.inventory?.length || 0) >= 3}
                onClick={() => placeBid(room.currentAuction.type === 'DUTCH' ? room.currentAuction.highestBid : (room.currentAuction.highestBid || 0) + 1)} 
                className={`w-full py-8 text-white rounded-[2rem] font-black text-3xl shadow-xl active:scale-95 transition-all ${room.currentAuction.type === 'DUTCH' ? 'bg-orange-600' : 'bg-indigo-600'} disabled:opacity-50`}
              >
                {room.currentAuction.type === 'DUTCH' ? 'BUY NOW' : 'PLACE BID'}
              </button>
            </div>
          </div>
        ) : room.phase === PHASES.CURATION ? (
          <div className="p-8 space-y-8 animate-in slide-in-from-right">
            <div className="bg-indigo-600 text-white p-8 rounded-[2rem] space-y-2 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-widest opacity-70">Exhibition Theme</p>
              <h2 className="text-3xl font-black">{room.theme}</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase">Step 1: Wing Title</p>
                <input type="text" id="w-title" placeholder="e.g. The First Selfie" className="w-full p-5 bg-white rounded-2xl border-4 border-slate-200 font-black text-lg outline-none focus:border-indigo-500" />
              </div>
              
              <div className="space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase">Step 2: Selection (Top 2)</p>
                <div className="grid grid-cols-3 gap-3">
                  {items.filter(i => i.ownerId === user?.uid).map(item => (
                    <div key={item.id} className="aspect-square bg-white rounded-2xl border-4 border-indigo-500 overflow-hidden relative">
                      <img src={item.image} className="w-full h-full object-contain p-1" />
                    </div>
                  ))}
                  {items.filter(i => i.ownerId === user?.uid).length === 0 && <p className="col-span-3 text-center text-slate-400 py-4 font-bold">You have no items!</p>}
                </div>
              </div>
              
              <button onClick={() => {
                const titleInput = document.getElementById('w-title');
                const title = titleInput ? titleInput.value : "My Wing";
                const inv = items.filter(i => i.ownerId === user?.uid).map(i => i.id).slice(0, 2);
                updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), {
                  wingTitle: title || "My Wing", finalInventory: inv, ready: true
                });
              }} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-2xl shadow-xl">OPEN MY WING</button>
            </div>
          </div>
        ) : room.phase === PHASES.VOTING && !me?.ready ? (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom">
            <h2 className="text-3xl font-black text-center text-slate-900 leading-tight">Cast Your Vote for Lead Curator</h2>
            <div className="space-y-4">
              {players.filter(p => p.id !== user.uid && p.wingTitle).map(p => (
                <button key={p.id} onClick={async () => {
                  const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', p.id);
                  const snap = await getDoc(pRef);
                  await updateDoc(pRef, { votes: (snap.data().votes || 0) + 1 });
                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true });
                }} className="w-full bg-white p-6 rounded-[2rem] border-4 border-slate-200 shadow-sm text-left active:border-indigo-500 hover:scale-[1.02] transition-all">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{p.name}'s Wing</p>
                  <p className="text-2xl font-black text-slate-800">"{p.wingTitle}"</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
            <CheckCircle2 size={100} className="text-indigo-500 animate-bounce" />
            <h3 className="text-3xl font-black text-slate-900">Finished!</h3>
            <p className="text-slate-500 font-medium italic">Look at the main screen for results.</p>
          </div>
        )}
      </main>

      <div className="bg-white border-t-2 border-slate-200 p-5 flex justify-around items-center text-slate-400">
         <div className={`flex flex-col items-center ${room?.phase?.includes('STUDIO') ? 'text-indigo-600' : 'opacity-40'}`}><Palette size={24} /></div>
         <div className={`flex flex-col items-center ${room?.phase === PHASES.AUCTION ? 'text-indigo-600' : 'opacity-40'}`}><Gavel size={24} /></div>
         <div className={`flex flex-col items-center ${room?.phase === PHASES.RESULTS ? 'text-indigo-600' : 'opacity-40'}`}><Award size={24} /></div>
      </div>
    </div>
  );
}