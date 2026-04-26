import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
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
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null; // <-- ADDED THIS
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

const PROMPTS = ["A failed invention", "A cursed heirloom", "A luxury snack", "A DIY haircut gone wrong", "The world's smallest problem", "A suspicious gift", "An invisible pet", "A sentient appliance", "A forgotten time capsule", "Forbidden modern art", "A sandwich that looks like it’s judging you", "a pigeon in a tuxedo at a gala", "the physical embodiment of a Monday", "a haunted bouncy castle", "a cactus trying too hard to be sexy", "a Victorian child discovering a fidget spinner", "a cloud having a mid-life crisis", "a sentient pair of cargo shorts", "the tooth fairy’s day job", "a fish riding a bicycle poorly", "a house built entirely out of loose teeth", "a sleep-deprived sun", "a biblically accurate Furby", "a horse wearing high heels", "the coolest guy at the Renaissance Fair", "a baguette that is also a sword", "an octopus trying to use a laptop", "a very muscular strawberry", "a ghost trying to use a touchscreen", "a mailbox that eats hands", "a fashionable swamp monster", "a dog that is definitely three kids in a trench coat", "a birthday cake for someone you hate", "a rock star who is literally a rock", "the inside of a black hole’s junk drawer", "a squirrel planning a heist", "a toaster that only burns 'Help' into bread", "a yoga pose that is physically impossible", "a gnome who has seen too much", "a refrigerator that is secretly a portal", "a very polite spider", "a sneaker made of actual meat", "the world’s worst superhero", "a tea party for feral raccoons", "a baby with a full beard", "a mountain with a giant zipper", "a jazz-playing shrimp", "a pizza with illegal toppings", "a cat that is clearly a wizard", "a snowman in a tanning bed", "a hot dog that is a legal witness", "a tree growing money but it is all pennies", "a UFO that looks like a kitchen appliance", "a butterfly with human ears", "a cowboy who is also a centaur", "a skeleton at a spa", "a pineapple that is also a grenade", "a very aggressive dandelion", "a sofa that wants to eat you", "a mime fighting an invisible bear", "a gargoyle with a selfie stick", "a penguin at a tropical resort", "a banana peel’s revenge", "a robot trying to understand love", "a burger that is way too tall", "a lemon that just tasted something sour", "a wizard who is bad at magic", "a disco ball made of eyes", "a dragon who hoards used napkins", "a skateboard made of ice", "a shark in a business meeting", "a mailbox full of bees", "a crown made of hot dogs", "a vampire at a garlic festival", "a moon with a do not disturb sign", "a toilet that is also a throne", "a giraffe with a short neck", "a marshmallow getting toasted", "a pair of glasses for a wooden cyclops", "a guitar that is also a chainsaw", "a very fancy potato", "a spider with eight different shoes", "a worm wearing a scarf", "a candle that smells like regret", "a phone that is literally just a brick", "a beehive that is also a condo", "a turtle with a jetpack", "a steak that looks like a celebrity", "a grumpy raincloud", "a blender that is terrified of kale", "a car that runs on vibes", "a pirate who is afraid of water", "a watermelon with teeth", "a clock that tells you when you will die", "a mushroom with a hat", "a sock that lost its twin", "a very judgmental mirror", "a squirrel with a lightsaber", "a taco that is also a wallet", "a tree that grows hands instead of leaves", "a disco ball in a cave", "a ghost eating a slice of pizza", "a robot with a mid-life crisis", "a fish in a birdcage", "a volcano that erupts glitter", "a very buff pigeon", "a snowman at the beach", "a cactus that needs a hug", "a suitcase with legs", "a moon made of cheese", "a very fashionable Bigfoot", "a toaster that is also a camera", "a bird with human arms", "a very angry cupcake", "a snake wearing a sweater", "a bowling ball with a face", "a very fancy dumpster", "a lighthouse that is also a giant candle", "a teapot that is also a house", "a very cool worm", "a cat with a jetpack", "a very tall hat", "a dog in a space suit", "a very angry cloud", "a pizza with eyes", "a very fancy rat", "a ghost in a bikini", "a robot with a hat", "a very buff cat", "a fish with a hat", "a very fancy frog", "a ghost with a hat", "a robot with a dog", "a very angry sun", "a pizza with a hat", "a very fancy bird", "a ghost with a dog", "a robot with a cat", "a very angry moon", "a pizza with a cat", "a very fancy fish", "a ghost with a cat", "a robot with a hat", "a very angry star", "a pizza with a dog", "a very fancy snail", "a ghost with a bird", "a robot with a bird", "a very angry planet", "a pizza with a bird", "a very fancy lizard", "a ghost with a snail", "a robot with a snail", "a very angry comet", "a pizza with a snail", "a very fancy bug", "a ghost with a bug", "a robot with a bug", "a very angry asteroid", "a pizza with a bug", "a bowling ball having a nightmare", "a sentient jar of mayonnaise in a beauty pageant", "a gargoyle trying hide a sneeze", "an avocado with a realistic human eye", "a squirrel wearing tiny denim overalls", "a lawnmower that only eats four-leaf clovers", "a cloud that is actually just a big pile of mashed potatoes", "a skyscraper with a giant belly button", "a pigeon wearing a wire for the FBI", "a spider trying to knit a sweater", "a hot dog in a sleeping bag", "a tree growing human ears instead of leaves", "a toaster that is secretly a DJ", "a haunted box of raisins", "a very muscular goldfish", "a cowboy riding a giant shrimp", "a mime trapped in a real glass box", "a vampire at a blood drive with a coupon", "a pizza with a missing poster for the pepperoni", "a cat in a business suit giving a PowerPoint", "a snowman with a flamethrower", "a lemon with a six-pack", "a mailbox full of spaghetti", "a very polite monster under the bed", "a cactus trying to use a balloon animal", "a banana wearing a leather jacket", "a ghost trying to wear a backpack", "a robot trying to eat a salad", "a squirrel with a tiny megaphone", "a very fancy brick", "a dragon with a collection of rubber ducks", "a shark wearing a life vest", "a pineapple with a mohawk", "a very angry loaf of bread", "a turtle with a speed limit sign", "a ghost in a tuxedo", "a robot with a mid-life crisis and a sports car", "a fish with a snorkel", "a very buff butterfly", "a tree with a giant zipper", "a disco ball in a dumpster", "a very fancy rat in a tiny bathtub", "a snowman at a BBQ", "a cactus in a knitted sweater", "a suitcase with human legs and high heels", "a moon with a giant Band-Aid", "a very fashionable Bigfoot at brunch", "a toaster that only pops up live birds", "a bird with human hands for wings", "a very angry cupcake with a knife", "snake wearing a scarf and a monocle", "a bowling ball with a toupee", "a very fancy dumpster fire", "a lighthouse that is a giant flashlight", "a teapot that is a time machine", "a very cool worm with sunglasses and a skateboard", "a cat with a jetpack and a laser pointer", "a very tall hat with a smaller hat on top", "a dog in a space suit chasing a bone satellite", "a very angry cloud with lightning teeth", "a pizza with a face made of toppings", "a very fancy rat eating a tiny cheese plate", "a ghost in a polka dot bikini", "a robot with a cowboy hat and a lasso", "a very buff cat lifting a giant yarn ball", "a fish with a top hat and a cane", "a very fancy frog on a lily pad throne", "a ghost with a tiny pet ghost dog", "a robot with a mechanical cat", "a very angry sun with sunglasses", "a pizza with a tiny chef hat", "a very fancy bird with a pearl necklace", "a ghost with a suitcase and a map", "a robot with a tiny robot child", "a very angry moon with a nightcap", "a pizza with a cat face", "a very fancy fish in a tuxedo", "a ghost with an umbrella in the rain", "a robot with a birthday cake", "a very angry star with a frown", "a pizza with a dog face", "a very fancy snail with a glitter shell", "a ghost with a bird on its shoulder", "a robot with a pet bird", "a very angry planet with rings", "a pizza with a bird face", "a very fancy lizard in a suit", "a ghost with a pet snail", "a robot with a pet snail", "a very angry comet with a tail", "a pizza with a snail face", "a very fancy bug with a top hat", "a ghost with a pet bug", "a robot with a pet bug", "a very angry asteroid with eyes", "a pizza with a bug face", "a sentient cloud of bees holding a balloon", "a refrigerator running away from a kitchen", "a skeleton playing a ribcage like a xylophone", "a very fancy rock with a mustache"];

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

// --- Components ---

const DrawingCanvas = ({ onSave, prompt, timeLimit }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1A1A1A');
  const [thickness, setThickness] = useState(8);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const contextRef = useRef(null);

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

        <button onClick={handleSave} className={`w-full py-4 bg-[#2E5CAF] text-white text-xl ${COMMON_BTN}`}>DONE</button>
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

  useEffect(() => {
    const fetchArt = async () => {
      try {
        const artQuery = query(collectionGroup(db, 'items'), orderBy('pricePaid', 'desc'), limit(100));
        const snapshot = await getDocs(artQuery);
        setAllArt(snapshot.docs.map(doc => doc.data()));
      } catch (e) {
        console.error("FIREBASE INDEX ERROR: Check your browser console for the link to build the index!", e);
      }
      setLoading(false);
    };
    fetchArt();
  }, [db, appId]);

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-[#f4f1ea] font-black text-4xl uppercase">Opening Vault...</div>;

  return (
    <div className="min-h-[100dvh] bg-[#f4f1ea] p-8 font-sans text-slate-900">
      <h1 className="text-5xl font-black uppercase mb-8 text-center tracking-tighter">Global Museum Vault</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {allArt.map((item, i) => (
          <div key={i} className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col">
            <div className="bg-[#f4f1ea] border-4 border-black w-full aspect-square mb-4 p-2 flex items-center justify-center">
              <img src={item.image} className="max-h-full max-w-full object-contain mix-blend-multiply" />
            </div>
            <h3 className="text-xl font-black uppercase leading-tight truncate">"{item.title || "Untitled"}"</h3>
            <p className="text-xs font-bold text-slate-500 uppercase mt-1">Artist: <span className="text-[#E94E34]">{item.artistName}</span></p>
            <p className="text-lg font-black font-mono text-[#2E5CAF] mt-2">${item.pricePaid || 0}</p>
          </div>
        ))}
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
  const [voted, setVoted] = useState(false);
  const [curationOrder, setCurationOrder] = useState([]);
  const [submittedCuration, setSubmittedCuration] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  // Audio Refs
  const introAudioRef = useRef(null);
  const auctionAudioRef = useRef(null);

  const me = useMemo(() => players.find(p => p.id === user?.uid), [players, user?.uid]);

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

  // Client Auto-Ready Logic for Voting
  useEffect(() => {
    if (view === 'client' && room?.phase === PHASES.VOTING && !voted && user) {
      const candidates = players.filter(p => p.id !== user.uid && p.wingTitle);
      if (candidates.length === 0) {
        setVoted(true);
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true });
      }
    }
  }, [room?.phase, players, voted, user, roomId, view]);

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
    const isSettled = phaseUptime > 1000;

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
        const pool = items.filter(i => i.appraised && !i.auctioned);
        if (pool.length > 0) {
          const nextItem = pool[Math.floor(Math.random() * pool.length)];
          const appraiser = players.find(p => p.id === nextItem.appraiserId);
          
          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId), {
            currentAuction: {
              itemId: nextItem.id,
              item: nextItem,
              appraiserName: appraiser ? appraiser.name : "Unknown",
              highestBid: 0,
              highestBidder: null,
              highestBidderName: null,
              timer: 10 
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

    batch.update(roomRef, { phase: PHASES.STUDIO_APPRAISE, phaseStartedAt: Date.now() });
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
    await updateDoc(roomRef, { currentAuction: null });
  };

const startPhase = async (phase) => {
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId);
    const batch = writeBatch(db);
    batch.update(roomRef, { phase, phaseStartedAt: Date.now(), presentingIdx: 0, presentationTimer: 12 });
    players.forEach(p => { batch.update(doc(roomRef, 'players', p.id), { ready: false }); });
    await batch.commit();

    // Send data to Google Analytics
    if (typeof window !== "undefined" && window.analytics) {
      logEvent(window.analytics, 'phase_started', { phase_name: phase, room_id: roomId });
      if (phase === PHASES.RULES_MODAL) {
        logEvent(window.analytics, 'game_started', { player_count: players.length });
      }
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
      hostId: user.uid, phase: PHASES.LOBBY, currentAuction: null, phaseStartedAt: Date.now(), gamePrompts: commonPrompts
    });
    setRoomId(code); setView('host');
  };

const joinGame = async (code) => {
    const formattedCode = code.toUpperCase();
    
    // Secret Admin Login
    if (formattedCode === "ADMIN") {
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
      gamePrompts: commonPrompts, currentAuction: null
    });
    players.forEach(p => {
      const pRef = doc(roomRef, 'players', p.id);
      batch.update(pRef, { cash: 1000, pendingEarnings: 0, inventory: [], ready: false, votes: 0, wingTitle: '' });
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
            <input type="text" placeholder="ROOM CODE" className="w-full p-4 bg-[#f4f1ea] border-4 border-black text-center font-mono text-2xl tracking-[0.2em] uppercase outline-none focus:bg-white placeholder:text-slate-400" value={roomId} onChange={e => setRoomId(e.target.value)} />
            
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
              {players[room.presentingIdx] && (
                <>
                  <div className="text-center mb-4 shrink-0 z-10">
                    <div className="inline-block px-6 py-1 bg-[#1A1A1A] text-white font-black text-lg uppercase tracking-widest border-4 border-white shadow-xl mb-1 -rotate-2">Curated By: {players[room.presentingIdx].name}</div>
                    <h2 className="text-5xl font-black text-[#1A1A1A] uppercase leading-none tracking-tighter">"{players[room.presentingIdx].wingTitle}"</h2>
                  </div>
                  
                  <div className="flex-1 min-h-0 flex w-full gap-4 lg:gap-8 justify-center items-center px-4 max-w-[95vw] z-10 pb-4">
                    {players[room.presentingIdx].inventory.map((itemId, idx) => {
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
            {!submittedCuration ? (
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
                  <button onClick={() => { const titleInput = document.getElementById('w-title'); const title = titleInput ? titleInput.value : "Exhibition"; const finalOrder = curationOrder.length > 0 ? curationOrder : (me?.inventory || []); updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { wingTitle: title || "Exhibition", inventory: finalOrder, ready: true }); setSubmittedCuration(true); }} className={`w-full py-6 bg-[#1A1A1A] text-white text-2xl active:translate-y-1 active:shadow-none transition-all ${COLORS.buttonShadow}`}>OPEN GALLERY</button>
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
) : room.phase === PHASES.VOTING && !voted ? (
          <div className="p-6 space-y-6 animate-in slide-in-from-bottom shrink-0">
            <div className="text-center space-y-2">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Vote</h2>
                <p className="font-black uppercase text-xs tracking-widest text-slate-500">Pick the best collection</p>
            </div>
            <div className="space-y-4">
              {players.filter(p => p.id !== user.uid && p.wingTitle).map(p => (
                <button key={p.id} onClick={async () => { if (navigator.vibrate) navigator.vibrate(100); const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', p.id); const snap = await getDoc(pRef); await updateDoc(pRef, { votes: (snap.data().votes || 0) + 1 }); setVoted(true); updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomId, 'players', user.uid), { ready: true }); }} className={`w-full bg-white p-4 border-4 border-black text-left flex items-center gap-4 active:translate-y-1 active:shadow-none transition-all ${COLORS.buttonShadow}`}>
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
        ) : room.phase === PHASES.VOTING && voted ? (
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
