import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  runTransaction,
  writeBatch,
  getDocs,
  collectionGroup, 
  query, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { 
  Palette, Trash2, Users, Timer, 
  Gavel, ImageIcon, Award, CheckSquare,
  Trophy, Coins, AlertTriangle, History,
  Edit3, Star, RefreshCw, Layers, Loader2, Download
} from 'lucide-react';

// --- Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBysJI5RAeRDiVNI36lXD8g4CmiF2tXCUk",
  authDomain: "museum-of-modern-mistakes.firebaseapp.com",
  projectId: "museum-of-modern-mistakes",
  storageBucket: "museum-of-modern-mistakes.firebasestorage.app",
  messagingSenderId: "244324872382",
  appId: "1:244324872382:web:955dc0385a1e4177f0eeef",
  measurementId: "G-WLW6WD24GY" // <-- ADDED THIS FROM YOUR SCREENSHOT
};

const appId = 'museum-modern-mistakes';
const app = initializeApp(firebaseConfig);
window.analytics = typeof window !== "undefined" ? getAnalytics(app) : null; 
const auth = getAuth(app);
const db = getFirestore(app);

const PHASES = {
  LOBBY: 'LOBBY',
  RULES_MODAL: 'RULES_MODAL', 
  STUDIO_DRAW: 'STUDIO_DRAW',
  STUDIO_APPRAISE: 'STUDIO_APPRAISE',
  AUCTION: 'AUCTION',
  CURATION: 'CURATION',
  PRESENTATION: 'PRESENTATION', 
  VOTING: 'VOTING',
  RESULTS: 'RESULTS'
};

const PROMPTS = [
  "A ghost trying to use a vending machine",
  "A giraffe hiding in a tiny car",
  "A toaster winning an Olympic medal",
  "A cowboy riding something that is definitely not a horse",
  "A penguin on its first day of work",
  "A potato getting married",
  "A shark at the dentist",
  "A wizard who forgot how magic works",
  "A raccoon running a fancy restaurant",
  "A robot having a midlife crisis",
  "A chicken crossing the road for a suspicious reason",
  "A snail in a high-speed police chase",
  "A vampire at the beach",
  "A dinosaur trying to fit into an airplane seat",
  "A banana slipping on a human",
  "A pirate whose treasure is extremely disappointing",
  "A frog proposing to the love of its life",
  "A squirrel robbing a bank",
  "A mermaid stuck in traffic",
  "A clown at a serious business meeting",
  "A pigeon being crowned king",
  "A cactus giving free hugs",
  "A dragon working at a coffee shop",
  "A worm entering a bodybuilding competition",
  "A mummy at airport security",
  "A duck on a terrible first date",
  "A mailbox running away from home",
  "A bear attempting ballet",
  "A skeleton taking a bubble bath",
  "A sheep getting arrested",
  "A lobster at a job interview",
  "A cloud having a temper tantrum",
  "A genie with a really bad wish",
  "A hamster operating heavy machinery",
  "A knight fighting an embarrassingly small enemy",
  "A broccoli becoming a supervillain",
  "A yeti trying to take a selfie",
  "A goldfish walking its owner",
  "A scarecrow on vacation",
  "A dolphin committing a minor crime",
  "A mushroom hosting a talk show",
  "A detective investigating a missing sandwich",
  "A unicorn going through airport customs",
  "A walrus trying to look inconspicuous",
  "A beekeeper discovering the bees have unionized",
  "A moon arriving late to work",
  "A hot dog competing in a beauty pageant",
  "A turtle absolutely furious about something",
  "A caveman discovering Wi-Fi",
  "A flamingo trying to blend in",
  "A fortune teller receiving some very bad news",
  "A kangaroo caught shoplifting",
  "A snowman enjoying summer vacation",
  "A chef whose meal has come alive",
  "A mop celebrating its birthday",
  "A fairy getting pulled over for speeding",
  "A whale trying to whisper",
  "A mummy's awkward family photo",
  "A goat taking over a classroom",
  "A cupcake escaping from a bakery",
  "A scarecrow's secret nightlife",
  "A magician whose rabbit refuses to cooperate",
  "A jellyfish at a disco",
  "A moose trying to parallel park",
  "A sandwich making a sandwich",
  "A superhero with an incredibly useless power",
  "A bowling pin seeking revenge",
  "A pelican carrying something it definitely shouldn't",
  "A mannequin coming home from a long day at work",
  "A sea monster at a pool party",
  "A vacuum cleaner exploring the wilderness",
  "A crocodile trying to open a birthday present",
  "A gnome getting kicked out of a nightclub",
  "A pancake running for president",
  "A parrot revealing an embarrassing secret",
  "A traffic cone living its best life",
  "A koala performing emergency surgery",
  "A meatball on the run from the law",
  "A witch assembling furniture without instructions",
  "A peacock trying to sneak through security",
  "A fridge discovering what is inside itself",
  "A zebra attempting a disguise",
  "A gargoyle at couples therapy",
  "A shrimp becoming a professional wrestler",
  "A sock returning from the washing machine with a story to tell",
  "A sloth competing on a game show",
  "A pumpkin going through an identity crisis",
  "A mime trapped inside an actual invisible box",
  "A porcupine trying to cuddle",
  "A satellite spotting something very weird on Earth",
  "A seagull stealing the wrong person's lunch",
  "A donut escaping from prison",
  "A centaur trying to ride a bicycle",
  "A lawn mower entering a talent competition",
  "A chihuahua guarding an enormous castle",
  "A fortune cookie refusing to reveal the future",
  "A platypus attending a royal ball",
  "A volcano trying to stay calm",
  "A vending machine demanding a tip",
  "An alien pretending to understand a human birthday party"
];

const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const downloadArtwork = (item) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = item.image;
  
  img.onload = () => {
    // Dimensions
    const size = 1000; // High-res canvas width
    const padding = 60;
    const bottomArea = 300; 
    canvas.width = size;
    canvas.height = size + bottomArea;
    
    // Background (Cream)
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Artwork Image Background (White)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(padding, padding, size - padding * 2, size - padding * 2);
    
    // Draw the actual drawing
    ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);
    
    // Thick Black Border around the artwork
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 16;
    ctx.strokeRect(padding, padding, size - padding * 2, size - padding * 2);
    
    // Title Text
    ctx.fillStyle = '#1A1A1A';
    ctx.font = '900 64px sans-serif'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const displayTitle = item.title ? `"${item.title.toUpperCase()}"` : '"UNTITLED"';
    ctx.fillText(displayTitle, size / 2, size - padding + 50);
    
    // Watermark Text
    ctx.fillStyle = '#E94E34'; // Bauhaus Red
    ctx.font = '900 32px sans-serif';
    ctx.fillText("Curated on museum.dirtylaundry.games", size / 2, size - padding + 150);
    
    ctx.fillStyle = '#2E5CAF'; // Geometric Blue
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText("play for free today!", size / 2, size - padding + 190);
    
    // NEW: Native Mobile Share Sheet Logic
    canvas.toBlob((blob) => {
      const fileName = `${item.title ? item.title.replace(/\s+/g, '_') : 'mistake'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Check if the device supports sharing files natively (Most modern phones do)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'Museum of Mistakes',
          text: 'Look at this masterpiece!'
        }).catch((error) => {
            console.log('Sharing failed or was cancelled', error);
        });
      } else {
        // Fallback for Desktop Browsers (Standard Download)
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };
};

// --- Bauhaus Theme Constants ---
const COLORS = {
  bg: 'bg-[#f4f1ea]', // Cream
  text: 'text-[#1A1A1A]', // Black
  accentRed: 'bg-[#E94E34]', // Bauhaus Red
  accentBlue: 'bg-[#2E5CAF]', // Geometric Blue
  accentYellow: 'bg-[#F4D03F]', // Mustard
  accentPurple: 'bg-[#6A5ACD]', // Deep Purple
  border: 'border-[#1A1A1A]', // Black Border
  buttonShadow: 'shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]',
  cardShadow: 'shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]'
};

const COMMON_BTN = `relative border-4 border-black font-bold uppercase tracking-widest active:translate-y-1 active:shadow-none transition-all ${COLORS.buttonShadow}`;

// A player's readiness belongs to a specific phase. The legacy `ready` flag is
// retained for backwards compatibility with rooms that were already in progress.
const isPlayerReadyForPhase = (player, phase) => {
  if (!player) return false;
  if (player.readyForPhase) return player.readyForPhase === phase;
  return player.ready === true;
};

// --- Components ---

const DrawingCanvas = ({ onSave, prompt, timeLimit }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1A1A1A');
  const [thickness, setThickness] = useState(8);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const contextRef = useRef(null);
  const saveInFlightRef = useRef(false);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const size = rect.width; 
    
    const newWidth = size * dpr;
    const newHeight = size * dpr;

    if (canvas.width === newWidth && canvas.height === newHeight) {
      if (contextRef.current) {
         contextRef.current.strokeStyle = color;
         contextRef.current.lineWidth = thickness;
      }
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (canvas.width > 0) tempCtx.drawImage(canvas, 0, 0);

    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const context = canvas.getContext("2d");
    context.scale(dpr, dpr);
    context.lineCap = "round";
    context.lineJoin = "round"; 
    context.fillStyle = color;
    context.strokeStyle = color;
    context.lineWidth = thickness;
    
    if (tempCanvas.width === 0) {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = color; 
    }
    
    if (tempCanvas.width > 0) {
      context.drawImage(tempCanvas, 0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr);
    }
    contextRef.current = context;
  }, [color, thickness]);

  useEffect(() => {
    const handle = requestAnimationFrame(initCanvas);
    window.addEventListener('resize', initCanvas);
    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener('resize', initCanvas);
    };
  }, [initCanvas]);

  const handleSave = useCallback(async () => {
    if (!canvasRef.current || saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    setIsSaving(true);
    setSaveError('');

    try {
      const dataUrl = canvasRef.current.toDataURL('image/png', 0.5);
      await onSaveRef.current(dataUrl);
    } catch (error) {
      console.error('Drawing save failed:', error);
      saveInFlightRef.current = false;
      setIsSaving(false);
      setSaveError('Could not save. Tap DONE to try again.');
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleSave();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleSave]);

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
    
    contextRef.current.fillStyle = color;
    contextRef.current.beginPath();
    contextRef.current.arc(pos.x, pos.y, thickness / 2, 0, Math.PI * 2);
    contextRef.current.fill();
    
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

  const PALETTE = [
    '#EF4444', '#F97316', '#FACC15', '#22C55E', '#1D4ED8', '#14B8A6', 
    '#7E22CE', '#EC4899', '#6B7280', '#78350F', '#D4B996', '#FFFFFF', '#000000'
  ];

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${COLORS.bg} overflow-hidden font-sans select-none touch-none text-slate-900 h-[100dvh]`}>
      <style>{`
        body { -webkit-user-select: none; -webkit-touch-callout: none; }
        canvas { touch-action: none; }
      `}</style>
      <div className={`flex justify-between items-center p-3 bg-white border-b-4 border-black mb-1 shrink-0`}>
        <div className="flex-1 pr-2">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Assignment:</p>
          <h2 className="text-sm font-black uppercase leading-tight break-words line-clamp-2">{prompt}</h2>
        </div>
        <div className={`w-12 h-12 flex items-center justify-center border-4 border-black font-mono text-lg font-bold ${timeLeft < 10 ? 'bg-[#E94E34] text-white animate-pulse' : 'bg-[#F4D03F]'} shrink-0`}>
          {timeLeft}
        </div>
      </div>
      
      <div ref={containerRef} className="w-full aspect-square bg-white border-y-4 border-black shadow-inner overflow-hidden cursor-crosshair mx-auto">
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

      <div className="flex-1 flex flex-col p-2 space-y-2 shrink-0 pb-20 overflow-y-auto">
        <div className="flex gap-2 flex-wrap justify-center">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 border-2 border-black transition-transform ${color === c ? 'scale-125 ring-2 ring-black ring-offset-1' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 border-4 border-black">
          <Edit3 size={16} className="text-black" />
          <input type="range" min="2" max="30" value={thickness} onChange={(e) => setThickness(parseInt(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-none appearance-none cursor-pointer accent-black border border-black" />
          <button onClick={() => contextRef.current.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)} className={`p-2 bg-white border-2 border-black hover:bg-red-100`}>
            <Trash2 size={16} />
          </button>
        </div>

        {saveError && <p className="text-center text-xs font-black uppercase text-[#E94E34]">{saveError}</p>}
        <button disabled={isSaving} onClick={() => void handleSave()} className={`w-full py-4 bg-[#2E5CAF] text-white text-xl disabled:opacity-60 ${COMMON_BTN}`}>{isSaving ? 'SAVING...' : 'DONE'}</button>
      </div>
    </div>
  );
};

const RulesModal = ({ isHost, onStart }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div className={`bg-[#f4f1ea] w-full max-w-4xl p-8 border-8 border-black ${COLORS.cardShadow} animate-in zoom-in duration-300 relative`}>
      <div className="absolute -top-6 -left-6 bg-[#E94E34] text-white px-6 py-2 font-black text-xl border-4 border-black -rotate-2 shadow-[4px_4px_0px_0px_white]">
        THE MANIFESTO
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <div className="bg-[#2E5CAF] text-white w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-black shrink-0">1</div>
            <div>
              <h3 className="text-2xl font-black uppercase mb-1">Create</h3>
              <p className="font-bold text-slate-600 leading-tight">Draw a masterpiece based on a series of prompts. No talent required.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="bg-[#F4D03F] text-black w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-black shrink-0">2</div>
            <div>
              <h3 className="text-2xl font-black uppercase mb-1">Appraise</h3>
              <p className="font-bold text-slate-600 leading-tight">Write titles and descriptions for someone else's art to elevate the masterpiece.</p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <div className="bg-[#6A5ACD] text-white w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-black shrink-0">3</div>
            <div>
              <h3 className="text-2xl font-black uppercase mb-1">Bid</h3>
              <p className="font-bold text-slate-600 leading-tight">Bid to collect art. You only have $1,000 and can only have 3 pieces, so bid wisely!</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="bg-[#E94E34] text-white w-12 h-12 flex items-center justify-center font-black text-2xl border-4 border-black shrink-0">4</div>
            <div>
              <h3 className="text-2xl font-black uppercase mb-1">Open Your Exhibit</h3>
              <p className="font-bold text-slate-600 leading-tight">Name your exhibit, order your paintings, and get your friends to vote for you! You earn points by how many votes you get and points based off how much your pieces sold for.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        {isHost ? (
          <button onClick={onStart} className={`px-12 py-6 bg-[#1A1A1A] text-white text-4xl hover:bg-[#E94E34] ${COMMON_BTN}`}>
            LET'S GO
          </button>
        ) : (
          <div className="text-center font-bold animate-pulse text-xl uppercase tracking-widest">
            Waiting for Host...
          </div>
        )}
      </div>
    </div>
  </div>
);

const AdminGallery = ({ db, appId }) => {
  const [allArt, setAllArt] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupByGame, setGroupByGame] = useState(false); // Toggle state

  useEffect(() => {
    const fetchArt = async () => {
      try {
        const artQuery = query(collectionGroup(db, 'items'), orderBy('pricePaid', 'desc'), limit(250));
        const snapshot = await getDocs(artQuery);
        
        setAllArt(snapshot.docs.map(doc => ({
            ...doc.data(),
            // MAGIC TRICK: Grab the Room ID directly from the database path
            roomId: doc.ref.parent.parent.id 
        })));
      } catch (e) {
        console.error("FIREBASE INDEX ERROR: Check your browser console!", e);
      }
      setLoading(false);
    };
    fetchArt();
  }, [db, appId]);

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-[#f4f1ea] font-black text-4xl uppercase">Opening Vault...</div>;

  // Function to group art by room code
  const groupedArt = allArt.reduce((acc, item) => {
      if (!acc[item.roomId]) acc[item.roomId] = [];
      acc[item.roomId].push(item);
      return acc;
  }, {});

  // Shared Artwork Card Design
  const ArtCard = ({ item }) => (
    <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col relative">
      <div className="bg-[#f4f1ea] border-4 border-black w-full aspect-square mb-4 p-2 flex items-center justify-center">
        <img src={item.image} className="max-h-full max-w-full object-contain mix-blend-multiply" />
      </div>
      <h3 className="text-xl font-black uppercase leading-tight truncate">"{item.title || "Untitled"}"</h3>
      <div className="flex justify-between items-end mt-2 border-t-2 border-slate-100 pt-2">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Artist: <span className="text-[#E94E34]">{item.artistName}</span></p>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Archived"}
            </p>
          </div>
          <p className="text-lg font-black font-mono text-[#2E5CAF] leading-none">${item.pricePaid || 0}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#f4f1ea] p-4 lg:p-8 font-sans text-slate-900 pb-20">
      
      {/* Header & Controls */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b-8 border-black pb-6">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-center sm:text-left">Global Vault</h1>
          
          <button 
              onClick={() => setGroupByGame(!groupByGame)}
              className={`px-6 py-4 border-4 border-black font-black uppercase text-white tracking-widest active:translate-y-1 active:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${groupByGame ? 'bg-[#E94E34]' : 'bg-[#2E5CAF]'}`}
          >
              {groupByGame ? "View: Top 250" : "View: By Game"}
          </button>
      </div>

      {/* Grid Rendering */}
      <div className="max-w-7xl mx-auto">
        {groupByGame ? (
            <div className="space-y-16">
                {Object.entries(groupedArt).map(([roomCode, items]) => (
                    <div key={roomCode} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-black uppercase bg-[#F4D03F] border-4 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">Room: {roomCode}</h2>
                            <span className="font-bold text-slate-500 uppercase tracking-widest text-sm">{items.length} Artifacts</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {items.map((item, i) => <ArtCard key={i} item={item} />)}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allArt.map((item, i) => <ArtCard key={i} item={item} />)}
            </div>
        )}
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
  const [curationOrder, setCurationOrder] = useState([]);
  const [isBidding, setIsBidding] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [phaseCheckTick, setPhaseCheckTick] = useState(0);
  const [isSubmittingCuration, setIsSubmittingCuration] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Audio / synchronization refs
  const introAudioRef = useRef(null);
  const auctionAudioRef = useRef(null);
  const phaseAdvanceLockRef = useRef(false);
  const auctionActionLockRef = useRef(false);
  const autoVoteReadyRef = useRef(false);
  const appraisalAutoReadyKeyRef = useRef('');

  const me = useMemo(() => players.find(p => p.id === user?.uid), [players, user?.uid]);
  const curatedPlayers = useMemo(() => players.filter(p => p.wingTitle), [players]);
  const curationSubmitted = room?.phase === PHASES.CURATION && isPlayerReadyForPhase(me, PHASES.CURATION) && !!me?.wingTitle;
  const hasVoted = room?.phase === PHASES.VOTING && isPlayerReadyForPhase(me, PHASES.VOTING);
  const readyGatedPhase = [PHASES.STUDIO_DRAW, PHASES.STUDIO_APPRAISE, PHASES.CURATION, PHASES.VOTING].includes(room?.phase);
  const allPlayersReadyForCurrentPhase = readyGatedPhase && players.length > 0 && players.every(p => isPlayerReadyForPhase(p, room?.phase));

  useEffect(() => {
    setIsConnecting(true);
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        const cred = await signInAnonymously(auth);
        setUser(cred.user);
      } else { setUser(u); }
      setIsConnecting(false);
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

  // Audio Control Logic (Host Only)
  useEffect(() => {
    if (!room || view !== 'host') return;
    
    // Init audio objects if missing
    if (!introAudioRef.current) { introAudioRef.current = new Audio('/intro.mp3'); introAudioRef.current.loop = true; introAudioRef.current.volume = 0.3; }
    if (!auctionAudioRef.current) { auctionAudioRef.current = new Audio('/auction.mp3'); auctionAudioRef.current.loop = true; auctionAudioRef.current.volume = 0.4; }

    const introPhases = [PHASES.LOBBY, PHASES.RULES_MODAL, PHASES.STUDIO_DRAW, PHASES.STUDIO_APPRAISE];
    const actionPhases = [PHASES.AUCTION, PHASES.CURATION, PHASES.PRESENTATION, PHASES.VOTING, PHASES.RESULTS];

    if (introPhases.includes(room.phase)) {
        auctionAudioRef.current.pause();
        auctionAudioRef.current.currentTime = 0;
        introAudioRef.current.play().catch(() => {});
    } else if (actionPhases.includes(room.phase)) {
        introAudioRef.current.pause();
        auctionAudioRef.current.play().catch(() => {});
    }
  }, [room?.phase, view]);

  // Reset one-shot locks when a new phase begins.
  useEffect(() => {
    phaseAdvanceLockRef.current = false;
    auctionActionLockRef.current = false;
    autoVoteReadyRef.current = false;
    appraisalAutoReadyKeyRef.current = '';
    setIsSubmittingCuration(false);
    setIsSubmittingVote(false);
    setStatusMsg('');
  }, [room?.phaseStartedAt]);

  // Starting or clearing a lot is the acknowledgement for the previous auction
  // action, so the next timer/finalize action may proceed exactly once.
  useEffect(() => {
    auctionActionLockRef.current = false;
  }, [room?.phase, room?.currentAuction?.itemId]);

  // The old host logic checked Date.now() once, but React had no reason to re-run
  // exactly when the one-second safety window expired. This guarantees one recheck.
  useEffect(() => {
    if (view !== 'host' || !room?.phaseStartedAt) return;
    const elapsed = Date.now() - room.phaseStartedAt;
    if (elapsed >= 1100) return;

    const timer = setTimeout(() => {
      setPhaseCheckTick(tick => tick + 1);
    }, Math.max(0, 1100 - elapsed));

    return () => clearTimeout(timer);
  }, [view, room?.phaseStartedAt]);

  // If a player legitimately has no appraisal assigned, do not leave them on a
  // blank screen forever. Query Firestore directly so this decision never uses a
  // stale React items snapshot.
  useEffect(() => {
    if (view !== 'client' || room?.phase !== PHASES.STUDIO_APPRAISE || !room?.appraisalsDistributedAt || !user || !me) return;
    if (isPlayerReadyForPhase(me, PHASES.STUDIO_APPRAISE)) return;

    const key = `${roomId}:${room.appraisalsDistributedAt}:${user.uid}`;
    if (appraisalAutoReadyKeyRef.current === key) return;
    appraisalAutoReadyKeyRef.current = key;

    const timer = setTimeout(async () => {
      try {
        const itemSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items'));
        const remaining = itemSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(i => i.appraiserId === user.uid && !i.appraised);

        if (remaining.length === 0) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), {
            ready: true,
            readyForPhase: PHASES.STUDIO_APPRAISE
          });
        }
      } catch (error) {
        console.error('Appraisal readiness check failed:', error);
        appraisalAutoReadyKeyRef.current = '';
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [view, room?.phase, room?.appraisalsDistributedAt, roomId, user, me]);

  // A player with nobody eligible to vote for should still count as finished.
  useEffect(() => {
    if (view !== 'client' || room?.phase !== PHASES.VOTING || !user || !me || hasVoted) return;
    const candidates = players.filter(p => p.id !== user.uid && p.wingTitle);
    if (candidates.length !== 0 || autoVoteReadyRef.current) return;

    autoVoteReadyRef.current = true;
    updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), {
      ready: true,
      readyForPhase: PHASES.VOTING,
      votedFor: '__NO_CANDIDATE__'
    }).catch(error => {
      console.error('Auto-ready for voting failed:', error);
      autoVoteReadyRef.current = false;
    });
  }, [view, room?.phase, players, hasVoted, user, me, roomId]);

  useEffect(() => {
    if (curationSubmitted) setIsSubmittingCuration(false);
  }, [curationSubmitted]);

  useEffect(() => {
    if (hasVoted) setIsSubmittingVote(false);
  }, [hasVoted]);

  // Host logic
  useEffect(() => {
    if (view !== 'host' || !room) return;
    let timer;

    const phaseUptime = Date.now() - (room.phaseStartedAt || 0);
    const isSettled = phaseUptime > 1000;

    if (isSettled && allPlayersReadyForCurrentPhase && !phaseAdvanceLockRef.current) {
      phaseAdvanceLockRef.current = true;

      const advance = async () => {
        try {
          if (room.phase === PHASES.STUDIO_DRAW) await distributeAppraisals();
          else if (room.phase === PHASES.STUDIO_APPRAISE) await startPhase(PHASES.AUCTION);
          else if (room.phase === PHASES.CURATION) await startPhase(PHASES.PRESENTATION);
          else if (room.phase === PHASES.VOTING) await startPhase(PHASES.RESULTS);
        } catch (error) {
          console.error('Automatic phase advance failed:', error);
          phaseAdvanceLockRef.current = false;
        }
      };

      void advance();
      return;
    }

    if (room.phase === PHASES.PRESENTATION) {
      timer = setInterval(() => {
        const currentIdx = room.presentingIdx || 0;
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);

        if (curatedPlayers.length === 0) {
          if (!phaseAdvanceLockRef.current) {
            phaseAdvanceLockRef.current = true;
            startPhase(PHASES.VOTING).catch(error => {
              console.error('Presentation advance failed:', error);
              phaseAdvanceLockRef.current = false;
            });
          }
          return;
        }

        if ((room.presentationTimer || 0) > 0) {
          updateDoc(roomRef, { presentationTimer: room.presentationTimer - 1 }).catch(error => console.error('Presentation timer failed:', error));
        } else if (currentIdx < curatedPlayers.length - 1) {
          updateDoc(roomRef, { presentingIdx: currentIdx + 1, presentationTimer: 12 }).catch(error => console.error('Presentation advance failed:', error));
        } else if (!phaseAdvanceLockRef.current) {
          phaseAdvanceLockRef.current = true;
          startPhase(PHASES.VOTING).catch(error => {
            console.error('Voting phase start failed:', error);
            phaseAdvanceLockRef.current = false;
          });
        }
      }, 1000);
    }

    if (room.phase === PHASES.AUCTION) {
      if (!room.currentAuction) {
        const auctionableItems = items.filter(i => i.appraised);
        const pool = auctionableItems.filter(i => !i.auctioned && i.id !== room.lastFinalizedAuctionItemId);

        if (pool.length > 0 && !auctionActionLockRef.current) {
          auctionActionLockRef.current = true;
          const nextItem = pool[Math.floor(Math.random() * pool.length)];
          const appraiser = players.find(p => p.id === nextItem.appraiserId);

          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
            lastFinalizedAuctionItemId: null,
            currentAuction: {
              itemId: nextItem.id,
              item: nextItem,
              appraiserName: appraiser ? appraiser.name : 'Unknown',
              highestBid: 0,
              highestBidder: null,
              highestBidderName: null,
              timer: 10
            }
          }).catch(error => {
            console.error('Starting auction lot failed:', error);
            auctionActionLockRef.current = false;
          });
        } else if (auctionableItems.length > 0 && auctionableItems.every(i => i.auctioned) && !phaseAdvanceLockRef.current) {
          phaseAdvanceLockRef.current = true;
          startPhase(PHASES.CURATION).catch(error => {
            console.error('Curation phase start failed:', error);
            phaseAdvanceLockRef.current = false;
          });
        }
      } else {
        timer = setInterval(() => {
          const auction = room.currentAuction;
          const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);

          if (auction.timer <= 0) {
            clearInterval(timer);
            if (!auctionActionLockRef.current) {
              auctionActionLockRef.current = true;
              finalizeAuction().catch(error => {
                console.error('Finalizing auction failed:', error);
                auctionActionLockRef.current = false;
              });
            }
          } else {
            updateDoc(roomRef, { 'currentAuction.timer': auction.timer - 1 }).catch(error => console.error('Auction timer failed:', error));
          }
        }, 1000);
      }
    }

    return () => clearInterval(timer);
  }, [view, room?.phase, room?.currentAuction, room?.presentingIdx, room?.presentationTimer, room?.lastFinalizedAuctionItemId, players, items, room?.phaseStartedAt, phaseCheckTick, allPlayersReadyForCurrentPhase, curatedPlayers]);

  const distributeAppraisals = async () => {
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);

    // A player's final drawing write can reach the host's player listener before
    // the host's items listener. Fetch the authoritative items before assigning
    // appraisals so no artwork is accidentally skipped.
    const latestItemsSnap = await getDocs(collection(roomRef, 'items'));
    const currentItems = latestItemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const batch = writeBatch(db);
    const sortedPlayers = [...players].sort((a,b) => a.id.localeCompare(b.id));
    const playerIds = sortedPlayers.map(p => p.id);
    const n = playerIds.length;

    const itemsByArtist = {};
    currentItems.forEach(i => {
      if (!itemsByArtist[i.artistId]) itemsByArtist[i.artistId] = [];
      itemsByArtist[i.artistId].push(i.id);
    });

    sortedPlayers.forEach((player, i) => {
      for (let shiftCount = 1; shiftCount <= 3; shiftCount++) {
        const sourceIdx = (i + shiftCount) % n;
        let finalSourceId = playerIds[sourceIdx];
        if (finalSourceId === player.id) {
          finalSourceId = playerIds[(sourceIdx + 1) % n];
        }
        const sourceArt = itemsByArtist[finalSourceId] || [];
        const artId = sourceArt[(shiftCount - 1) % sourceArt.length];
        if (artId) {
          batch.update(doc(roomRef, 'items', artId), { appraiserId: player.id });
        }
      }
    });

    const now = Date.now();
    batch.update(roomRef, { phase: PHASES.STUDIO_APPRAISE, phaseStartedAt: now, appraisalsDistributedAt: now });
    players.forEach(p => { batch.update(doc(roomRef, 'players', p.id), { ready: false, readyForPhase: null }); });
    await batch.commit();
  };

  const finalizeAuction = async () => {
    if (!room?.currentAuction) return;
    const auction = room.currentAuction;
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items', auction.itemId);

    if (auction.highestBidder) {
      await updateDoc(itemRef, { ownerId: auction.highestBidder, pricePaid: auction.highestBid, auctioned: true, returned: false });
      
      const bidderRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', auction.highestBidder);
      const bidderSnap = await getDoc(bidderRef);
      await updateDoc(bidderRef, { cash: (bidderSnap.data().cash || 0) - auction.highestBid, inventory: arrayUnion(auction.itemId) });

      const totalPayout = Math.floor(auction.highestBid * 0.5);
      const share = Math.floor(totalPayout / 2);

      const artistRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', auction.item.artistId);
      const artistSnap = await getDoc(artistRef);
      if (artistSnap.exists()) {
          await updateDoc(artistRef, { pendingEarnings: (artistSnap.data().pendingEarnings || 0) + share });
      }

      const appraiserRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', auction.item.appraiserId);
      const appraiserSnap = await getDoc(appraiserRef);
      if (appraiserSnap.exists()) {
           await updateDoc(appraiserRef, { pendingEarnings: (appraiserSnap.data().pendingEarnings || 0) + share });
      }

    } else {
      const artistId = auction.item.artistId;
      const artistRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', artistId);
      const artistSnap = await getDoc(artistRef);
      const artistData = artistSnap.data();

      let finalOwnerId = artistId;
      let isReturned = true; 

      if ((artistData.inventory?.length || 0) >= 3) {
        const candidates = players.filter(p => (p.inventory?.length || 0) < 3);
        if (candidates.length > 0) {
          candidates.sort((a,b) => (a.inventory?.length || 0) - (b.inventory?.length || 0));
          finalOwnerId = candidates[0].id;
          isReturned = false; 
        }
      }

      await updateDoc(itemRef, { ownerId: finalOwnerId, pricePaid: 0, returned: isReturned, auctioned: true });
      const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', finalOwnerId);
      await updateDoc(pRef, { inventory: arrayUnion(auction.itemId) });
    }
    await updateDoc(roomRef, { currentAuction: null, lastFinalizedAuctionItemId: auction.itemId });
  };

const startPhase = async (phase) => {
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    const batch = writeBatch(db);
    batch.update(roomRef, { phase, phaseStartedAt: Date.now(), presentingIdx: 0, presentationTimer: 12 });
    players.forEach(p => {
      const reset = { ready: false, readyForPhase: null };
      if (phase === PHASES.VOTING) reset.votedFor = null;
      batch.update(doc(roomRef, 'players', p.id), reset);
    });
    await batch.commit();

    // Send data to Google Analytics
    if (typeof window !== "undefined" && window.analytics) {
      logEvent(window.analytics, 'phase_started', { phase_name: phase, room_id: roomId });
      if (phase === PHASES.RULES_MODAL) {
        logEvent(window.analytics, 'game_started', { player_count: players.length });
      }
    }
  };

  const markPlayerReady = async (phase, extra = {}) => {
    if (!user || !roomId) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), {
      ...extra,
      ready: true,
      readyForPhase: phase
    });
  };

  const forceAdvanceCurrentPhase = async () => {
    if (!room || phaseAdvanceLockRef.current) return;
    phaseAdvanceLockRef.current = true;

    try {
      if (room.phase === PHASES.STUDIO_DRAW) await distributeAppraisals();
      else if (room.phase === PHASES.STUDIO_APPRAISE) await startPhase(PHASES.AUCTION);
      else if (room.phase === PHASES.CURATION) await startPhase(PHASES.PRESENTATION);
      else if (room.phase === PHASES.VOTING) await startPhase(PHASES.RESULTS);
      else phaseAdvanceLockRef.current = false;
    } catch (error) {
      console.error('Host override failed:', error);
      phaseAdvanceLockRef.current = false;
    }
  };

  const placeBid = async (amount) => {
    if (isBidding || room.currentAuction?.highestBidder === user.uid) return;
    const auctionItemId = room.currentAuction?.itemId;
    const curMe = players.find(p => p.id === user?.uid);
    if (!room?.currentAuction || !curMe || (curMe.inventory?.length || 0) >= 3) return;
    if (amount > curMe.cash) return;

    setIsBidding(true);
    if (navigator.vibrate) navigator.vibrate(50);

    try {
      await runTransaction(db, async (transaction) => {
        const rRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
        const rSnap = await transaction.get(rRef);
        const current = rSnap.data().currentAuction;
        if (!current || current.itemId !== auctionItemId || amount <= current.highestBid) throw new Error();
        transaction.update(rRef, { 'currentAuction.highestBid': amount, 'currentAuction.highestBidder': user.uid, 'currentAuction.highestBidderName': name || curMe.name, 'currentAuction.timer': 5 });
      });
    } catch (e) { /* ignore retry */ }
    setIsBidding(false);
  };

  const hostGame = async () => {
    const code = generateRoomCode();
    const commonPrompts = [...PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 3);
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code), {
      hostId: user.uid,
      phase: PHASES.LOBBY,
      currentAuction: null,
      lastFinalizedAuctionItemId: null,
      appraisalsDistributedAt: null,
      phaseStartedAt: Date.now(),
      gamePrompts: commonPrompts
    });
    setRoomId(code); setView('host');
  };

const joinGame = async (code) => {
    const formattedCode = code.toUpperCase();
    
    // Secret Admin Login
    if (formattedCode === "SUPERADMINCODE123") {
      setView('admin');
      return;
    }

    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', formattedCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) { setStatusMsg("Invalid Room"); return; }
    
    const pRef = doc(roomRef, 'players', user.uid);
    const pSnap = await getDoc(pRef);
    
    if (pSnap.exists()) {
      await updateDoc(pRef, { name: name || pSnap.data().name });
    } else {
      await setDoc(pRef, { 
        name, 
        cash: 1000, 
        pendingEarnings: 0,
        inventory: [], 
        ready: false,
        readyForPhase: null,
        votedFor: null,
        votes: 0, 
        wingTitle: '' 
      });
    }
    
    setRoomId(formattedCode); 
    setView('client');
  };

  const resetRoom = async () => {
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    const itemSnaps = await getDocs(collection(roomRef, 'items'));
    const batch = writeBatch(db);
    itemSnaps.docs.forEach(d => batch.delete(d.ref));
    
    const commonPrompts = [...PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 3);
    batch.update(roomRef, {
      phase: PHASES.STUDIO_DRAW, phaseStartedAt: Date.now(),
      gamePrompts: commonPrompts, currentAuction: null, lastFinalizedAuctionItemId: null, appraisalsDistributedAt: null
    });
    players.forEach(p => {
      const pRef = doc(roomRef, 'players', p.id);
      batch.update(pRef, { cash: 1000, pendingEarnings: 0, inventory: [], ready: false, readyForPhase: null, votedFor: null, votes: 0, wingTitle: '' });
    });
    await batch.commit();
    setCurationOrder([]);
  };

const handleDrawingSubmit = async (dataUrl) => {
    const itemCount = items.filter(i => i.artistId === user.uid).length;
    const prompts = room?.gamePrompts || PROMPTS;
    const itemRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items'));
    await setDoc(itemRef, {
      id: itemRef.id, artistId: user.uid, artistName: name || me?.name, image: dataUrl,
      prompt: prompts[itemCount] || PROMPTS[0],
      title: '', history: '', appraised: false, ownerId: null, pricePaid: 0, auctioned: false, returned: false, appraiserId: null,
      createdAt: Date.now() // <-- THIS SAVES THE DATE!
    });
    if (itemCount >= 2) {
      await markPlayerReady(PHASES.STUDIO_DRAW);
    }
  };

  const submitAppraisal = async (itemId, title, history) => {
    setStatusMsg('');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items', itemId), { title, history, appraised: true });

    // Read the authoritative collection after the write instead of trusting the
    // possibly-stale React `items` array.
    const latestItems = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items'));
    const remaining = latestItems.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(i => i.appraiserId === user.uid && !i.appraised);

    if (remaining.length === 0) {
      await markPlayerReady(PHASES.STUDIO_APPRAISE);
    }
  };

  const submitCuration = async () => {
    if (!user || isSubmittingCuration || curationSubmitted) return;
    const titleInput = document.getElementById('w-title');
    const title = titleInput ? titleInput.value : 'Exhibition';
    const finalOrder = curationOrder.length > 0 ? curationOrder : (me?.inventory || []);

    setIsSubmittingCuration(true);
    setStatusMsg('');
    try {
      await markPlayerReady(PHASES.CURATION, {
        wingTitle: title || 'Exhibition',
        inventory: finalOrder
      });
    } catch (error) {
      console.error('Curation submission failed:', error);
      setStatusMsg('Could not publish your gallery. Please try again.');
      setIsSubmittingCuration(false);
    }
  };

  const submitVote = async (targetPlayerId) => {
    if (!user || isSubmittingVote || hasVoted || targetPlayerId === user.uid) return;

    setIsSubmittingVote(true);
    setStatusMsg('');
    if (navigator.vibrate) navigator.vibrate(100);

    try {
      const voterRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid);
      const targetRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', targetPlayerId);

      await runTransaction(db, async (transaction) => {
        const voterSnap = await transaction.get(voterRef);
        const targetSnap = await transaction.get(targetRef);

        if (!voterSnap.exists() || !targetSnap.exists()) throw new Error('Player no longer exists');
        const voterData = voterSnap.data();
        if (voterData.votedFor || voterData.readyForPhase === PHASES.VOTING) return;

        transaction.update(targetRef, { votes: (targetSnap.data().votes || 0) + 1 });
        transaction.update(voterRef, {
          votedFor: targetPlayerId,
          ready: true,
          readyForPhase: PHASES.VOTING
        });
      });
    } catch (error) {
      console.error('Vote submission failed:', error);
      setStatusMsg('Your vote did not save. Please try again.');
      setIsSubmittingVote(false);
    }
  };

  const toggleItemSelection = (id) => {
    setCurationOrder(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // --- Views ---

  if (isConnecting) {
      return (
          <div className={`min-h-[100dvh] ${COLORS.bg} flex flex-col items-center justify-center p-6 text-center space-y-4`}>
              <Loader2 className="animate-spin text-black" size={48} />
              <h2 className="text-2xl font-black uppercase tracking-widest">Loading Gallery...</h2>
          </div>
      );
  }

if (view === 'admin') {
    return <AdminGallery db={db} appId={appId} />;
  }

  if (view === 'landing') {
    return (
      <div className={`min-h-[100dvh] ${COLORS.bg} flex flex-col items-center justify-center p-6 font-sans text-slate-900 overflow-hidden`}>
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E94E34] rounded-full blur-[100px] opacity-20 animate-pulse duration-[5000ms]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2E5CAF] rounded-full blur-[100px] opacity-20 animate-pulse delay-1000 duration-[6000ms]"></div>
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-[#F4D03F] rounded-full blur-[100px] opacity-20 animate-pulse delay-2000 duration-[7000ms]"></div>
            <div className="absolute bottom-10 left-10 w-60 h-60 bg-[#6A5ACD] rounded-full blur-[100px] opacity-20 animate-pulse delay-3000 duration-[8000ms]"></div>
        </div>

        <div className="max-w-3xl w-full space-y-8 text-center relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-7xl font-black uppercase tracking-tighter leading-none text-[#1A1A1A]/90 drop-shadow-sm">Museum of <span className="text-[#E94E34]">Mistakes</span></h1>
            <p className="text-sm sm:text-xl font-bold bg-[#1A1A1A] text-white inline-block px-4 py-1 uppercase tracking-[0.2em] transform -rotate-1">Fine Art for Fumbling Curators</p>
          </div>
          <div className={`bg-white p-6 sm:p-12 border-4 border-black ${COLORS.cardShadow} space-y-6 relative`}>
            {/* Geometric Decor */}
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#2E5CAF] border-4 border-black"></div>
            <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-[#E94E34] rounded-full border-4 border-black"></div>
            
            <input type="text" placeholder="YOUR NAME" className="w-full p-4 bg-[#f4f1ea] border-4 border-black text-xl font-black outline-none focus:bg-white uppercase placeholder:text-slate-400" value={name} onChange={e => setName(e.target.value)} />
            <input type="text" placeholder="ROOM CODE" className="w-full p-4 bg-[#f4f1ea] border-4 border-black text-center font-mono text-2xl tracking-[0.2em] uppercase outline-none focus:bg-white placeholder:text-slate-400" value={roomId} onChange={e => { setRoomId(e.target.value); setStatusMsg(''); }} />
            {statusMsg && <p className="font-black uppercase text-sm text-[#E94E34]">{statusMsg}</p>}
            
            <button onClick={() => joinGame(roomId)} disabled={!name || !roomId} className={`w-full py-4 bg-[#2E5CAF] text-white text-2xl hover:bg-[#1e3a8a] ${COMMON_BTN}`}>ENTER GALLERY</button>
            
            <div className="flex items-center gap-4 text-slate-400 py-2 font-bold uppercase"><hr className="flex-1 border-2 border-slate-300" /><span>OR</span><hr className="flex-1 border-2 border-slate-300" /></div>
            
            <button onClick={hostGame} className={`w-full py-4 bg-[#1A1A1A] text-white hover:bg-slate-800 ${COMMON_BTN}`}>HOST EXHIBITION</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'host') {
    const auctionedCount = items.filter(i => i.auctioned).length;
    const totalToAuction = items.filter(i => i.appraised).length;

    return (
      <div className={`h-screen w-screen overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8 relative ${COLORS.bg} font-sans text-slate-900 border-[16px] border-black`}>
        {/* Rules Modal Overlay */}
        {room?.phase === PHASES.RULES_MODAL && (
          <RulesModal isHost={true} onStart={() => startPhase(PHASES.STUDIO_DRAW)} />
        )}

        {/* COMPACT HEADER */}
        <div className="flex justify-between items-start z-10 mb-4 shrink-0">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-[#1A1A1A] uppercase tracking-tighter leading-none">Museum of <span className="text-[#E94E34]">Modern</span> Mistakes</h1>
            <p className="bg-[#F4D03F] inline-block px-2 mt-1 font-bold border-2 border-black uppercase tracking-widest text-xs">Main Gallery Display</p>
          </div>
          <div className={`bg-white p-3 border-4 border-black ${COLORS.buttonShadow} text-center`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0 leading-none">Room Code</p>
            <p className="text-3xl lg:text-4xl font-black text-[#1A1A1A] tracking-tighter leading-none font-mono">{room?.id}</p>
          </div>
        </div>

        {readyGatedPhase && !allPlayersReadyForCurrentPhase && (
          <button
            onClick={() => void forceAdvanceCurrentPhase()}
            className="absolute bottom-4 left-4 z-50 px-3 py-2 bg-white border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-[#F4D03F]"
            title="Emergency host control if a player disconnects or cannot finish"
          >
            Host Override: Continue
          </button>
        )}

        <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
          {/* Background shapes */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#E94E34] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#2E5CAF] mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

          {room?.phase === PHASES.LOBBY && (
            <div className="text-center space-y-12 max-w-5xl w-full">
              <h2 className="text-7xl font-black text-[#1A1A1A] uppercase italic tracking-tighter">Curating Our Artists</h2>
              <div className="flex flex-wrap justify-center gap-6">
                {players.map(p => (
                  <div key={p.id} className={`bg-white px-10 py-5 border-4 border-black font-black text-2xl uppercase ${COLORS.buttonShadow} animate-in slide-in-from-bottom`}>{p.name}</div>
                ))}
              </div>
              {players.length >= 2 && <button onClick={() => startPhase(PHASES.RULES_MODAL)} className={`px-20 py-8 bg-[#E94E34] text-white text-5xl hover:scale-105 ${COMMON_BTN}`}>OPEN DOORS</button>}
            </div>
          )}

          {(room?.phase === PHASES.STUDIO_DRAW || room?.phase === PHASES.STUDIO_APPRAISE) && (
            <div className="text-center space-y-12 w-full">
              {room.phase === PHASES.STUDIO_DRAW ? <Edit3 size={120} className="mx-auto text-[#2E5CAF]" /> : <History size={120} className="mx-auto text-[#F4D03F]" />}
              <h2 className="text-[10rem] font-black text-[#1A1A1A] leading-none uppercase tracking-tighter relative z-10">{room.phase === PHASES.STUDIO_DRAW ? "CREATE" : "APPRAISE"}</h2>
              
              <div className="w-full max-w-4xl mx-auto h-8 bg-black/10 rounded-full overflow-hidden border-4 border-black">
                 <div className="h-full bg-[#E94E34] transition-all duration-1000" style={{ width: `${(players.filter(p => p.ready).length / players.length) * 100}%` }}></div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 pt-8">
                {players.map(p => (
                   <div key={p.id} className="flex flex-col items-center gap-3">
                     <div className={`w-16 h-16 border-4 border-black flex items-center justify-center font-black text-xl transition-all ${p.ready ? 'bg-[#2E5CAF] text-white rotate-6' : 'bg-white text-slate-300'}`}>
                        {p.ready ? '✓' : '...'}
                     </div>
                     <p className="text-sm font-black text-black uppercase tracking-widest">{p.name}</p>
                   </div>
                ))}
              </div>
            </div>
          )}

          {room?.phase === PHASES.AUCTION && (
            room.currentAuction ? (
              <div className="flex-1 min-h-0 w-full grid grid-cols-12 gap-4 lg:gap-6 animate-in fade-in slide-in-from-bottom duration-500 pb-2">
                {/* Artwork Card */}
                <div className={`col-span-5 bg-white p-4 border-8 border-black ${COLORS.cardShadow} flex flex-col relative h-full min-h-0 items-center`}>
                  <div className="absolute -top-6 -left-6 bg-[#2E5CAF] text-white px-4 py-1 border-4 border-black font-black uppercase z-20 shadow-lg rotate-2">
                     LOT {auctionedCount + 1}/{totalToAuction}
                  </div>
                  <div className="bg-[#f4f1ea] border-4 border-black flex-1 min-h-0 w-full flex items-center justify-center p-2 mb-2 shadow-inner relative overflow-hidden">
                     <img src={room.currentAuction.item.image} className="max-h-full max-w-full object-contain drop-shadow-md bg-white border-2 border-black/10" />
                  </div>
                  <div className="flex justify-between items-center border-t-4 border-black pt-2 shrink-0 w-full">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Artist</p>
                        <p className="text-lg font-black uppercase leading-tight">{room.currentAuction.item.artistName}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appraiser</p>
                        <p className="text-lg font-black uppercase text-[#E94E34] leading-tight">{room.currentAuction.appraiserName}</p>
                     </div>
                  </div>
                </div>

                {/* Info & Bidding */}
                <div className="col-span-7 flex flex-col gap-4 lg:gap-6 min-h-0 h-full">
                  <div className="flex-1 min-h-0 bg-white text-[#1A1A1A] p-6 border-8 border-black shadow-xl relative overflow-hidden flex flex-col">
                     <h3 className="text-4xl lg:text-5xl font-black uppercase leading-tight relative z-10 mb-4 shrink-0">"{room.currentAuction.item.title || "Untitled"}"</h3>
                     <div className="overflow-y-auto flex-1 pr-2">
                        <p className="text-xl lg:text-2xl font-mono text-slate-600 leading-relaxed relative z-10 border-l-8 border-[#F4D03F] pl-6">"{room.currentAuction.item.history}"</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 lg:gap-6 shrink-0">
                      <div className={`bg-[#F4D03F] py-4 px-4 border-8 border-black ${COLORS.buttonShadow} text-center flex flex-col justify-center`}>
                         <p className="text-sm font-black uppercase tracking-widest mb-1">Current Bid</p>
                         <p className="text-5xl lg:text-7xl font-black text-black font-mono leading-none">${room.currentAuction.highestBid}</p>
                         <div className="mt-2"><span className="text-sm lg:text-base font-black uppercase text-white bg-black px-3 py-1">{room.currentAuction.highestBidderName || "NO BIDS"}</span></div>
                      </div>
                      
                      <div className={`bg-white py-4 px-4 border-8 border-black ${COLORS.buttonShadow} flex flex-col items-center justify-center relative`}>
                         <Timer size={30} className={`mb-1 ${room.currentAuction.timer < 5 ? 'text-[#E94E34] animate-ping' : 'text-black'}`} />
                         <span className="text-5xl lg:text-7xl font-black font-mono leading-none">{room.currentAuction.timer}s</span>
                      </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8 animate-pulse">
                <Gavel size={160} className="mx-auto text-[#1A1A1A]" />
                <h2 className="text-8xl font-black text-[#1A1A1A] uppercase tracking-tighter">Next Lot...</h2>
                <div className="text-3xl font-bold bg-[#E94E34] text-white inline-block px-8 py-2 border-4 border-black uppercase">{auctionedCount} SOLD | {totalToAuction - auctionedCount} LEFT</div>
              </div>
            )
          )}

          {room?.phase === PHASES.PRESENTATION && (
            <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center animate-in zoom-in duration-500 relative pb-2">
              {curatedPlayers[room.presentingIdx] && (
                <>
                  <div className="text-center mb-4 shrink-0 z-10">
                    <div className="inline-block px-6 py-1 bg-[#1A1A1A] text-white font-black text-lg uppercase tracking-widest border-4 border-white shadow-xl mb-1 -rotate-2">Curated By: {curatedPlayers[room.presentingIdx].name}</div>
                    <h2 className="text-5xl font-black text-[#1A1A1A] uppercase leading-none tracking-tighter">"{curatedPlayers[room.presentingIdx].wingTitle}"</h2>
                  </div>
                  
                  <div className="flex-1 min-h-0 flex w-full gap-4 lg:gap-8 justify-center items-center px-4 max-w-[95vw] z-10 pb-4">
                    {curatedPlayers[room.presentingIdx].inventory.map((itemId, idx) => {
                       const item = items.find(i => i.id === itemId);
                       if (!item) return null;
                       return (
                      <div key={item.id} className={`flex-1 min-w-0 h-full bg-white p-3 lg:p-4 border-8 border-black ${COLORS.cardShadow} relative transform flex flex-col`}>
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#F4D03F] border-4 border-black flex items-center justify-center font-black text-xl z-20">{idx + 1}</div>
                        
                        {item.returned && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-[#E94E34] text-white px-6 py-2 font-black text-3xl border-8 border-white shadow-2xl z-30 opacity-90 animate-pulse uppercase">MISTAKE</div>
                        )}
                        <div className="bg-[#f4f1ea] border-4 border-black w-full flex-1 min-h-0 p-2 mb-3 flex items-center justify-center overflow-hidden">
                          <img src={item.image} className="max-h-full max-w-full object-contain" />
                        </div>
                        
                        <div className="shrink-0 flex flex-col pt-2 border-t-4 border-black">
                            <h4 className="text-xl lg:text-2xl font-black uppercase text-[#1A1A1A] leading-tight mb-1 truncate">{item.title}</h4>
                            <p className="text-xs lg:text-sm font-mono text-slate-600 leading-snug line-clamp-3">"{item.history}"</p>
                        </div>
                      </div>
                    )})}
                  </div>
                </>
              )}
            </div>
          )}

          {room?.phase === PHASES.VOTING && (
            <div className="text-center space-y-12 animate-in zoom-in">
              <Star size={160} className="mx-auto text-[#F4D03F] animate-spin-slow" />
              <h2 className="text-9xl font-black text-[#1A1A1A] leading-none uppercase tracking-tighter">Cast Votes</h2>
              <div className="flex flex-wrap justify-center gap-6 pt-8">
                {players.map(p => (
                   <div key={p.id} className="flex flex-col items-center gap-3">
                     <div className={`w-16 h-16 border-4 border-black flex items-center justify-center font-black text-xl transition-all ${p.ready ? 'bg-[#2E5CAF] text-white' : 'bg-slate-200 text-slate-300'}`}>
                        {p.ready ? '✓' : ''}
                     </div>
                     <p className="text-sm font-black text-black uppercase tracking-widest">{p.name}</p>
                   </div>
                ))}
              </div>
            </div>
          )}

          {room?.phase === PHASES.RESULTS && (
            <div className="flex-1 min-h-0 w-full max-w-6xl flex flex-col items-center pb-4">
              <h2 className="text-5xl lg:text-6xl font-black text-center mb-6 uppercase tracking-tighter flex items-center gap-4 shrink-0"><Trophy size={60} className="text-[#F4D03F]" /> Final Standings</h2>
              
              <div className="w-full flex-1 min-h-0 overflow-y-auto space-y-4 pr-4">
                {[...players].sort((a,b) => {
                  const getScore = (p) => {
                    const mistakePenalty = items.filter(i => i.returned && i.artistId === p.id).length * 100;
                    return (p.cash || 0) + (p.votes || 0) * 200 + (p.pendingEarnings || 0) - mistakePenalty;
                  };
                  return getScore(b) - getScore(a);
                }).map((p, i) => {
                  const mistakePenalty = items.filter(i => i.returned && i.artistId === p.id).length * 100;
                  const totalScore = (p.cash || 0) + (p.votes || 0) * 200 + (p.pendingEarnings || 0) - mistakePenalty;
                  return (
                    <div key={p.id} className={`bg-white p-4 lg:p-6 border-4 border-black ${COLORS.buttonShadow} flex items-center justify-between group hover:bg-[#F4D03F] transition-colors shrink-0`}>
                      <div className="flex items-center gap-6">
                        <span className={`text-4xl lg:text-6xl font-black ${i===0 ? 'text-[#E94E34]' : 'text-black'}`}>#{i+1}</span>
                        <div>
                          <h3 className="text-3xl lg:text-4xl font-black text-[#1A1A1A] uppercase leading-none mb-1">{p.name}</h3>
                          <div className="flex flex-wrap gap-2 lg:gap-4 text-xs lg:text-sm font-bold uppercase tracking-widest mt-1">
                             <span className="bg-[#2E5CAF] text-white px-2 py-0.5">Votes: {p.votes || 0}</span>
                             <span className="bg-[#1A1A1A] text-white px-2 py-0.5">Cash: ${p.cash}</span>
                             {p.pendingEarnings > 0 && <span className="bg-[#E94E34] text-white px-2 py-0.5">Profit: +${p.pendingEarnings}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-4xl lg:text-6xl font-black font-mono tracking-tighter">${totalScore}</div>
                    </div>
                  );
                })}
</div>

              {/* Social & Feedback Callout */}
              <div className="w-full mt-8 bg-[#f4f1ea] border-4 border-black p-4 lg:p-6 text-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] shrink-0">
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Enjoying the Museum?</h4>
                  <p className="font-bold text-slate-700 text-sm lg:text-base mb-4">Tag us in your masterpieces on TikTok <a href="https://tiktok.com/@dirtylaundrygames" target="_blank" rel="noreferrer" className="text-[#E94E34] underline">@dirtylaundrygames</a></p>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Have feedback or ideas? <a href="mailto:dirtylaundrygames@gmail.com" className="text-[#2E5CAF] underline">dirtylaundrygames@gmail.com</a></p>
              </div>

              <button onClick={resetRoom} className={`shrink-0 mt-6 px-8 py-4 bg-[#1A1A1A] text-white text-xl lg:text-2xl ${COMMON_BTN} flex items-center gap-3`}>NEW EXHIBITION <RefreshCw size={24} /></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Mobile Client ---
  const isPanicClient = room?.phase === PHASES.AUCTION && (room.currentAuction?.timer || 0) < 5;

  return (
    <div className={`min-h-[100dvh] flex flex-col max-w-md mx-auto relative overflow-hidden font-sans transition-colors duration-200 ${isPanicClient ? 'bg-[#E94E34]' : COLORS.bg}`}>
      {/* Animated Background for Mobile */}
      {!isPanicClient && (
         <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#E94E34] rounded-full blur-[60px] animate-pulse"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2E5CAF] rounded-full blur-[60px] animate-pulse delay-700"></div>
         </div>
      )}

      {/* Rules Modal for Mobile */}
      {room?.phase === PHASES.RULES_MODAL && (
          <div className="absolute inset-0 z-50 bg-[#f4f1ea] flex flex-col items-center justify-center p-8 text-center space-y-6">
              <h2 className="text-4xl font-black uppercase">Look Up!</h2>
              <p className="font-bold text-xl">The Curator is explaining the rules on the main screen.</p>
              <div className="w-20 h-20 bg-[#2E5CAF] animate-bounce rounded-full border-4 border-black"></div>
          </div>
      )}

      {room?.phase !== PHASES.STUDIO_DRAW && (
        <div className="bg-[#1A1A1A] text-white p-3 flex justify-between items-center z-10 border-b-4 border-white shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F4D03F] border-2 border-white flex items-center justify-center font-black text-black text-xl">{name ? name[0] : me?.name ? me.name[0] : '?'}</div>
            <div>
              <span className="font-black text-base uppercase tracking-tight block leading-none mb-1 truncate max-w-[100px]">{name || me?.name || 'Curator'}</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold tracking-widest">Inv: {me?.inventory?.length || 0}/3</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white text-black px-3 py-1 border-2 border-slate-500">
            <Coins size={16} className="text-[#E94E34]" />
            <span className="font-mono font-black text-lg leading-none">${me?.cash || 0}</span>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-24 relative z-10">
        {statusMsg && room && (
          <div className="m-3 p-3 bg-white border-4 border-[#E94E34] text-[#E94E34] text-xs font-black uppercase text-center">{statusMsg}</div>
        )}
        {!room ? (
          <div className="p-16 text-center font-black uppercase tracking-widest animate-pulse">Connecting...</div>
        ) : room.phase === PHASES.LOBBY ? (
          <div className="p-8 text-center space-y-10 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative"><Users size={100} className="text-[#2E5CAF]" /><div className="absolute -top-2 -right-2 bg-[#E94E34] text-white w-8 h-8 flex items-center justify-center font-black border-2 border-black">!</div></div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">You're In!</h2>
              <p className="font-bold text-lg leading-snug bg-[#F4D03F] inline-block px-2 border-2 border-black">Watch the big screen</p>
            </div>
          </div>
        ) : room.phase === PHASES.STUDIO_DRAW ? (
          <>
            {me?.ready ? (
              <div className="p-16 text-center space-y-8 flex flex-col items-center justify-center min-h-[60vh] animate-in slide-in-from-bottom shrink-0">
                <CheckSquare size={120} className="text-[#2E5CAF]" />
                <h3 className="text-4xl font-black uppercase italic leading-none">Submitted</h3>
                <p className="font-bold tracking-widest uppercase text-xs">Waiting for artists...</p>
              </div>
            ) : (
              <DrawingCanvas 
                key={items.filter(i => i.artistId === user.uid).length} 
                prompt={(room?.gamePrompts || [])[items.filter(i => i.artistId === user.uid).length] || PROMPTS[0]} 
                timeLimit={120} 
                onSave={handleDrawingSubmit} 
              />
            )}
          </>
        ) : room.phase === PHASES.STUDIO_APPRAISE ? (
          <div className="p-6 space-y-6">
            {me?.ready ? (
               <div className="p-16 text-center space-y-8 flex flex-col items-center justify-center min-h-[60vh] shrink-0">
                 <CheckSquare size={120} className="text-[#E94E34]" />
                 <h3 className="text-4xl font-black uppercase italic leading-none">Catalogued</h3>
                 <p className="font-bold tracking-widest uppercase text-xs">Waiting for auction...</p>
               </div>
            ) : (
              <>
                {items.filter(i => i.artistId !== user?.uid && !i.appraised && i.appraiserId === user.uid).slice(0, 1).map(item => (
                  <div key={item.id} className="space-y-6 animate-in zoom-in">
                    <div className="text-center">
                      <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-2">Appraisal</h2>
                      <p className="bg-black text-white inline-block px-2 text-xs font-bold uppercase tracking-widest">Make it sound expensive</p>
                    </div>
                    <div className="aspect-square bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                      <img src={item.image} className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-widest">Title</label>
                          <input type="text" id="appraisal-title" className="w-full p-4 bg-white border-4 border-black font-black text-xl outline-none focus:bg-[#f4f1ea]" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-black uppercase tracking-widest">History</label>
                          <textarea id="appraisal-history" className="w-full p-4 bg-white border-4 border-black font-bold text-lg outline-none focus:bg-[#f4f1ea] h-32" />
                      </div>
                      <button onClick={() => {
                          const t = document.getElementById('appraisal-title').value;
                          const h = document.getElementById('appraisal-history').value;
                          if (t && h) submitAppraisal(item.id, t, h);
                        }} className={`w-full py-6 bg-[#1A1A1A] text-white text-2xl active:translate-y-1 active:shadow-none transition-all ${COLORS.buttonShadow}`}
                      >CERTIFY</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : room.phase === PHASES.AUCTION && room.currentAuction ? (
          <div className="p-6 space-y-6 min-h-[85vh] flex flex-col justify-center animate-in fade-in shrink-0">
            <div className="text-center space-y-2">
              <p className={`text-xs font-black uppercase tracking-[0.3em] ${isPanicClient ? 'text-white' : 'text-slate-400'}`}>Current Lot</p>
              <h3 className={`text-3xl font-black leading-tight uppercase ${isPanicClient ? 'text-white' : 'text-black'}`}>"{room.currentAuction.item.title || "Unknown Art"}"</h3>
            </div>
            
            <div className={`w-full bg-[#1A1A1A] p-8 text-center text-white relative border-8 ${(me?.inventory?.length || 0) >= 3 ? 'border-red-600' : isPanicClient ? 'border-white animate-bounce' : 'border-[#F4D03F]'} ${COLORS.cardShadow}`}>
              <p className="text-xs font-black uppercase tracking-widest mb-2 opacity-50 leading-none">Current Bid</p>
              <p className="text-7xl font-black font-mono tracking-tighter leading-none mb-4">${room.currentAuction.highestBid}</p>
              <p className="text-[#E94E34] bg-white inline-block px-4 py-1 font-black text-xl uppercase italic tracking-tighter leading-none">{room.currentAuction.highestBidderName || "NO BIDS"}</p>
              
              {(me?.inventory?.length || 0) >= 3 && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center border-4 border-red-500 animate-in zoom-in">
                    <AlertTriangle size={60} className="text-red-500 mb-2" />
                    <p className="font-black text-3xl text-white italic tracking-tighter uppercase">Inventory Full</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[10, 25, 50, 100].map(amt => (
                  <button key={amt} disabled={isBidding || (me?.inventory?.length || 0) >= 3 || room.currentAuction.highestBidder === user.uid} onClick={() => placeBid((room.currentAuction.highestBid || 0) + amt)} className={`py-6 bg-white text-[#1A1A1A] text-3xl active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none ${COLORS.buttonShadow}`}>+${amt}</button>
                ))}
              </div>
            </div>
          </div>
        ) : room.phase === PHASES.CURATION ? (
          <div className="p-6 space-y-6 animate-in slide-in-from-right shrink-0">
            {!curationSubmitted ? (
              <>
                <div className="bg-[#E94E34] text-white p-6 border-4 border-black shadow-[4px_4px_0px_0px_black] shrink-0">
                    <h2 className="text-3xl font-black leading-none italic uppercase tracking-tighter">Curate Wing</h2>
                </div>
                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest pl-1 leading-none">Exhibition Title</p>
                      <input type="text" id="w-title" placeholder="THE COLLECTION..." className="w-full p-4 bg-white border-4 border-black font-black text-xl outline-none focus:bg-[#f4f1ea]" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <p className="text-xs font-black uppercase tracking-widest leading-none">Select Order (Max 3)</p>
                        <button onClick={() => setCurationOrder([])} className="text-xs font-black text-[#E94E34] uppercase underline">Reset</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {items.filter(i => (me?.inventory || []).includes(i.id)).map(item => {
                        const orderIndex = curationOrder.indexOf(item.id);
                        return (
                          <div key={item.id} onClick={() => toggleItemSelection(item.id)} className={`aspect-square border-4 transition-all relative overflow-hidden bg-white ${orderIndex !== -1 ? 'border-[#2E5CAF]' : 'border-slate-300 opacity-60'}`}>
                             <img src={item.image} className="w-full h-full object-contain" />
                             {orderIndex !== -1 && (<div className="absolute top-0 right-0 bg-[#2E5CAF] text-white w-6 h-6 flex items-center justify-center font-black text-xs border-b-2 border-l-2 border-black">{orderIndex + 1}</div>)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button disabled={isSubmittingCuration} onClick={() => void submitCuration()} className={`w-full py-6 bg-[#1A1A1A] text-white text-2xl disabled:opacity-60 active:translate-y-1 active:shadow-none transition-all ${COLORS.buttonShadow}`}>{isSubmittingCuration ? 'PUBLISHING...' : 'OPEN GALLERY'}</button>
                </div>
              </>
            ) : (
              <div className="p-16 text-center space-y-8 flex flex-col items-center justify-center min-h-[60vh] animate-in slide-in-from-bottom shrink-0">
                  <CheckSquare size={120} className="text-[#2E5CAF]" />
                  <h3 className="text-4xl font-black uppercase italic leading-none">Published!</h3>
                  <p className="font-bold tracking-widest uppercase text-xs">Waiting for other curators.</p>
              </div>
            )}
          </div>
        ) : room.phase === PHASES.PRESENTATION ? (
          <div className="p-12 text-center space-y-10 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in shrink-0">
             <ImageIcon size={100} className="text-[#F4D03F]" />
             <h3 className="text-3xl font-black text-black uppercase italic leading-tight">Exhibition Live</h3>
             <p className="font-bold uppercase tracking-widest text-xs bg-white border-2 border-black px-4 py-2">Look at the big screen</p>
          </div>
) : room.phase === PHASES.VOTING && !hasVoted ? (
          <div className="p-6 space-y-6 animate-in slide-in-from-bottom shrink-0">
            <div className="text-center space-y-2">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Vote</h2>
                <p className="font-black uppercase text-xs tracking-widest text-slate-500">Pick the best collection</p>
            </div>
            <div className="space-y-4">
              {players.filter(p => p.id !== user.uid && p.wingTitle).map(p => (
                <button key={p.id} disabled={isSubmittingVote} onClick={() => void submitVote(p.id)} className={`w-full bg-white p-4 border-4 border-black text-left flex items-center gap-4 disabled:opacity-60 active:translate-y-1 active:shadow-none transition-all ${COLORS.buttonShadow}`}>
                    <div className="w-16 h-16 bg-white border-2 border-black p-1 overflow-hidden shrink-0">
                        <img src={items.find(i => (p.inventory || []).includes(i.id))?.image} className="w-full h-full object-contain" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-[#E94E34] uppercase tracking-widest mb-1 italic leading-none">{p.name}'s Collection</p>
                        <p className="text-xl font-black leading-tight truncate">"{p.wingTitle}"</p>
                    </div>
                </button>
              ))}
            </div>
          </div>
        ) : room.phase === PHASES.VOTING && hasVoted ? (
          <div className="p-16 text-center space-y-10 flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in shrink-0">
              <div className="relative"><CheckSquare size={140} className="text-[#1A1A1A]" /><div className="absolute -bottom-2 -right-2 bg-[#F4D03F] text-black w-12 h-12 flex items-center justify-center font-black border-4 border-black text-2xl">✓</div></div>
              <div className="space-y-4">
                  <h3 className="text-5xl font-black uppercase italic leading-none tracking-tighter">Vote Locked</h3>
                  <p className="font-bold uppercase tracking-[0.2em] text-sm text-center">Results Incoming</p>
              </div>
          </div>
        ) : room.phase === PHASES.RESULTS ? (
          <div className="p-4 space-y-6 animate-in slide-in-from-bottom pb-10">
            <div className="text-center space-y-2 py-4">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">The Vault</h2>
                <p className="font-black uppercase text-xs tracking-widest text-[#E94E34]">Most Valuable Mistakes</p>
            </div>
            <div className="space-y-6">
              {[...items]
                .filter(i => i.auctioned)
                .sort((a, b) => (b.pricePaid || 0) - (a.pricePaid || 0))
                .map((item, index) => (
                <div key={item.id} className={`bg-white border-4 border-black ${COLORS.cardShadow} p-4 flex flex-col relative`}>
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#F4D03F] border-4 border-black flex items-center justify-center font-black text-xl z-10">
                    #{index + 1}
                  </div>
                  <div className="bg-[#f4f1ea] border-4 border-black w-full aspect-square mb-4 flex items-center justify-center p-2 relative">
                    <img src={item.image} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    {item.returned && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                          <span className="bg-[#E94E34] text-white px-4 py-1 font-black text-2xl border-4 border-white shadow-xl -rotate-12 uppercase opacity-90">Mistake</span>
                       </div>
                    )}
                  </div>
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex-1 overflow-hidden pr-2">
                        <h4 className="text-2xl font-black uppercase leading-tight truncate">"{item.title || "Untitled"}"</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Artist: {item.artistName}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Sold For</p>
                        <p className="text-3xl font-black font-mono tracking-tighter text-[#2E5CAF] leading-none">${item.pricePaid || 0}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => downloadArtwork(item)}
                    className={`w-full py-3 bg-[#1A1A1A] text-white flex items-center justify-center gap-2 text-xl active:translate-y-1 active:shadow-none transition-all ${COLORS.buttonShadow}`}
                  >
                    <Download size={20} />
                    SAVE PLACARD
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>

      {/* Mobile Footer Nav (Hidden during drawing to clear space) */}
      {room?.phase !== PHASES.STUDIO_DRAW && (
        <div className="bg-white border-t-4 border-black p-6 flex justify-around items-center text-slate-300 shrink-0 z-10">
           <div className={`flex flex-col items-center ${room?.phase?.includes('STUDIO') ? 'text-[#E94E34] scale-125' : 'grayscale opacity-30'} transition-all`}><Edit3 size={30} /></div>
           <div className={`flex flex-col items-center ${room?.phase === PHASES.AUCTION ? 'text-[#E94E34] scale-125' : 'grayscale opacity-30'} transition-all`}><Gavel size={30} /></div>
           <div className={`flex flex-col items-center ${room?.phase === PHASES.RESULTS ? 'text-[#E94E34] scale-125' : 'grayscale opacity-30'} transition-all`}><Award size={30} /></div>
        </div>
      )}
    </div>
  );
}
