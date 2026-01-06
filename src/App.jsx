import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  deleteDoc, 
  arrayUnion, 
  runTransaction 
} from 'firebase/firestore';
import { 
  Palette, Pencil, Eraser, Trash2, Users, Timer, 
  Gavel, Image as ImageIcon, Award, ChevronRight, CheckCircle2,
  TrendingDown, Trophy, Coins, Info, Volume2, VolumeX
} from 'lucide-react';

// --- Configuration & Constants ---
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
  VOTING: 'VOTING',
  RESULTS: 'RESULTS'
};

const PROMPTS = [
  "A failed invention", "A cursed heirloom", "A luxury snack", 
  "A DIY haircut gone wrong", "The world's smallest problem", "A suspicious gift",
  "An invisible pet", "A really bad tattoo idea", "A sentient kitchen appliance",
  "A misinterpreted text message", "The ghost of a sandwich", "Forbidden modern art",
  "A very expensive mistake", "An awkward family secret", "A forgotten time capsule"
];

const THEMES = [
  "Items Found at the Bottom of the Ocean", "Gifts for a Bitter Ex",
  "Evidence of a Time Traveler", "Things That Make Me Feel Poor",
  "Found in a Haunted Basement", "Objects of Great Regret",
  "Relics of a Forgotten Future", "Art for People Who Hate Art"
];

// --- Utilities ---
const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

// --- Drawing Component ---
const DrawingCanvas = ({ onSave, prompt, timeLimit }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [thickness, setThickness] = useState(5);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const contextRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;

    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = thickness;
    contextRef.current = context;
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
    const dataUrl = canvasRef.current.toDataURL('image/png', 0.5);
    onSave(dataUrl);
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
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
    <div className="flex flex-col h-full bg-slate-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Draw This:</p>
          <h2 className="text-xl font-black text-slate-800">{prompt}</h2>
        </div>
        <div className={`px-4 py-1 rounded-full font-mono text-white ${timeLeft < 10 ? 'bg-red-500 animate-pulse' : 'bg-slate-800'}`}>
          {timeLeft}s
        </div>
      </div>
      
      <div className="flex-1 relative bg-white rounded-3xl shadow-inner border-4 border-slate-200 overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={() => setIsDrawing(false)}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex gap-1 flex-wrap">
          {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'].map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-black scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex-1 max-w-[120px]">
          <input type="range" min="1" max="20" value={thickness} onChange={(e) => setThickness(parseInt(e.target.value))} className="w-full accent-indigo-600" />
        </div>
        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Submit</button>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [items, setItems] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef(null);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        const cred = await signInAnonymously(auth);
        setUser(cred.user);
      } else {
        setUser(u);
      }
    });
    return unsub;
  }, []);

  // Room Listener
  useEffect(() => {
    if (!roomId || !user) return;
    const roomPath = ['artifacts', appId, 'public', 'data', 'rooms', roomId];
    
    const unsubRoom = onSnapshot(doc(db, ...roomPath), (doc) => {
      if (doc.exists()) setRoom({ id: doc.id, ...doc.data() });
    }, (err) => console.error("Room sync error", err));

    const unsubPlayers = onSnapshot(collection(db, ...roomPath, 'players'), (snap) => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubItems = onSnapshot(collection(db, ...roomPath, 'items'), (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubRoom(); unsubPlayers(); unsubItems(); };
  }, [roomId, user]);

  // Audio Control
  useEffect(() => {
    if (view === 'host' && !audioRef.current) {
      audioRef.current = new Audio('/intro.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => {});
    }

    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }

    if (room?.phase === PHASES.RESULTS && audioRef.current) {
      audioRef.current.pause();
    }

    return () => {
      if (view !== 'host' && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [view, isMuted, room?.phase]);

  // Host Loop logic
  useEffect(() => {
    if (view !== 'host' || !room) return;

    let timer;
    if (room.phase === PHASES.AUCTION && !room.currentAuction) {
      const nextItem = items.find(i => i.appraised && !i.ownerId && !i.auctioned);
      if (nextItem) {
        const isDutch = Math.random() > 0.5;
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
          currentAuction: {
            itemId: nextItem.id,
            item: nextItem,
            type: isDutch ? 'DUTCH' : 'STANDARD',
            highestBid: isDutch ? 1000 : 0,
            highestBidder: null,
            highestBidderName: null,
            timer: isDutch ? 1000 : 20
          }
        });
      } else if (items.length > 0 && items.every(i => i.auctioned || i.ownerId)) {
        startPhase(PHASES.CURATION);
      }
    }

    if (room.phase === PHASES.AUCTION && room.currentAuction) {
      timer = setInterval(async () => {
        const auction = room.currentAuction;
        if (auction.type === 'STANDARD') {
          if (auction.timer <= 0) {
            clearInterval(timer);
            await finalizeAuction();
          } else {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
              'currentAuction.timer': auction.timer - 1
            });
          }
        } else if (auction.type === 'DUTCH') {
          if (auction.highestBid <= 0) {
            clearInterval(timer);
            await finalizeAuction();
          } else {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
              'currentAuction.highestBid': Math.max(0, auction.highestBid - 25),
              'currentAuction.timer': Math.max(0, auction.highestBid - 25)
            });
          }
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [view, room?.phase, room?.currentAuction, items]);

  const finalizeAuction = async () => {
    const auction = room.currentAuction;
    const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items', auction.itemId);
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);

    if (auction.highestBidder) {
      await updateDoc(itemRef, { ownerId: auction.highestBidder, pricePaid: auction.highestBid, auctioned: true });
      const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', auction.highestBidder);
      const pSnap = await getDoc(pRef);
      await updateDoc(pRef, { 
        cash: (pSnap.data().cash || 0) - auction.highestBid,
        inventory: arrayUnion(auction.itemId)
      });
    } else {
      await updateDoc(itemRef, { ownerId: auction.item.artistId, pricePaid: 0, returned: true, auctioned: true });
      const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', auction.item.artistId);
      await updateDoc(pRef, { inventory: arrayUnion(auction.itemId) });
    }
    
    await updateDoc(roomRef, { currentAuction: null });
  };

  // Actions
  const hostGame = async () => {
    if (!user) return;
    const code = generateRoomCode();
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code), {
      hostId: user.uid,
      phase: PHASES.LOBBY,
      createdAt: Date.now(),
      theme: THEMES[Math.floor(Math.random() * THEMES.length)],
      currentAuction: null
    });
    setRoomId(code);
    setView('host');
  };

  const joinGame = async (code) => {
    if (!user || !name) return;
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code.toUpperCase());
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) { setStatusMsg("Invalid Room"); return; }
    await setDoc(doc(roomRef, 'players', user.uid), {
      name, cash: 1000, inventory: [], ready: false, votes: 0, wingTitle: ''
    });
    setRoomId(code.toUpperCase());
    setView('client');
  };

  const startPhase = async (phase) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), { phase });
    for (const p of players) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', p.id), { ready: false });
    }
  };

  const handleDrawingSubmit = async (dataUrl) => {
    const itemRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items'));
    await setDoc(itemRef, {
      id: itemRef.id, artistId: user.uid, artistName: name, image: dataUrl,
      prompt: PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
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
    const stillToAppraise = items.filter(i => i.artistId !== user.uid && !i.appraised).length;
    if (stillToAppraise <= 1) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true });
    }
  };

  const placeBid = async (amount) => {
    if (!room?.currentAuction) return;
    const auction = room.currentAuction;
    const me = players.find(p => p.id === user.uid);
    if (amount > me.cash) return;
    
    if (auction.type === 'DUTCH') {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
        'currentAuction.highestBidder': user.uid,
        'currentAuction.highestBidderName': name,
        'currentAuction.timer': 0,
        'currentAuction.highestBid': auction.highestBid
      });
    } else {
      if (amount <= auction.highestBid) return;
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
        'currentAuction.highestBid': amount,
        'currentAuction.highestBidder': user.uid,
        'currentAuction.highestBidderName': name,
        'currentAuction.timer': 15 
      });
    }
  };

  const submitCuration = async (title, selectedIds) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), {
      wingTitle: title,
      finalInventory: selectedIds,
      ready: true
    });
    // Check if everyone curated
    if (players.filter(p => p.id !== user.uid).every(p => p.ready)) {
      startPhase(PHASES.VOTING);
    }
  };

  const castVote = async (votedPlayerId) => {
    const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', votedPlayerId);
    const pSnap = await getDoc(pRef);
    await updateDoc(pRef, { votes: (pSnap.data().votes || 0) + 1 });
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true });
    if (players.filter(p => p.id !== user.uid).every(p => p.ready)) {
      startPhase(PHASES.RESULTS);
    }
  };

  // Views
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter text-indigo-400">MMM</h1>
            <p className="text-xl font-light text-slate-400 italic">Museum of Modern Mistakes</p>
          </div>
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 space-y-4">
            <input type="text" placeholder="Curator Name" className="w-full p-4 bg-slate-900 rounded-xl outline-none border border-slate-700 focus:border-indigo-500" value={name} onChange={e => setName(e.target.value)} />
            <input type="text" placeholder="Room Code" className="w-full p-4 bg-slate-900 rounded-xl outline-none border border-slate-700 focus:border-indigo-500 uppercase font-mono tracking-widest text-center" value={roomId} onChange={e => setRoomId(e.target.value)} />
            <button onClick={() => joinGame(roomId)} className="w-full py-4 bg-indigo-600 rounded-xl font-black text-lg hover:bg-indigo-500 transition-colors">Join Exhibit</button>
            <div className="flex items-center gap-4 text-slate-500"><hr className="flex-1 border-slate-700" /><span>OR</span><hr className="flex-1 border-slate-700" /></div>
            <button onClick={hostGame} className="w-full py-4 bg-slate-700 rounded-xl font-bold hover:bg-slate-600">Host New Gallery</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'host') {
    const renderPhaseInfo = () => {
      switch(room?.phase) {
        case PHASES.LOBBY:
          return (
            <div className="text-center space-y-8">
              <h2 className="text-4xl font-black text-slate-800">Waiting for Curators...</h2>
              <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
                {players.map(p => (
                  <div key={p.id} className="bg-white px-8 py-4 rounded-full shadow-lg border-b-4 border-indigo-200 font-bold text-xl">{p.name}</div>
                ))}
              </div>
              {players.length >= 2 && (
                <button onClick={() => startPhase(PHASES.STUDIO_DRAW)} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-2xl shadow-xl hover:scale-105 transition-transform">Begin Exhibition</button>
              )}
            </div>
          );
        case PHASES.STUDIO_DRAW:
          return (
            <div className="text-center space-y-4">
              <Timer size={64} className="mx-auto text-indigo-500 animate-pulse" />
              <h2 className="text-5xl font-black">Artists at Work</h2>
              <p className="text-2xl text-slate-500 italic">Curators are sketching the catalog items...</p>
              {players.length > 0 && players.every(p => p.ready) && <button onClick={() => startPhase(PHASES.STUDIO_APPRAISE)} className="px-8 py-3 bg-slate-800 text-white rounded-xl">Next: Appraisals</button>}
            </div>
          );
        case PHASES.STUDIO_APPRAISE:
          return (
            <div className="text-center space-y-4">
              <Palette size={64} className="mx-auto text-orange-500" />
              <h2 className="text-5xl font-black">Appraising Artifacts</h2>
              <p className="text-2xl text-slate-500 italic">Writing history for the modern age...</p>
              {players.length > 0 && players.every(p => p.ready) && <button onClick={() => startPhase(PHASES.AUCTION)} className="px-8 py-3 bg-slate-800 text-white rounded-xl">Open Auction Floor</button>}
            </div>
          );
        case PHASES.AUCTION:
          if (!room.currentAuction) return <div className="text-4xl font-black animate-pulse">Preparing Next Lot...</div>;
          const { item, type, highestBid, highestBidderName, timer } = room.currentAuction;
          return (
            <div className="w-full max-w-6xl grid grid-cols-2 gap-12">
              <div className="bg-white p-12 rounded-3xl shadow-2xl space-y-6">
                <img src={item.image} className="w-full aspect-square object-contain bg-slate-50 rounded-xl" />
                <div>
                  <h3 className="text-4xl font-black">{item.title}</h3>
                  <p className="text-xl text-slate-500 mt-2 italic">"{item.history}"</p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-8">
                <div className={`p-10 rounded-3xl shadow-2xl text-center space-y-4 ${type === 'DUTCH' ? 'bg-orange-600' : 'bg-indigo-900'} text-white`}>
                  <p className="uppercase font-bold tracking-widest opacity-75">{type} AUCTION</p>
                  <p className="text-9xl font-black">${highestBid}</p>
                  <p className="text-2xl font-medium">{highestBidderName || "No Bids Yet"}</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-lg flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <Timer className="text-slate-400" />
                     <span className="text-3xl font-mono font-bold">{type === 'DUTCH' ? '-' : timer + 's'}</span>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-bold text-slate-400 uppercase">Original Artist</p>
                     <p className="font-bold text-slate-700">{item.artistName}</p>
                   </div>
                </div>
              </div>
            </div>
          );
        case PHASES.RESULTS:
          const sorted = [...players].map(p => {
            const artistPenalty = items.filter(i => i.returned && i.artistId === p.id).length * 100;
            const voteBonus = (p.votes || 0) * 200;
            return { ...p, score: (p.cash || 0) + voteBonus - artistPenalty, voteBonus, artistPenalty };
          }).sort((a, b) => b.score - a.score);
          return (
            <div className="w-full max-w-4xl space-y-6">
              <h2 className="text-6xl font-black text-center mb-12 flex items-center justify-center gap-4">
                <Trophy className="text-yellow-500" size={60} /> Final Standings
              </h2>
              {sorted.map((p, i) => (
                <div key={p.id} className="bg-white p-6 rounded-2xl shadow-xl flex items-center justify-between border-l-8 border-indigo-500">
                  <div className="flex items-center gap-6">
                    <span className="text-4xl font-black text-slate-300">#{i+1}</span>
                    <div>
                      <h3 className="text-2xl font-bold">{p.name}</h3>
                      <p className="text-sm text-slate-500">Cash: ${p.cash} | Votes: +${p.voteBonus} | Mistakes: -${p.artistPenalty}</p>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-indigo-600">${p.score}</div>
                </div>
              ))}
            </div>
          );
        default:
          return <div className="text-3xl font-bold text-slate-400">Check your phones for updates...</div>;
      }
    };

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col p-12 relative">
        <button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-8 right-8 bg-white p-4 rounded-full shadow-xl text-slate-600 z-50">
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-black text-indigo-600">MODERN MISTAKES</h1>
            <p className="text-slate-500 font-medium">Global Curator Network</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-indigo-600 text-center transform -rotate-1">
            <p className="text-xs font-bold text-slate-400 uppercase">Room Code</p>
            <p className="text-5xl font-black tracking-tighter">{room?.id}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">{renderPhaseInfo()}</div>
      </div>
    );
  }

  // Client view logic
  const me = players.find(p => p.id === user?.uid);
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-hidden font-sans shadow-2xl">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold">{name ? name[0] : '?'}</div>
          <span className="font-bold text-sm tracking-tight">{name}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
          <Coins size={14} className="text-yellow-400" />
          <span className="font-mono font-bold text-sm">${me?.cash || 0}</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
        {!room ? (
          <div className="p-12 text-center text-slate-400 italic">Connecting to Gallery...</div>
        ) : room.phase === PHASES.LOBBY ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600 animate-bounce"><Users size={40} /></div>
            <h2 className="text-2xl font-black">Connected!</h2>
            <p className="text-slate-500">Wait for the host to start the exhibition. Browse the virtual lounge.</p>
          </div>
        ) : room.phase === PHASES.STUDIO_DRAW ? (
          <div className="h-full">
            {currentPromptIdx < 3 && !me?.ready ? (
              <DrawingCanvas key={currentPromptIdx} prompt={PROMPTS[currentPromptIdx % PROMPTS.length]} timeLimit={90} onSave={handleDrawingSubmit} />
            ) : (
              <div className="p-12 text-center space-y-4">
                <CheckCircle2 size={64} className="mx-auto text-green-500" />
                <h3 className="text-2xl font-black">Work Submitted!</h3>
                <p className="text-slate-500 italic">Waiting for the final touches from other artists...</p>
              </div>
            )}
          </div>
        ) : room.phase === PHASES.STUDIO_APPRAISE ? (
          <div className="p-6 space-y-6">
             {items.filter(i => i.artistId !== user?.uid && !i.appraised).length > 0 && !me?.ready ? (
               items.filter(i => i.artistId !== user?.uid && !i.appraised).slice(0, 1).map(item => (
                 <div key={item.id} className="space-y-4">
                   <div className="aspect-square bg-white rounded-3xl border-4 border-slate-200 p-2"><img src={item.image} className="w-full h-full object-contain" /></div>
                   <input type="text" id="t-in" placeholder="Catalog Name..." className="w-full p-4 bg-white rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500" />
                   <textarea id="h-in" placeholder="Short History (Fake or Real)..." className="w-full p-4 bg-white rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 h-24" />
                   <button onClick={() => submitAppraisal(item.id, document.getElementById('t-in').value, document.getElementById('h-in').value)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">Seal Appraisal</button>
                 </div>
               ))
             ) : (
               <div className="p-12 text-center space-y-4">
                 <CheckCircle2 size={48} className="mx-auto text-green-500" />
                 <h3 className="text-xl font-bold">Appraisal Ready</h3>
                 <p className="text-slate-500 italic">The auction catalog is being printed...</p>
               </div>
             )}
          </div>
        ) : room.phase === PHASES.AUCTION && room.currentAuction ? (
          <div className="p-6 flex flex-col items-center justify-center space-y-6 min-h-[70vh]">
            <div className="text-center">
              <h3 className="text-2xl font-black">{room.currentAuction.item.title}</h3>
              <p className="text-slate-500">{room.currentAuction.type === 'DUTCH' ? 'Price is dropping!' : 'Standard Bidding'}</p>
            </div>
            <div className="w-full bg-slate-900 rounded-[2.5rem] p-10 text-center text-white shadow-2xl relative overflow-hidden">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Bid/Price</p>
              <p className="text-7xl font-black font-mono">${room.currentAuction.highestBid}</p>
              <p className="text-indigo-400 mt-2 font-bold">{room.currentAuction.highestBidderName || "Waiting..."}</p>
            </div>
            <div className="w-full grid grid-cols-2 gap-3">
              {[10, 50, 100, 200].map(amt => (
                <button key={amt} onClick={() => placeBid(room.currentAuction.highestBid + amt)} className="py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-indigo-600">+${amt}</button>
              ))}
            </div>
            <button onClick={() => placeBid(room.currentAuction.highestBid + 1)} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-2xl shadow-xl active:translate-y-1">BID / BUY</button>
          </div>
        ) : room.phase === PHASES.CURATION ? (
          <div className="p-6 space-y-6">
            <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg">
              <p className="text-xs font-bold uppercase opacity-80">Museum Theme</p>
              <h2 className="text-2xl font-black">{room.theme}</h2>
            </div>
            <div className="space-y-4">
              <input type="text" id="w-title" placeholder="Wing Title..." className="w-full p-4 bg-white rounded-xl border-2 border-slate-200 font-bold" />
              <div className="grid grid-cols-2 gap-4">
                {items.filter(i => i.ownerId === user.uid).map(item => (
                  <div key={item.id} className="p-2 bg-white rounded-xl border-2 border-slate-100 flex flex-col items-center">
                    <img src={item.image} className="h-20 object-contain" />
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const inventory = items.filter(i => i.ownerId === user.uid).map(i => i.id);
                submitCuration(document.getElementById('w-title').value, inventory);
              }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">Curate Wing</button>
            </div>
          </div>
        ) : room.phase === PHASES.VOTING ? (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-black text-center">Grand Opening: Vote</h2>
            <div className="space-y-4">
              {players.filter(p => p.id !== user.uid && p.wingTitle).map(p => (
                <button key={p.id} onClick={() => castVote(p.id)} className="w-full bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm text-left">
                  <p className="text-xs font-bold text-slate-400 mb-1">{p.name}'s Wing</p>
                  <p className="text-xl font-black">"{p.wingTitle}"</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 italic">Check the main display for scores!</div>
        )}
      </main>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-around items-center text-slate-400 z-20 shadow-2xl">
         <div className="flex flex-col items-center gap-1 opacity-50"><Palette size={20} /><span className="text-[8px] uppercase font-bold">Studio</span></div>
         <div className="flex flex-col items-center gap-1 opacity-50"><Gavel size={20} /><span className="text-[8px] uppercase font-bold">Auction</span></div>
         <div className="flex flex-col items-center gap-1 opacity-50"><Award size={20} /><span className="text-[8px] uppercase font-bold">Gallery</span></div>
      </div>
    </div>
  );
}
