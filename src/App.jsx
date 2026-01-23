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
  getDocs
} from 'firebase/firestore';
import { 
  Palette, Pencil, Trash2, Users, Timer, 
  Gavel, ImageIcon, Award, CheckCircle2,
  Trophy, Coins, Volume2, VolumeX,
  AlertCircle, History,
  PenTool,
  Star,
  Target,
  RefreshCw,
  ArrowRightLeft,
  Play,
  Layers
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
  INTRO_VIDEO: 'INTRO_VIDEO',
  STUDIO_DRAW: 'STUDIO_DRAW',
  STUDIO_APPRAISE: 'STUDIO_APPRAISE',
  AUCTION: 'AUCTION',
  CURATION: 'CURATION',
  PRESENTATION: 'PRESENTATION', 
  VOTING: 'VOTING',
  RESULTS: 'RESULTS'
};

const PROMPTS = ["A failed invention", "A cursed heirloom", "A luxury snack", "A DIY haircut gone wrong", "The world's smallest problem", "A suspicious gift", "An invisible pet", "A sentient appliance", "A forgotten time capsule", "Forbidden modern art", "A sandwich that looks like it’s judging you", "a pigeon in a tuxedo at a gala", "the physical embodiment of a Monday", "a haunted bouncy castle", "a cactus trying too hard to be sexy", "a Victorian child discovering a fidget spinner", "a cloud having a mid-life crisis", "a sentient pair of cargo shorts", "the tooth fairy’s day job", "a fish riding a bicycle poorly", "a house built entirely out of loose teeth", "a sleep-deprived sun", "a biblically accurate Furby", "a horse wearing high heels", "the coolest guy at the Renaissance Fair", "a baguette that is also a sword", "an octopus trying to use a laptop", "a very muscular strawberry", "a ghost trying to use a touchscreen", "a mailbox that eats hands", "a fashionable swamp monster", "a dog that is definitely three kids in a trench coat", "a birthday cake for someone you hate", "a rock star who is literally a rock", "the inside of a black hole’s junk drawer", "a squirrel planning a heist", "a toaster that only burns 'Help' into bread", "a yoga pose that is physically impossible", "a gnome who has seen too much", "a refrigerator that is secretly a portal", "a very polite spider", "a sneaker made of actual meat", "the world’s worst superhero", "a tea party for feral raccoons", "a baby with a full beard", "a mountain with a giant zipper", "a jazz-playing shrimp", "a pizza with illegal toppings", "a cat that is clearly a wizard", "a snowman in a tanning bed", "a hot dog that is a legal witness", "a tree growing money but it is all pennies", "a UFO that looks like a kitchen appliance", "a butterfly with human ears", "a cowboy who is also a centaur", "a skeleton at a spa", "a pineapple that is also a grenade", "a very aggressive dandelion", "a sofa that wants to eat you", "a mime fighting an invisible bear", "a gargoyle with a selfie stick", "a penguin at a tropical resort", "a banana peel’s revenge", "a robot trying to understand love", "a burger that is way too tall", "a lemon that just tasted something sour", "a wizard who is bad at magic", "a disco ball made of eyes", "a dragon who hoards used napkins", "a skateboard made of ice", "a shark in a business meeting", "a mailbox full of bees", "a crown made of hot dogs", "a vampire at a garlic festival", "a moon with a do not disturb sign", "a toilet that is also a throne", "a giraffe with a short neck", "a marshmallow getting toasted", "a pair of glasses for a wooden cyclops", "a guitar that is also a chainsaw", "a very fancy potato", "a spider with eight different shoes", "a worm wearing a scarf", "a candle that smells like regret", "a phone that is literally just a brick", "a beehive that is also a condo", "a turtle with a jetpack", "a steak that looks like a celebrity", "a grumpy raincloud", "a blender that is terrified of kale", "a car that runs on vibes", "a pirate who is afraid of water", "a watermelon with teeth", "a clock that tells you when you will die", "a mushroom with a hat", "a sock that lost its twin", "a very judgmental mirror", "a squirrel with a lightsaber", "a taco that is also a wallet", "a tree that grows hands instead of leaves", "a disco ball in a cave", "a ghost eating a slice of pizza", "a robot with a mid-life crisis", "a fish in a birdcage", "a volcano that erupts glitter", "a very buff pigeon", "a snowman at the beach", "a cactus that needs a hug", "a suitcase with legs", "a moon made of cheese", "a very fashionable Bigfoot", "a toaster that is also a camera", "a bird with human arms", "a very angry cupcake", "a snake wearing a sweater", "a bowling ball with a face", "a very fancy dumpster", "a lighthouse that is also a giant candle", "a teapot that is also a house", "a very cool worm", "a cat with a jetpack", "a very tall hat", "a dog in a space suit", "a very angry cloud", "a pizza with eyes", "a very fancy rat", "a ghost in a bikini", "a robot with a hat", "a very buff cat", "a fish with a hat", "a very fancy frog", "a ghost with a hat", "a robot with a dog", "a very angry sun", "a pizza with a hat", "a very fancy bird", "a ghost with a dog", "a robot with a cat", "a very angry moon", "a pizza with a cat", "a very fancy fish", "a ghost with a cat", "a robot with a hat", "a very angry star", "a pizza with a dog", "a very fancy snail", "a ghost with a bird", "a robot with a bird", "a very angry planet", "a pizza with a bird", "a very fancy lizard", "a ghost with a snail", "a robot with a snail", "a very angry comet", "a pizza with a snail", "a very fancy bug", "a ghost with a bug", "a robot with a bug", "a very angry asteroid", "a pizza with a bug", "a bowling ball having a nightmare", "a sentient jar of mayonnaise in a beauty pageant", "a gargoyle trying hide a sneeze", "an avocado with a realistic human eye", "a squirrel wearing tiny denim overalls", "a lawnmower that only eats four-leaf clovers", "a cloud that is actually just a big pile of mashed potatoes", "a skyscraper with a giant belly button", "a pigeon wearing a wire for the FBI", "a spider trying to knit a sweater", "a hot dog in a sleeping bag", "a tree growing human ears instead of leaves", "a toaster that is secretly a DJ", "a haunted box of raisins", "a very muscular goldfish", "a cowboy riding a giant shrimp", "a mime trapped in a real glass box", "a vampire at a blood drive with a coupon", "a pizza with a missing poster for the pepperoni", "a cat in a business suit giving a PowerPoint", "a snowman with a flamethrower", "a lemon with a six-pack", "a mailbox full of spaghetti", "a very polite monster under the bed", "a cactus trying to use a balloon animal", "a banana wearing a leather jacket", "a ghost trying to wear a backpack", "a robot trying to eat a salad", "a squirrel with a tiny megaphone", "a very fancy brick", "a dragon with a collection of rubber ducks", "a shark wearing a life vest", "a pineapple with a mohawk", "a very angry loaf of bread", "a turtle with a speed limit sign", "a ghost in a tuxedo", "a robot with a mid-life crisis and a sports car", "a fish with a snorkel", "a very buff butterfly", "a tree with a giant zipper", "a disco ball in a dumpster", "a very fancy rat in a tiny bathtub", "a snowman at a BBQ", "a cactus in a knitted sweater", "a suitcase with human legs and high heels", "a moon with a giant Band-Aid", "a very fashionable Bigfoot at brunch", "a toaster that only pops up live birds", "a bird with human hands for wings", "a very angry cupcake with a knife", "a snake wearing a scarf and a monocle", "a bowling ball with a toupee", "a very fancy dumpster fire", "a lighthouse that is a giant flashlight", "a teapot that is a time machine", "a very cool worm with sunglasses and a skateboard", "a cat with a jetpack and a laser pointer", "a very tall hat with a smaller hat on top", "a dog in a space suit chasing a bone satellite", "a very angry cloud with lightning teeth", "a pizza with a face made of toppings", "a very fancy rat eating a tiny cheese plate", "a ghost in a polka dot bikini", "a robot with a cowboy hat and a lasso", "a very buff cat lifting a giant yarn ball", "a fish with a top hat and a cane", "a very fancy frog on a lily pad throne", "a ghost with a tiny pet ghost dog", "a robot with a mechanical cat", "a very angry sun with sunglasses", "a pizza with a tiny chef hat", "a very fancy bird with a pearl necklace", "a ghost with a suitcase and a map", "a robot with a tiny robot child", "a very angry moon with a nightcap", "a pizza with a cat face", "a very fancy fish in a tuxedo", "a ghost with an umbrella in the rain", "a robot with a birthday cake", "a very angry star with a frown", "a pizza with a dog face", "a very fancy snail with a glitter shell", "a ghost with a bird on its shoulder", "a robot with a pet bird", "a very angry planet with rings", "a pizza with a bird face", "a very fancy lizard in a suit", "a ghost with a pet snail", "a robot with a pet snail", "a very angry comet with a tail", "a pizza with a snail face", "a very fancy bug with a top hat", "a ghost with a pet bug", "a robot with a pet bug", "a very angry asteroid with eyes", "a pizza with a bug face", "a sentient cloud of bees holding a balloon", "a refrigerator running away from a kitchen", "a skeleton playing a ribcage like a xylophone", "a very fancy rock with a mustache"];

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

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const newWidth = rect.width * dpr;
    const newHeight = rect.height * dpr;

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
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext("2d");
    context.scale(dpr, dpr);
    context.lineCap = "round";
    context.lineJoin = "round"; 
    context.strokeStyle = color;
    context.lineWidth = thickness;
    
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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 p-2 overflow-hidden font-sans select-none touch-none text-white">
      <style>{`
        body { -webkit-user-select: none; -webkit-touch-callout: none; }
        canvas { touch-action: none; }
      `}</style>
      <div className="flex justify-between items-center p-3 bg-slate-800 rounded-2xl mb-2 shadow-xl shrink-0">
        <div className="flex-1 pr-4">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Sketchpad</p>
          <h2 className="text-sm sm:text-lg font-black text-white leading-tight break-words">{prompt}</h2>
        </div>
        <div className={`px-4 py-2 rounded-xl font-mono text-xl font-bold ${timeLeft < 10 ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'} text-white shrink-0`}>
          {timeLeft}s
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 relative bg-white rounded-[2rem] shadow-2xl overflow-hidden cursor-crosshair border-8 border-slate-800">
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

      <div className="py-4 px-2 space-y-4 shrink-0">
        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-2 flex-wrap flex-1">
            {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f59e0b', '#a855f7', '#D2996C', '#06b6d4', '#ec4899', '#78350f', '#64748b', '#ffffff'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full border-4 ${color === c ? 'border-indigo-400 scale-110' : 'border-slate-700 shadow-lg'} transition-all`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button onClick={() => contextRef.current.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors">
            <Trash2 size={24} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-2xl shadow-inner">
          <Pencil size={20} className="text-slate-400" />
          <input type="range" min="2" max="30" value={thickness} onChange={(e) => setThickness(parseInt(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg active:scale-95 transition-all uppercase italic">Submit</button>
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
  const [isMuted, setIsMuted] = useState(false);
  const [voted, setVoted] = useState(false);
  const [curationOrder, setCurationOrder] = useState([]);
  const [submittedCuration, setSubmittedCuration] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const audioRef = useRef(null);

  const me = useMemo(() => players.find(p => p.id === user?.uid), [players, user?.uid]);

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
  }, [isMuted]);

  useEffect(() => {
    if (room?.phase === PHASES.VOTING) {
      setVoted(false);
    }
  }, [room?.phase]);

  // Host logic
  useEffect(() => {
    if (view !== 'host' || !room) return;
    let timer;

    const phaseUptime = Date.now() - (room.phaseStartedAt || 0);
    const isSettled = phaseUptime > 3000;

    if (isSettled && players.length > 0 && players.every(p => p.ready)) {
      if (room.phase === PHASES.STUDIO_DRAW) distributeAppraisals();
      else if (room.phase === PHASES.STUDIO_APPRAISE) startPhase(PHASES.AUCTION);
      else if (room.phase === PHASES.CURATION) startPhase(PHASES.PRESENTATION);
      else if (room.phase === PHASES.PRESENTATION) startPhase(PHASES.VOTING);
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
            updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), { presentingIdx: currentIdx + 1, presentationTimer: 12 });
          } else { 
            startPhase(PHASES.VOTING); 
          }
        }
      }, 1000);
    }

    if (room.phase === PHASES.AUCTION) {
      if (!room.currentAuction) {
        const nextItem = items.find(i => i.appraised && !i.auctioned);
        if (nextItem) {
          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
            currentAuction: {
              itemId: nextItem.id,
              item: nextItem,
              type: 'STANDARD',
              highestBid: 0,
              highestBidder: null,
              highestBidderName: null,
              timer: 15 
            }
          });
        } else if (items.length > 0 && items.every(i => i.auctioned)) {
          startPhase(PHASES.CURATION);
        }
      } else {
        timer = setInterval(async () => {
          const auction = room.currentAuction;
          const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
          if (auction.timer <= 0) {
            clearInterval(timer);
            finalizeAuction();
          } else {
            updateDoc(roomRef, { 'currentAuction.timer': auction.timer - 1 });
          }
        }, 1000);
      }
    }

    return () => clearInterval(timer);
  }, [view, room?.phase, room?.currentAuction, room?.presentingIdx, room?.presentationTimer, players, items, room?.phaseStartedAt]);

  const distributeAppraisals = async () => {
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    const batch = writeBatch(db);
    const sortedPlayers = [...players].sort((a,b) => a.id.localeCompare(b.id));
    const playerIds = sortedPlayers.map(p => p.id);
    const n = playerIds.length;

    const itemsByArtist = {};
    items.forEach(i => {
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

    batch.update(roomRef, { phase: PHASES.STUDIO_APPRAISE, phaseStartedAt: Date.now(), presentingIdx: 0, presentationTimer: 12 });
    players.forEach(p => { batch.update(doc(roomRef, 'players', p.id), { ready: false }); });
    await batch.commit();
  };

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
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    const batch = writeBatch(db);
    batch.update(roomRef, { phase, phaseStartedAt: Date.now(), presentingIdx: 0, presentationTimer: 12 });
    players.forEach(p => { batch.update(doc(roomRef, 'players', p.id), { ready: false }); });
    await batch.commit();
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
        transaction.update(rRef, { 'currentAuction.highestBid': amount, 'currentAuction.highestBidder': user.uid, 'currentAuction.highestBidderName': name || curMe.name, 'currentAuction.timer': 7 });
      });
    } catch (e) { /* ignore retry */ }
    setIsBidding(false);
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
    const commonPrompts = [...PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 3);
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code), {
      hostId: user.uid, phase: PHASES.LOBBY, currentAuction: null, phaseStartedAt: Date.now(), gamePrompts: commonPrompts, videoPlayed: false
    });
    setRoomId(code); setView('host');
  };

  const joinGame = async (code) => {
    const formattedCode = code.toUpperCase();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', formattedCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) { setStatusMsg("Invalid Room"); return; }
    
    // FIXED: Removed objective requirement which caused joining bug
    await setDoc(doc(roomRef, 'players', user.uid), { 
      name, 
      cash: 1000, 
      inventory: [], 
      ready: false, 
      votes: 0, 
      wingTitle: '' 
    });
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
      gamePrompts: commonPrompts, currentAuction: null, videoPlayed: true 
    });
    players.forEach(p => {
      const pRef = doc(roomRef, 'players', p.id);
      batch.update(pRef, { cash: 1000, inventory: [], ready: false, votes: 0, wingTitle: '' });
    });
    await batch.commit();
    setSubmittedCuration(false);
    setCurationOrder([]);
    setVoted(false);
  };

  const handleDrawingSubmit = async (dataUrl) => {
    const itemCount = items.filter(i => i.artistId === user.uid).length;
    const prompts = room?.gamePrompts || PROMPTS;
    const itemRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items'));
    await setDoc(itemRef, {
      id: itemRef.id, artistId: user.uid, artistName: name || me?.name, image: dataUrl,
      prompt: prompts[itemCount] || PROMPTS[0],
      title: '', history: '', appraised: false, ownerId: null, pricePaid: 0, auctioned: false, returned: false, appraiserId: null
    });
    if (itemCount >= 2) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true });
    }
  };

  const submitAppraisal = async (itemId, title, history) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'items', itemId), { title, history, appraised: true });
    const remaining = items.filter(i => i.appraiserId === user.uid && !i.appraised && i.id !== itemId);
    if (remaining.length === 0) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true });
    }
  };

  const toggleItemSelection = (id) => {
    setCurationOrder(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // --- Views ---

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="max-w-3xl w-full space-y-12 text-center animate-in fade-in zoom-in duration-700">
          <div className="space-y-4 transform -rotate-1 text-slate-100">
            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-tight uppercase italic break-words">Museum of Modern Mistakes</h1>
            <p className="text-xl font-bold text-indigo-400 tracking-[0.2em] uppercase mt-2">Fine Art for Fumbling Curators</p>
          </div>
          <div className="bg-slate-800 p-8 rounded-[3rem] shadow-2xl border border-slate-700 space-y-6">
            <input type="text" placeholder="Curator Name" className="w-full p-6 bg-slate-900 rounded-2xl border border-slate-700 focus:border-indigo-500 text-xl outline-none transition-all text-white" value={name} onChange={e => setName(e.target.value)} />
            <input type="text" placeholder="Room Code" className="w-full p-6 bg-slate-900 rounded-2xl border border-slate-700 text-center font-mono text-3xl tracking-widest uppercase outline-none transition-all focus:border-indigo-500 text-white" value={roomId} onChange={e => setRoomId(e.target.value)} />
            <button onClick={() => joinGame(roomId)} disabled={!name || !roomId} className="w-full py-6 bg-indigo-600 rounded-2xl font-black text-3xl shadow-xl hover:bg-indigo-500 disabled:opacity-50 transition-all border-b-8 border-indigo-800 active:border-b-0 active:translate-y-2 uppercase italic tracking-tighter text-white">Enter Gallery</button>
            <div className="flex items-center gap-4 text-slate-500 py-2"><hr className="flex-1 border-slate-700" /><span>OR</span><hr className="flex-1 border-slate-700" /></div>
            <button onClick={hostGame} className="w-full py-4 bg-slate-700 rounded-2xl font-bold hover:bg-slate-600 transition-all uppercase tracking-widest text-white">Host Exhibition</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'host') {
    const auctionedCount = items.filter(i => i.auctioned).length;
    const totalToAuction = items.filter(i => i.appraised).length;

    return (
      <div className="min-h-screen flex flex-col p-12 overflow-hidden relative bg-slate-100 font-sans text-slate-900">
        <div className="flex justify-between items-start z-10">
          <div>
            <h1 className="text-4xl font-black text-indigo-600 flex items-center gap-3 drop-shadow-sm uppercase italic">Museum of Modern Mistakes</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-1">Main Gallery Display</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-indigo-600 text-center transform -rotate-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1 leading-none">Room Code</p>
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
              {players.length >= 2 && <button onClick={() => startPhase(room.videoPlayed ? PHASES.STUDIO_DRAW : PHASES.INTRO_VIDEO)} className="px-16 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-4xl shadow-2xl hover:scale-110 transition-transform uppercase tracking-widest border-b-[10px] border-indigo-800">Start Exhibition</button>}
            </div>
          )}

          {room?.phase === PHASES.INTRO_VIDEO && (
            <div className="w-full max-w-6xl aspect-video bg-black rounded-[4rem] overflow-hidden shadow-2xl relative border-8 border-white">
               <video src="/intro.mp4" className="w-full h-full object-cover" autoPlay onEnded={() => startPhase(PHASES.STUDIO_DRAW)} />
               <button onClick={() => startPhase(PHASES.STUDIO_DRAW)} className="absolute bottom-8 right-8 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-8 py-3 rounded-full font-black flex items-center gap-2 transition-all">SKIP VIDEO <ArrowRightLeft size={20}/></button>
            </div>
          )}

          {(room?.phase === PHASES.STUDIO_DRAW || room?.phase === PHASES.STUDIO_APPRAISE) && (
            <div className="text-center space-y-12 animate-in zoom-in">
              {room.phase === PHASES.STUDIO_DRAW ? <PenTool size={120} className="mx-auto text-indigo-500 animate-bounce" /> : <History size={120} className="mx-auto text-orange-500 animate-spin-slow" />}
              <h2 className="text-8xl font-black text-slate-900 leading-none uppercase tracking-tighter">{room.phase === PHASES.STUDIO_DRAW ? "Drawing" : "Appraisal"}</h2>
              <p className="text-3xl text-slate-500 font-medium italic drop-shadow-sm">{room.phase === PHASES.STUDIO_DRAW ? "Painting for the masses..." : "Writing the history books..."}</p>
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
              <div className="w-full max-w-7xl grid grid-cols-2 gap-16 animate-in fade-in slide-in-from-bottom duration-700 px-8">
                <div className="bg-white p-12 rounded-[4rem] shadow-2xl space-y-8 border-4 border-white relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-50 text-indigo-600 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                    <Layers size={16}/> Lot {auctionedCount + 1} of {totalToAuction}
                  </div>
                  <div className="aspect-square w-full bg-slate-50 rounded-[3rem] overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-100">
                    <img src={room.currentAuction.item.image} className="max-h-full max-w-full object-contain p-4" />
                  </div>
                  <div className="text-center mt-6">
                    <h3 className="text-6xl font-black text-slate-900 leading-tight">{room.currentAuction.item.title || "Untitled"}</h3>
                    <p className="text-2xl text-slate-500 mt-2 italic font-medium leading-relaxed">"{room.currentAuction.item.history || "Wait for the reveal..."}"</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center space-y-12 text-slate-100">
                  <div className="p-20 rounded-[4rem] shadow-2xl text-center space-y-8 bg-indigo-900 text-white relative border-b-[20px] border-indigo-950">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-12 py-4 rounded-full font-black text-lg uppercase shadow-xl tracking-widest border-4 border-indigo-500">Standard Auction</div>
                    <p className="text-[12rem] font-black tracking-tighter font-mono leading-none">${room.currentAuction.highestBid}</p>
                    <p className="text-5xl font-black text-indigo-400 uppercase italic tracking-tighter">{room.currentAuction.highestBidderName || "NO BIDS"}</p>
                  </div>
                  <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex items-center justify-between border-b-8 border-slate-200">
                    <div className="flex items-center gap-8">
                      <span className="text-8xl font-black font-mono text-slate-900">{(room.currentAuction.timer || 0)}s</span>
                      <Timer className={`text-slate-300 ${room.currentAuction.timer < 5 ? 'text-red-500 animate-pulse' : ''}`} size={80} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Artist</p>
                      <p className="text-4xl font-black text-slate-800">{room.currentAuction.item.artistName}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-12 animate-pulse">
                <Gavel size={160} className="mx-auto text-indigo-500" />
                <h2 className="text-7xl font-black text-slate-800 uppercase italic tracking-[0.2em]">Preparing Next Lot...</h2>
                <p className="text-3xl font-bold uppercase text-slate-400 tracking-widest">{auctionedCount} sold | {totalToAuction - auctionedCount} remaining</p>
              </div>
            )
          )}

          {room?.phase === PHASES.PRESENTATION && (
            <div className="w-full h-full max-h-[90vh] flex flex-col items-center justify-center animate-in zoom-in duration-700 px-4">
              {players[room.presentingIdx] && (
                <>
                  <div className="text-center mb-6 space-y-1">
                    <div className="inline-block px-10 py-1 bg-indigo-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-lg mb-2 italic">Exhibitor: {players[room.presentingIdx].name}</div>
                    <h2 className="text-6xl font-black text-slate-900 leading-tight italic drop-shadow-sm">"{players[room.presentingIdx].wingTitle}"</h2>
                  </div>
                  <div className="flex w-full gap-8 justify-center items-start px-12">
                    {items.filter(i => (players[room.presentingIdx].inventory || []).includes(i.id)).sort((a,b) => (players[room.presentingIdx].inventory.indexOf(a.id) - players[room.presentingIdx].inventory.indexOf(b.id))).map(item => (
                      <div key={item.id} className="flex-1 max-w-[31%] bg-white p-6 rounded-[3.5rem] shadow-2xl relative border-2 border-white transform transition-transform hover:scale-[1.03]">
                        {item.returned && (
                          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-red-600 text-white px-8 py-3 rounded-xl font-black text-4xl border-8 border-white shadow-2xl z-20 opacity-90 animate-in zoom-in uppercase">Mistake!</div>
                        )}
                        <div className="bg-slate-50 rounded-3xl p-3 mb-6 shadow-inner">
                          <img src={item.image} className="w-full h-48 object-contain mx-auto" />
                        </div>
                        <h4 className="text-3xl font-black text-slate-800 leading-tight mb-2 truncate">{item.title}</h4>
                        <p className="text-sm text-slate-500 italic font-bold leading-tight border-t-2 pt-4 border-slate-100 line-clamp-3">"{item.history}"</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {room?.phase === PHASES.VOTING && (
            <div className="text-center space-y-12 animate-in zoom-in">
              <Star size={160} className="mx-auto text-yellow-400 animate-spin-slow" />
              <h2 className="text-8xl font-black text-slate-900 leading-none uppercase tracking-tighter">Voting Open!</h2>
              <p className="text-3xl text-slate-500 font-medium italic drop-shadow-sm">Curators are selecting their favorite wing...</p>
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

          {room?.phase === PHASES.RESULTS && (
            <div className="w-full max-w-5xl space-y-6 animate-in slide-in-from-bottom flex flex-col items-center">
              <h2 className="text-[8rem] font-black text-center mb-16 flex items-center justify-center gap-10 leading-none drop-shadow-sm uppercase"><Trophy className="text-yellow-400" size={150} /> Results</h2>
              <div className="w-full space-y-6 max-h-[60vh] overflow-y-auto px-4">
                {[...players].sort((a,b) => {
                  const getScore = (p) => {
                    const mistakePenalty = items.filter(i => i.returned && i.artistId === p.id).length * 100;
                    return (p.cash || 0) + (p.votes || 0) * 200 - mistakePenalty;
                  };
                  return getScore(b) - getScore(a);
                }).map((p, i) => {
                  const mistakePenalty = items.filter(i => i.returned && i.artistId === p.id).length * 100;
                  const totalScore = (p.cash || 0) + (p.votes || 0) * 200 - mistakePenalty;
                  return (
                    <div key={p.id} className="bg-white p-10 rounded-[3rem] shadow-2xl flex items-center justify-between border-l-[30px] border-indigo-500 transform transition-all hover:-translate-x-6">
                      <div className="flex items-center gap-12">
                        <span className="text-8xl font-black text-slate-200">#{i+1}</span>
                        <div>
                          <h3 className="text-6xl font-black text-slate-800 mb-2">{p.name}</h3>
                          <div className="flex gap-10 text-2xl text-slate-400 font-bold uppercase tracking-widest"><span className="flex items-center gap-2 text-indigo-400"><Star className="text-indigo-400" /> Votes: {p.votes || 0}</span></div>
                        </div>
                      </div>
                      <div className="text-9xl font-black text-indigo-600 font-mono tracking-tighter leading-none">${totalScore}</div>
                    </div>
                  );
                })}
              </div>
              <button onClick={resetRoom} className="mt-12 px-12 py-6 bg-slate-800 text-white rounded-3xl font-black text-4xl shadow-2xl hover:scale-105 transition-transform flex items-center gap-4 border-b-8 border-slate-950 uppercase italic tracking-widest">Start New Exhibition <RefreshCw size={40}/></button>
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
  const isPanicClient = room?.phase === PHASES.AUCTION && (room.currentAuction?.timer || 0) < 5;

  return (
    <div className={`min-h-[100dvh] flex flex-col max-w-md mx-auto relative overflow-hidden font-sans transition-colors duration-200 ${isPanicClient ? 'bg-red-500 animate-pulse' : 'bg-slate-50'}`}>
      
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center z-10 shadow-xl border-b border-indigo-500/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center font-black text-3xl shadow-inner shadow-black/30">{name ? name[0] : me?.name ? me.name[0] : '?'}</div>
          <div>
            <span className="font-black text-lg tracking-tight block leading-none mb-1 truncate max-w-[80px]">{name || me?.name || 'Curator'}</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 uppercase font-black tracking-widest">Inv: {me?.inventory?.length || 0}/3</div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700 shadow-inner">
          <Coins size={24} className="text-yellow-400" />
          <span className="font-mono font-black text-2xl tracking-tighter leading-none">${me?.cash || 0}</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {!room ? (
          <div className="p-16 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Connecting...</div>
        ) : room.phase === PHASES.LOBBY ? (
          <div className="p-8 text-center space-y-10 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative"><Users size={120} className="text-indigo-500 animate-pulse" /><div className="absolute -top-2 -right-2 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-lg">!</div></div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Joined!</h2>
              <p className="text-slate-500 font-bold text-lg leading-snug">Exhibit wings will be revealed soon.</p>
            </div>
          </div>
        ) : room.phase === PHASES.INTRO_VIDEO ? (
          <div className="p-12 text-center space-y-8 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in shrink-0">
             <Play size={100} className="text-indigo-500 animate-bounce" />
             <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-tight">Rules Briefing</h3>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Watch the main screen for instructions.</p>
          </div>
        ) : room.phase === PHASES.STUDIO_DRAW ? (
          <>
            {me?.ready ? (
              <div className="p-16 text-center space-y-8 flex flex-col items-center justify-center min-h-[60vh] animate-in slide-in-from-bottom shrink-0">
                <CheckCircle2 size={140} className="text-indigo-500" />
                <h3 className="text-4xl font-black text-slate-900 uppercase italic leading-none">Art Delivered</h3>
                <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Waiting for curators...</p>
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
                 <CheckCircle2 size={140} className="text-indigo-500" />
                 <h3 className="text-4xl font-black text-slate-900 uppercase italic leading-none">Certified!</h3>
                 <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Auction is opening...</p>
               </div>
            ) : (
              <>
                {items.filter(i => i.artistId !== user?.uid && !i.appraised && i.appraiserId === user.uid).slice(0, 1).map(item => (
                  <div key={item.id} className="space-y-6 animate-in zoom-in">
                    <div className="text-center">
                      <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Appraisal</h2>
                      <p className="text-slate-500 font-black uppercase text-xs tracking-widest mt-1">Name this masterpiece</p>
                    </div>
                    <div className="aspect-square bg-white rounded-[3.5rem] border-[12px] border-white shadow-2xl overflow-hidden">
                      <img src={item.image} className="w-full h-full object-contain p-2 bg-slate-50" />
                    </div>
                    <div className="space-y-4 pt-4">
                      <input type="text" id="appraisal-title" placeholder="Title..." className="w-full p-6 bg-white rounded-2xl border-4 border-slate-200 font-black text-2xl outline-none focus:border-indigo-500 shadow-inner" />
                      <textarea id="appraisal-history" placeholder="Write a short history..." className="w-full p-6 bg-white rounded-2xl border-4 border-slate-200 font-black text-lg outline-none focus:border-indigo-500 h-28 shadow-inner" />
                      <button onClick={() => {
                          const t = document.getElementById('appraisal-title').value;
                          const h = document.getElementById('appraisal-history').value;
                          if (t && h) submitAppraisal(item.id, t, h);
                        }} className="w-full py-7 bg-indigo-600 text-white rounded-3xl font-black text-3xl shadow-xl active:scale-95 transition-all border-b-8 border-indigo-800 uppercase tracking-tighter"
                      >Verify Item</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : room.phase === PHASES.AUCTION && room.currentAuction ? (
          <div className="p-6 space-y-8 min-h-[85vh] flex flex-col justify-center animate-in fade-in shrink-0">
            <div className="text-center space-y-1">
              <p className={`text-xs font-black uppercase tracking-[0.3em] ${isPanicClient ? 'text-white' : 'text-slate-400'}`}>Current Lot</p>
              <h3 className={`text-3xl font-black leading-tight ${isPanicClient ? 'text-white' : 'text-slate-900'}`}>"{room.currentAuction.item.title || "Unknown Art"}"</h3>
            </div>
            <div className={`w-full bg-slate-900 rounded-[4rem] p-12 text-center text-white shadow-2xl relative border-8 ${(me?.inventory?.length || 0) >= 3 ? 'border-red-600' : isPanicClient ? 'border-white animate-bounce' : 'border-indigo-500'}`}>
              <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-40 leading-none">Price</p>
              <p className="text-8xl font-black font-mono tracking-tighter leading-none">${room.currentAuction.highestBid}</p>
              <p className="text-indigo-400 mt-6 font-black text-2xl uppercase italic tracking-tighter leading-none">{room.currentAuction.highestBidderName || "NO BIDS"}</p>
              {(me?.inventory?.length || 0) >= 3 && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 rounded-[4rem] text-center border-4 border-red-500 animate-in zoom-in"><AlertCircle size={80} className="text-red-500 mb-4" /><p className="font-black text-3xl text-white italic tracking-tighter leading-none uppercase text-center shrink-0">GALLERY<br/>FULL</p></div>
              )}
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[10, 25, 50, 75].map(amt => (
                  <button key={amt} disabled={isBidding || (me?.inventory?.length || 0) >= 3 || room.currentAuction.highestBidder === user.uid} onClick={() => placeBid((room.currentAuction.highestBid || 0) + amt)} className={`py-6 rounded-3xl font-black text-4xl shadow-xl transition-all border-b-8 active:border-b-0 active:translate-y-2 bg-white text-indigo-600 border-slate-200 disabled:opacity-50`}>+${amt}</button>
                ))}
              </div>
            </div>
          </div>
        ) : room.phase === PHASES.CURATION ? (
          <div className="p-8 space-y-6 animate-in slide-in-from-right shrink-0">
            {!submittedCuration ? (
              <>
                <div className="bg-indigo-600 text-white p-6 rounded-[2rem] space-y-2 shadow-2xl border-b-[8px] border-indigo-800 shrink-0"><h2 className="text-2xl font-black leading-tight italic uppercase tracking-tighter">Curation Phase</h2></div>
                <div className="space-y-6 flex-1">
                  <div className="space-y-2"><p className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 leading-none">1. Exhibit Name</p><input type="text" id="w-title" placeholder="A Clever Title..." className="w-full p-5 bg-white rounded-3xl border-4 border-slate-200 font-black text-xl outline-none focus:border-indigo-500 shadow-inner" /></div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end px-1"><p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">2. Set Display Order</p><button onClick={() => setCurationOrder([])} className="text-[10px] font-black text-indigo-500 uppercase underline">Reset</button></div>
                    <div className="grid grid-cols-3 gap-3">
                      {items.filter(i => (me?.inventory || []).includes(i.id)).map(item => {
                        const orderIndex = curationOrder.indexOf(item.id);
                        return (
                          <div key={item.id} onClick={() => toggleItemSelection(item.id)} className={`aspect-square rounded-2xl border-4 transition-all relative overflow-hidden bg-white shadow-md ${orderIndex !== -1 ? 'border-indigo-600 scale-95' : 'border-slate-200 opacity-60'}`}><img src={item.image} className="w-full h-full object-contain" />{orderIndex !== -1 && (<div className="absolute top-2 right-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">{orderIndex + 1}</div>)}</div>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={() => { const titleInput = document.getElementById('w-title'); const title = titleInput ? titleInput.value : "Exhibition"; const finalOrder = curationOrder.length > 0 ? curationOrder : (me?.inventory || []); updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { wingTitle: title || "Exhibition", inventory: finalOrder, ready: true }); setSubmittedCuration(true); }} className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-3xl shadow-xl border-b-[10px] border-indigo-800 uppercase italic tracking-tighter active:scale-95 transition-all">Open Gallery</button>
                </div>
              </>
            ) : (
              <div className="p-16 text-center space-y-8 flex flex-col items-center justify-center min-h-[60vh] animate-in slide-in-from-bottom shrink-0"><CheckCircle2 size={140} className="text-indigo-500" /><h3 className="text-4xl font-black text-slate-900 uppercase italic leading-none">Gallery Sent!</h3><p className="text-slate-400 font-black tracking-widest uppercase text-xs">Waiting for other curators.</p></div>
            )}
          </div>
        ) : room.phase === PHASES.PRESENTATION ? (
          <div className="p-12 text-center space-y-10 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in shrink-0">
             <ImageIcon size={100} className="text-indigo-500 animate-pulse" />
             <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-tight">Exhibition in Progress</h3>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Witness the modern mistakes on the big screen.</p>
          </div>
        ) : room.phase === PHASES.VOTING && !voted ? (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom shrink-0">
            <div className="text-center space-y-1"><h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Cast Your Vote</h2><p className="text-slate-400 font-black uppercase text-xs tracking-widest">Who curated the best wing?</p></div>
            <div className="space-y-5">
              {players.filter(p => p.id !== user.uid && p.wingTitle).map(p => (
                <button key={p.id} onClick={async () => { if (navigator.vibrate) navigator.vibrate(100); const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', p.id); const snap = await getDoc(pRef); await updateDoc(pRef, { votes: (snap.data().votes || 0) + 1 }); setVoted(true); updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true }); }} className="w-full bg-white p-4 rounded-[2.5rem] border-4 border-slate-200 shadow-xl text-left border-b-[12px] active:translate-y-2 active:border-b-0 transition-all border-indigo-100 flex items-center gap-4"><div className="w-20 h-20 bg-slate-50 rounded-2xl p-1 overflow-hidden shrink-0 border-2 border-slate-100"><img src={items.find(i => (p.inventory || []).includes(i.id))?.image} className="w-full h-full object-contain" /></div><div className="overflow-hidden"><p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic leading-none">{p.name}'s Collection</p><p className="text-2xl font-black text-slate-800 leading-tight truncate">"{p.wingTitle}"</p></div></button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-16 text-center space-y-10 flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in shrink-0"><div className="relative"><CheckCircle2 size={160} className="text-indigo-500 animate-bounce" /><div className="absolute -bottom-2 -right-2 bg-yellow-400 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center font-black shadow-lg">✓</div></div><div className="space-y-4"><h3 className="text-6xl font-black uppercase italic leading-none tracking-tighter">{voted ? "Vote Cast!" : "Done!"}</h3><p className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm text-center">Watch the results reveal.</p></div></div>
        )}
      </main>

      <div className="bg-white/80 backdrop-blur-sm border-t-8 border-slate-200 p-8 flex justify-around items-center text-slate-400 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] shrink-0">
         <div className={`flex flex-col items-center ${room?.phase?.includes('STUDIO') ? 'text-indigo-600 scale-150' : 'opacity-10'} transition-all duration-500`}><Palette size={35} /></div>
         <div className={`flex flex-col items-center ${room?.phase === PHASES.AUCTION ? 'text-indigo-600 scale-150' : 'opacity-10'} transition-all duration-500`}><Gavel size={35} /></div>
         <div className={`flex flex-col items-center ${room?.phase === PHASES.RESULTS ? 'text-indigo-600 scale-150' : 'opacity-10'} transition-all duration-500`}><Award size={35} /></div>
      </div>
    </div>
  );
}
