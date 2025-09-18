import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SidePanel } from './components/SidePanel';
import { chordData as staticChordData } from './services/geminiService';
import { 
  transposeProgression, 
  getChordNoteStrings,
  startChordSound, 
  stopChordSound, 
  startNoteSound,
  stopNoteSound,
  initAudio,
  parseChord,
  INVERSION_REGEX,
  updateChord,
  playChordOnce,
  sampler,
  drumPlayers,
  drumVolume,
  humanizeProgression,
  parseNote,
  KEY_SIGNATURES,
  transposeChord
} from './index';
import { KEY_OPTIONS, ChordSet, SequenceChord, Pattern, DrumSound } from './types';
import { Piano } from './components/Piano';
import { generateProgression } from './services/geminiService';
import { HoverDisplay } from './components/HoverDisplay';
import { Sequencer } from './components/Sequencer';
import * as Tone from 'tone';
import { TransportControls } from './components/TransportControls';
import { ChordEditor } from './components/ChordEditor';
import { DrumEditor } from './components/DrumMachine';
import { PRESET_DRUM_PATTERNS, DRUM_SOUNDS } from './components/drums/drumPatterns';
import { ArrangementView } from './components/PatternControls';
import { HamburgerIcon } from './components/icons/HamburgerIcon';


// --- History Hook ---
const useHistory = <T,>(initialState: T) => {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  const setState = useCallback((action: T | ((prevState: T) => T)) => {
    const currentState = history[index];
    const newState = typeof action === 'function' ? (action as (prevState: T) => T)(currentState) : action;

    if (JSON.stringify(currentState) === JSON.stringify(newState)) {
      return;
    }
    
    const newHistory = history.slice(0, index + 1);
    newHistory.push(newState);
    
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  }, [history, index]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(i => i - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      // FIX: The redo function was incorrectly decrementing the index. It should increment.
      setIndex(i => i + 1);
    }
  }, [index, history.length]);

  return {
    state: history[index],
    setState,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
};

// Simple unique ID generator
const generateId = () => `_${Math.random().toString(36).substr(2, 9)}`;

// --- Loading Screen Component ---
const LoadingScreen: React.FC<{ isLoaded: boolean; onStart: () => void; }> = ({ isLoaded, onStart }) => {
  const [progress, setProgress] = useState(0);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      // Animate progress to 100% over 2.5s
      setProgress(100); 

      // Enable the button after the animation
      const timer = setTimeout(() => {
        setIsButtonEnabled(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Moving lights animation */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-indigo-600 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-sky-500 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text mb-2 font-display">
          Cadence
        </h1>
        <p className="text-lg text-gray-400 mb-8 tracking-wider">The Songwriter's Canvas</p>
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-indigo-500 transition-all duration-[2500ms] ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <button 
          onClick={onStart} 
          disabled={!isButtonEnabled}
          className="mt-4 px-6 py-3 bg-indigo-600 rounded-lg text-lg font-semibold transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 hover:enabled:bg-indigo-700 hover:enabled:scale-105"
        >
          Click to Start
        </button>
        {!isLoaded && <p className="text-gray-400 mt-4">Loading audio samples...</p>}
      </div>

       <style>{`
          @keyframes indeterminate-loader {
            0% { left: -33.33%; }
            100% { left: 100%; }
          }
          .animate-indeterminate-loader {
            animation: indeterminate-loader 1.5s ease-in-out infinite;
          }
          
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
       `}</style>
    </div>
  );
};


// --- Note Normalization for Piano UI ---
const FLAT_TO_SHARP: { [note: string]: string } = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
};
const normalizeNoteForPiano = (note: string): string => {
  if (!note) return '';
  const match = note.match(/^([A-G](?:b|#)?)(.*)$/);
  if (!match) return note;
  const pitch = match[1];
  const rest = match[2];
  return (FLAT_TO_SHARP[pitch] || pitch) + rest;
};
const normalizeNotesForPiano = (notes: string[]): string[] => notes.map(normalizeNoteForPiano);

const CODE_TO_PAD_INDEX: { [code: string]: number } = {
  // Top number row
  'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3,
  // QWERTY row
  'KeyQ': 4, 'KeyW': 5, 'KeyE': 6, 'KeyR': 7,
  // ASDF row
  'KeyA': 8, 'KeyS': 9, 'KeyD': 10, 'KeyF': 11,
  // ZXCV row
  'KeyZ': 12, 'KeyX': 13, 'KeyC': 14, 'KeyV': 15,

  // Numpad mapping (as per user request)
  'Numpad0': 0,
  'NumpadDecimal': 1,
  'NumpadEnter': 2,
  'Numpad1': 3,
  'Numpad2': 4,
  'Numpad3': 5,
  'Numpad4': 6,
  'Numpad5': 7,
  'Numpad6': 8,
  'Numpad7': 9,
  'Numpad8': 10,
  'Numpad9': 11,
  'NumLock': 12,
  'NumpadDivide': 13,
  'NumpadMultiply': 14,
};


const KEY_LABELS = [
  '1', '2', '3', '4',
  'Q', 'W', 'E', 'R',
  'A', 'S', 'D', 'F',
  'Z', 'X', 'C', 'V',
];

// --- Pattern Helpers ---
const expandDrumPattern = (pattern: Record<DrumSound, boolean[]>, bars: number): Record<DrumSound, boolean[]> => {
  const newPattern = {} as Record<DrumSound, boolean[]>;
  DRUM_SOUNDS.forEach(sound => {
    const track = pattern[sound] || [];
    const basePattern = track.length >= 16 ? track.slice(0, 16) : [...track, ...Array(16 - track.length).fill(false)];
    newPattern[sound] = Array(bars).fill(basePattern).flat();
  });
  return newPattern;
};

const createNewPattern = (name: string, bars: 4 | 8, initialDrumPattern: Record<DrumSound, boolean[]>): Pattern => ({
  id: generateId(),
  name,
  bars,
  sequence: [],
  drumPattern: expandDrumPattern(initialDrumPattern, bars),
});

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [songKey, setSongKey] = useState<string>('C');
  const [category, setCategory] = useState<string>(PRESET_DRUM_PATTERNS[0].name);
  const [chordSetIndex, setChordSetIndex] = useState(0);
  const [octave, setOctave] = useState(0);
  const [inversionLevel, setInversionLevel] = useState(0); 
  const [voicingMode, setVoicingMode] = useState<'off' | 'manual' | 'auto'>('auto');
  const [isPianoLoaded, setIsPianoLoaded] = useState(false);
  const [activePadChordNotes, setActivePadChordNotes] = useState<string[]>([]);
  const [activePianoNote, setActivePianoNote] = useState<string | null>(null);
  const [generatedChordSets, setGeneratedChordSets] = useState<ChordSet[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredItemName, setHoveredItemName] = useState<string | null>(null);
  const [hoveredNotes, setHoveredNotes] = useState<string[]>([]);
  const [lastPlayedName, setLastPlayedName] = useState<string | null>(null);
  
  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPianoVisible, setIsPianoVisible] = useState(false);
  const [isPianoClosing, setIsPianoClosing] = useState(false);

  // --- Master Audio State ---
  const [masterVolume, setMasterVolume] = useState(0); // in dB
  const [isMuted, setIsMuted] = useState(false);


  // --- Pattern & Sequencer State with History ---
  const {
    state: patterns,
    setState: setPatterns,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory<Pattern[]>([createNewPattern('Pattern 1', 4, PRESET_DRUM_PATTERNS[0].pattern)]);
  
  const [currentPatternId, setCurrentPatternId] = useState(patterns[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [playingChordId, setPlayingChordId] = useState<string | null>(null);
  const [sequencerActiveNotes, setSequencerActiveNotes] = useState<string[]>([]);
  const [activeSequencerManualNotes, setActiveSequencerManualNotes] = useState<string[]>([]);
  const [isSequencerVoicingOn, setIsSequencerVoicingOn] = useState(true);
  const [isSequencerClickMuted, setIsSequencerClickMuted] = useState(false);
  const [selectedChordIds, setSelectedChordIds] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<Array<Omit<SequenceChord, 'id'>>>([]);
  const partRef = useRef<Tone.Part | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const prevSongKeyRef = useRef<string>(songKey);

  const currentPattern = useMemo(() => patterns.find(p => p.id === currentPatternId) ?? patterns[0], [patterns, currentPatternId]);
  const sequence = useMemo(() => currentPattern?.sequence || [], [currentPattern]);
  const bars = useMemo(() => currentPattern?.bars ?? 4, [currentPattern]);
  const loopEnd = useMemo(() => `${bars}m`, [bars]);

  // --- Keyboard Pad Control State ---
  const [activeKeyboardNotes, setActiveKeyboardNotes] = useState<Map<string, string[]>>(new Map());
  const [activeKeyboardPadIndices, setActiveKeyboardPadIndices] = useState<Set<number>>(new Set());
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const updatePattern = useCallback((id: string, updates: Partial<Pattern>) => {
    setPatterns(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  }, [setPatterns]);

  // Keyboard listeners for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;

      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier) {
        const key = e.key.toLowerCase();
        
        // Undo/Redo
        const isUndo = key === 'z' && !e.shiftKey;
        const isRedo = key === 'y' || (key === 'z' && e.shiftKey);
        if (isUndo) { e.preventDefault(); undo(); return; }
        if (isRedo) { e.preventDefault(); redo(); return; }

        // Cut/Copy/Paste
        const isCopy = key === 'c';
        const isCut = key === 'x';
        const isPaste = key === 'v';

        if (isCopy || isCut) {
          e.preventDefault();
          if (selectedChordIds.size === 0) return;
          const selectedChords = sequence.filter(c => selectedChordIds.has(c.id)).sort((a, b) => a.start - b.start);
          if (selectedChords.length > 0) {
            const firstChordStart = selectedChords[0].start;
            const clipboardContent = selectedChords.map(({ id, ...chord }) => ({ ...chord, start: chord.start - firstChordStart }));
            setClipboard(clipboardContent);
            if (isCut) {
              const newSequence = sequence.filter(c => !selectedChordIds.has(c.id));
              updatePattern(currentPatternId, { sequence: newSequence });
              setSelectedChordIds(new Set());
            }
          }
        } else if (isPaste) {
          e.preventDefault();
          if (clipboard.length === 0) return;
          const ppq = Tone.Transport.PPQ;
          const ticksPer16th = ppq / 4;
          const currentTick = Tone.Transport.ticks;
          const pasteStartStep = Math.round(currentTick / ticksPer16th);
          const newChords = clipboard.map(clipboardChord => ({ ...clipboardChord, id: generateId(), start: pasteStartStep + clipboardChord.start }));
          const patternEndStep = bars * 16;
          const validNewChords = newChords.filter(c => c.start < patternEndStep);
          if (validNewChords.length > 0) {
            const newSequence = [...sequence, ...validNewChords];
            updatePattern(currentPatternId, { sequence: newSequence });
            const newSelectedIds = new Set(validNewChords.map(c => c.id));
            setSelectedChordIds(newSelectedIds);
          }
        }
      } else {
        // Deletion
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedChordIds.size > 0) {
          e.preventDefault();
          const newSequence = sequence.filter(c => !selectedChordIds.has(c.id));
          updatePattern(currentPatternId, { sequence: newSequence });
          setSelectedChordIds(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedChordIds, sequence, clipboard, bars, currentPatternId, updatePattern]);


  // Sync Master Audio
  useEffect(() => {
    Tone.Destination.volume.value = masterVolume;
  }, [masterVolume]);

  useEffect(() => {
    Tone.Destination.mute = isMuted;
  }, [isMuted]);


  // --- Transpose Sequencer on Key Change ---
  useEffect(() => {
    if (prevSongKeyRef.current !== songKey && sequence.length > 0) {
      const oldKey = prevSongKeyRef.current;
      const newKey = songKey;
      const oldKeyIndex = parseNote(oldKey);
      const newKeyIndex = parseNote(newKey);
      if (!isNaN(oldKeyIndex) && !isNaN(newKeyIndex)) {
        const interval = newKeyIndex - oldKeyIndex;
        const useSharps = KEY_SIGNATURES[newKey] !== 'flats';
        const newSequence = sequence.map(seqChord => ({
          ...seqChord,
          chordName: transposeChord(seqChord.chordName, interval, useSharps),
        }));
        setPatterns(prev => prev.map(p => p.id === currentPatternId ? { ...p, sequence: newSequence } : p));
      }
    }
    prevSongKeyRef.current = songKey;
  }, [songKey, sequence, currentPatternId, setPatterns]);

  // --- Metronome State ---
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const metronomeRef = useRef<{ synth: Tone.Synth, loop: Tone.Loop } | null>(null);

  // --- Chord Editor State ---
  const [editingChord, setEditingChord] = useState<SequenceChord | null>(null);
  const [activeEditorPreviewNotes, setActiveEditorPreviewNotes] = useState<string[]>([]);

  // --- Drum Machine State ---
  const [isDrumsEnabled, setIsDrumsEnabled] = useState(false);
  const [drumVol, setDrumVol] = useState(-6);
  const [selectedDrumPresetIndex, setSelectedDrumPresetIndex] = useState(0);
  const [activeDrumStep, setActiveDrumStep] = useState<number | null>(null);
  const [isDrumEditorOpen, setIsDrumEditorOpen] = useState(false);
  const [isDrumEditorClosing, setIsDrumEditorClosing] = useState(false);
  const drumSequenceRef = useRef<Tone.Sequence<number> | null>(null);
  const drumPattern = useMemo(() => currentPattern?.drumPattern, [currentPattern]);

  // Disable context menu globally, except on elements with custom context menus
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-has-context-menu="true"]')) {
        return;
      }
      if (!e.ctrlKey) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu as EventListener);
    return () => document.removeEventListener('contextmenu', handleContextMenu as EventListener);
  }, []);

  // Configure Tone.Transport to loop
  useEffect(() => {
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = loopEnd;
  }, [loopEnd]);

  // Initialize Metronome
  useEffect(() => {
    const metronomeSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.1 },
        volume: -12,
    }).toDestination();
    const loop = new Tone.Loop(time => {
      const ticks = Tone.Transport.getTicksAtTime(time);
      const currentBeat = Math.floor(ticks / Tone.Transport.PPQ) % 4;
      if (currentBeat === 0) metronomeSynth.triggerAttackRelease("G5", "32n", time);
      else metronomeSynth.triggerAttackRelease("C5", "32n", time);
    }, "4n").start(0);
    loop.mute = true;
    metronomeRef.current = { synth: metronomeSynth, loop };
    return () => {
        metronomeRef.current?.synth.dispose();
        metronomeRef.current?.loop.dispose();
    }
  }, []);

  useEffect(() => {
    if (metronomeRef.current) {
        metronomeRef.current.loop.mute = !isMetronomeOn;
    }
  }, [isMetronomeOn]);


  const handlePadMouseUp = useCallback(() => {
    if (activePadChordNotes.length > 0) {
      stopChordSound(activePadChordNotes);
      setActivePadChordNotes([]);
    }
  }, [activePadChordNotes]);

  const handleSequencerChordMouseUp = useCallback(() => {
    if (activeSequencerManualNotes.length > 0) {
      stopChordSound(activeSequencerManualNotes);
      setActiveSequencerManualNotes([]);
    }
  }, [activeSequencerManualNotes]);

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handlePadMouseUp();
      handleSequencerChordMouseUp();
      if (activePianoNote) {
        stopNoteSound(activePianoNote);
        setActivePianoNote(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    document.documentElement.addEventListener('mouseleave', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, [activePianoNote, handlePadMouseUp, handleSequencerChordMouseUp]);

  // Sync Tone.Transport BPM with state
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const processedSequence = useMemo(() => {
    if (voicingMode === 'auto' && isSequencerVoicingOn && sequence.length > 0) {
      const chordNames = sequence.map(c => c.chordName);
      const humanizedNames = humanizeProgression(chordNames);
      return sequence.map((seqChord, index) => ({
        ...seqChord,
        chordName: humanizedNames[index],
      }));
    }
    return sequence;
  }, [sequence, voicingMode, isSequencerVoicingOn]);

  // Sync Tone.Part with sequence state
  useEffect(() => {
    if (partRef.current) {
      partRef.current.dispose();
    }
    const events: { time: string; type: string; id: string | null; chordName: string | null; }[] = [];
    processedSequence.forEach(seqChord => {
      const totalSixteenthsStart = seqChord.start;
      const barStart = Math.floor(totalSixteenthsStart / 16);
      const beatStart = Math.floor((totalSixteenthsStart % 16) / 4);
      const sixteenthStart = totalSixteenthsStart % 4;
      events.push({ time: `${barStart}:${beatStart}:${sixteenthStart}`, type: 'attack', id: seqChord.id, chordName: seqChord.chordName });
      const totalSixteenthsEnd = seqChord.start + seqChord.duration;
      const barEnd = Math.floor(totalSixteenthsEnd / 16);
      const beatEnd = Math.floor((totalSixteenthsEnd % 16) / 4);
      const sixteenthEnd = totalSixteenthsEnd % 4;
      events.push({ time: `${barEnd}:${beatEnd}:${sixteenthEnd}`, type: 'release', id: seqChord.id, chordName: seqChord.chordName });
    });
    
    const endBar = bars;
    events.push({ time: `${endBar}:0:0`, type: 'ui_stop', id: null, chordName: null });

    partRef.current = new Tone.Part((time, value) => {
      const chordNotes = value.chordName ? getChordNoteStrings(value.chordName, octave) : [];
      if (value.type === 'attack' && chordNotes.length > 0) {
        sampler.release = 0.05;
        sampler.triggerAttack(chordNotes, time);
        Tone.Draw.schedule(() => {
          setPlayingChordId(value.id);
          setSequencerActiveNotes(chordNotes);
          setLastPlayedName(value.chordName);
        }, time);
      } else if (value.type === 'release' && chordNotes.length > 0) {
        sampler.triggerRelease(chordNotes, time);
        Tone.Draw.schedule(() => {
          setPlayingChordId(currentId => {
            if (currentId === value.id) {
              setSequencerActiveNotes([]);
              return null;
            }
            return currentId;
          });
        }, time);
      } else if (value.type === 'ui_stop') {
        Tone.Draw.schedule(() => {
          setPlayingChordId(null);
          setSequencerActiveNotes([]);
        }, time);
      }
    }, events).start(0);
    partRef.current.loop = true;
    partRef.current.loopEnd = loopEnd;
  }, [processedSequence, octave, loopEnd, bars]);

  const updatePlayhead = useCallback(() => {
    if (Tone.Transport.state === 'started') {
      const progress = Tone.Transport.progress;
      const totalBeats = bars * 4;
      setPlayheadPosition(progress * totalBeats);
    }
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [bars]);

  
  // Start/Stop RAF loop for playhead
  useEffect(() => {
    if (isPlaying) {
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
      }
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (Tone.Transport.state === 'stopped') {
        setPlayheadPosition(0);
      }
    }
    return () => {
       if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isPlaying, updatePlayhead]);
  
  const handlePlay = () => {
    if (Tone.context.state !== 'running') Tone.start();
    if (isPlaying) {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    Tone.Transport.stop();
    sampler.releaseAll();
    setIsPlaying(false);
    setPlayheadPosition(0);
    setPlayingChordId(null);
    setSequencerActiveNotes([]);
    setActiveDrumStep(null);
  };

  const handlePanic = () => {
    sampler.releaseAll();
    // Stop all drum sounds
    drumPlayers.stopAll();
    Tone.Transport.pause();
    setIsPlaying(false);
    setSequencerActiveNotes([]);
    setPlayingChordId(null);
  };

  const renamePattern = useCallback((id: string, newName: string) => {
    if (newName.trim()) {
      updatePattern(id, { name: newName.trim() });
    }
  }, [updatePattern]);

  const addChordToSequence = useCallback((chordName: string, start: number) => {
    const newChord: SequenceChord = {
      id: generateId(), chordName, start, duration: 8,
    };
    const newSequence = [...sequence, newChord];
    updatePattern(currentPatternId, { sequence: newSequence });
  }, [sequence, currentPatternId, updatePattern]);

  const updateChordInSequence = useCallback((id: string, newProps: Partial<SequenceChord>) => {
    const newSequence = sequence.map(c => (c.id === id ? { ...c, ...newProps } : c));
    updatePattern(currentPatternId, { sequence: newSequence });
  }, [sequence, currentPatternId, updatePattern]);

  const removeChordFromSequence = useCallback((id: string) => {
    const newSequence = sequence.filter(c => c.id !== id);
    updatePattern(currentPatternId, { sequence: newSequence });
  }, [sequence, currentPatternId, updatePattern]);
  
  const handleSequencerChordSelect = useCallback((id: string, e: React.MouseEvent) => {
    setSelectedChordIds(prevIds => {
      const newIds = new Set(prevIds);
      const isMultiKey = e.metaKey || e.ctrlKey || e.shiftKey;
  
      if (!isMultiKey) {
        newIds.clear();
        newIds.add(id);
        return newIds;
      }
  
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      return newIds;
    });
  }, []);

  const handleDeselectChords = useCallback(() => {
    setSelectedChordIds(new Set());
  }, []);

  const handleMainContentClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleDeselectChords();
    }
  }, [handleDeselectChords]);

  const playSequencerChord = (chordName: string) => {
    sampler.release = 0.1;
    const notes = getChordNoteStrings(chordName, octave);
    if (notes.length > 0) {
      startChordSound(notes);
      setActiveSequencerManualNotes(notes);
      setLastPlayedName(chordName);
    }
  };
  
  const handleSeek = useCallback((newPositionInBeats: number) => {
    const totalSixteenths = newPositionInBeats * 4;
    const bar = Math.floor(totalSixteenths / 16);
    const beat = Math.floor((totalSixteenths % 16) / 4);
    const sixteenth = totalSixteenths % 4;
    Tone.Transport.position = `${bar}:${beat}:${sixteenth}`;
    // Also update state for immediate visual feedback when paused
    setPlayheadPosition(newPositionInBeats);
  }, []);

  const handleApplyChordEdit = (newChordName: string) => {
    if (editingChord) {
      updateChordInSequence(editingChord.id, { chordName: newChordName });
    }
    setEditingChord(null);
  };
  
  const playEditorPreview = useCallback((chordName: string) => {
    // Stop old notes first.
    if (activeEditorPreviewNotes.length > 0) {
      stopChordSound(activeEditorPreviewNotes);
    }

    // Then, set up and play new notes.
    sampler.release = 0.1;
    const notes = getChordNoteStrings(chordName, octave);
    if (notes.length > 0) {
      startChordSound(notes);
      setActiveEditorPreviewNotes(notes);
      setLastPlayedName(chordName);
    } else {
      // If the new chord has no notes, ensure the state is clear.
      setActiveEditorPreviewNotes([]);
    }
  }, [octave, activeEditorPreviewNotes]);

  const stopEditorPreview = useCallback(() => {
    if (activeEditorPreviewNotes.length > 0) {
      stopChordSound(activeEditorPreviewNotes);
      setActiveEditorPreviewNotes([]);
    }
  }, [activeEditorPreviewNotes]);

  // --- Bar Mode Logic ---
  const handleToggleBarMode = (patternId: string) => {
    setPatterns(prevPatterns => prevPatterns.map(p => {
        if (p.id === patternId) {
            const newBars = p.bars === 4 ? 8 : 4;
            const targetLength = newBars * 16;

            const newDrumPattern = { ...p.drumPattern };
            DRUM_SOUNDS.forEach(sound => {
                const track = p.drumPattern[sound] || [];
                const currentLength = track.length;
                if (targetLength > currentLength) {
                    newDrumPattern[sound] = [...track, ...track]; // Expand
                } else if (targetLength < currentLength) {
                    newDrumPattern[sound] = track.slice(0, targetLength); // Shrink
                }
            });

            const newSequence = newBars === 8 ? p.sequence : p.sequence.filter(c => c.start < 64);

            return { ...p, bars: newBars, drumPattern: newDrumPattern, sequence: newSequence };
        }
        return p;
    }));
  };

  // --- Drum Machine Preset Logic ---
  useEffect(() => {
    if (!currentPattern) return;
    const matchingPresetIndex = PRESET_DRUM_PATTERNS.findIndex(p => p.name === category);
    if (matchingPresetIndex !== -1) {
      setSelectedDrumPresetIndex(matchingPresetIndex);
      const newDrumPreset = PRESET_DRUM_PATTERNS[matchingPresetIndex].pattern;
      updatePattern(currentPatternId, { drumPattern: expandDrumPattern(newDrumPreset, currentPattern.bars) });
    } else {
      let fallbackIndex = PRESET_DRUM_PATTERNS.findIndex(p => p.name === "Common Progressions");
      if (fallbackIndex === -1) fallbackIndex = 0;
      setSelectedDrumPresetIndex(fallbackIndex);
      const newDrumPreset = PRESET_DRUM_PATTERNS[fallbackIndex].pattern;
      updatePattern(currentPatternId, { drumPattern: expandDrumPattern(newDrumPreset, currentPattern.bars) });
    }
  }, [category, currentPattern, currentPatternId, updatePattern]); // Only runs when category changes

  // FIX: The value from the state, which could be a string, needs to be parsed as a number before being assigned to the Tone.js volume property.
  useEffect(() => {
    const volAsNumber = Number(drumVol);
    if (isFinite(volAsNumber)) {
      drumVolume.volume.value = volAsNumber;
    }
  }, [drumVol]);

  const handleDrumPatternChange = (sound: DrumSound, step: number, value: boolean) => {
      if (!drumPattern) return;
      const newDrumPattern = { ...drumPattern };
      const soundTrack = newDrumPattern[sound] || [];
      const newSoundRow = [...soundTrack];
      
      const targetLength = bars * 16;
      while (newSoundRow.length < targetLength) {
        newSoundRow.push(false);
      }
      newSoundRow.length = targetLength;

      newSoundRow[step] = value;
      newDrumPattern[sound] = newSoundRow;
      updatePattern(currentPatternId, { drumPattern: newDrumPattern });
  };
  
  // Effect for creating/recreating the drum sequence based on pattern/bar changes
  useEffect(() => {
    if (drumSequenceRef.current) drumSequenceRef.current.dispose();
    if (!isPianoLoaded || !drumPattern) return;
    
    const steps = bars * 16;

    const sequence = new Tone.Sequence<number>((time, step) => {
        DRUM_SOUNDS.forEach(sound => {
            if (drumPattern[sound]?.[step] && drumPlayers.player(sound).loaded) {
                drumPlayers.player(sound).start(time);
            }
        });
        Tone.Draw.schedule(() => setActiveDrumStep(step), time);
    }, Array.from({ length: steps }, (_, i) => i), "16n").start(0);

    sequence.loop = true;
    sequence.loopEnd = loopEnd;
    sequence.mute = !isDrumsEnabled; // Set initial mute state
    drumSequenceRef.current = sequence;

    return () => {
      sequence.dispose();
    };
  }, [drumPattern, isPianoLoaded, bars, loopEnd]);

  // Effect for toggling the mute state of the existing drum sequence
  useEffect(() => {
    if (drumSequenceRef.current) {
      drumSequenceRef.current.mute = !isDrumsEnabled;
    }
  }, [isDrumsEnabled]);


  const chordData = useMemo(() => {
    const generatedData = generatedChordSets.length > 0 ? { "AI Generated": generatedChordSets } : {};
    return { ...generatedData, ...staticChordData };
  }, [generatedChordSets]);
  
  const categories = useMemo(() => Object.keys(chordData), [chordData]);

  useEffect(() => {
    initAudio().then(() => setIsPianoLoaded(true));
  }, []);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setChordSetIndex(0);
  };
  
  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const newChords = await generateProgression(prompt, songKey);
      if (newChords.length > 0) {
        const newSet: ChordSet = { name: `AI: ${prompt.substring(0, 30)}...`, chords: newChords };
        setGeneratedChordSets(prev => [newSet, ...prev]);
        setCategory("AI Generated");
        setChordSetIndex(0);
      } else throw new Error("AI returned an empty progression.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedChordSet = useMemo(() => {
    if (!chordData[category] || !chordData[category][chordSetIndex]) {
      const firstCategory = Object.keys(chordData)[0];
      return chordData[firstCategory]?.[0] || { name: '', chords: [] };
    }
    return chordData[category][chordSetIndex];
  }, [category, chordSetIndex, chordData]);

  const processChordsForDisplay = useCallback((chords: string[]) => {
      if (voicingMode !== 'manual') return chords;
      const getInvSuffix = (level: number) => {
        switch (level) {
          case 1: return ' (1st inv.)'; case 2: return ' (2nd inv.)';
          case 3: return ' (3rd inv.)'; default: return '';
        }
      };
      const invSuffix = getInvSuffix(inversionLevel);
      return chords.map(chord => {
        const parsed = parseChord(chord);
        if (!parsed || parsed.bass) return chord;
        const baseChordName = `${parsed.root}${parsed.quality.replace(INVERSION_REGEX, '').trim()}`;
        return invSuffix ? `${baseChordName}${invSuffix}` : baseChordName;
      });
  }, [inversionLevel, voicingMode]);

  const transposedChords = useMemo(() => {
    if (!selectedChordSet?.chords) return [];
    const transposed = transposeProgression(selectedChordSet.chords, songKey);
    if (voicingMode === 'auto') return humanizeProgression(transposed);
    return processChordsForDisplay(transposed);
  }, [selectedChordSet, songKey, voicingMode, processChordsForDisplay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;
      const code = e.code;
      if (pressedKeysRef.current.has(code) || !CODE_TO_PAD_INDEX.hasOwnProperty(code)) return;
      
      const padIndex = CODE_TO_PAD_INDEX[code];
      if (padIndex < transposedChords.length) {
        e.preventDefault();
        pressedKeysRef.current.add(code);
        setActiveKeyboardPadIndices(prev => new Set(prev).add(padIndex));
        const chordName = transposedChords[padIndex];
        setLastPlayedName(chordName);
        sampler.attack = 0.005;
        sampler.release = 0.1;
        const notes = getChordNoteStrings(chordName, octave);
        if (notes.length > 0) {
          startChordSound(notes);
          setActiveKeyboardNotes(prev => new Map(prev).set(code, notes));
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (!CODE_TO_PAD_INDEX.hasOwnProperty(code)) return;

      const padIndex = CODE_TO_PAD_INDEX[code];
      setActiveKeyboardPadIndices(prev => {
        const newSet = new Set(prev);
        newSet.delete(padIndex);
        return newSet;
      });
      
      pressedKeysRef.current.delete(code);
      setActiveKeyboardNotes(prev => {
        const notesToStop = prev.get(code);
        if (notesToStop) {
          stopChordSound(notesToStop);
          const newMap = new Map(prev);
          newMap.delete(code);
          return newMap;
        }
        return prev;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      sampler.releaseAll();
    };
  }, [transposedChords, octave]);

  const displayedChordSets = useMemo(() => {
    if (!chordData[category]) return [];
    return chordData[category].map(set => {
       const transposed = transposeProgression(set.chords, songKey);
       const finalChords = processChordsForDisplay(transposed);
       return { ...set, name: set.name.startsWith("AI:") ? set.name : finalChords.join(', ') };
    });
  }, [category, songKey, chordData, processChordsForDisplay]);

  const handlePadMouseDown = (chordName: string) => {
    sampler.attack = 0.005;
    sampler.release = 0.1;
    const notes = getChordNoteStrings(chordName, octave);
    if (notes.length > 0) {
      startChordSound(notes);
      setActivePadChordNotes(notes);
      setLastPlayedName(chordName);
    }
  };

  const handlePianoMouseDown = (note: string) => {
    sampler.release = 0.1;
    startNoteSound(note);
    setActivePianoNote(note);
    setLastPlayedName(note);
  };

  const handlePadMouseEnter = (chordName: string) => {
    const notes = getChordNoteStrings(chordName, octave);
    if (notes.length > 0) {
      const noteNames = notes.map(n => n.replace(/[0-9]/g, '')).join(' ');
      setHoveredItemName(noteNames);
      setHoveredNotes(notes);
    }
  };

  const handlePadMouseLeave = () => { setHoveredItemName(null); setHoveredNotes([]); };

  const handlePianoKeyMouseEnter = (note: string) => {
    if (activePianoNote && note !== activePianoNote) {
      stopNoteSound(activePianoNote);
      startNoteSound(note);
      setActivePianoNote(note);
      setLastPlayedName(note);
    }
    setHoveredItemName(note);
    setHoveredNotes([note]);
  };

  const handlePianoKeyMouseLeave = () => { setHoveredItemName(null); setHoveredNotes([]); };
  const handlePianoMouseLeave = () => {
    if (activePianoNote) { stopNoteSound(activePianoNote); setActivePianoNote(null); }
    setHoveredItemName(null); setHoveredNotes([]);
  };

  const allActiveNotes = useMemo(() => {
    const notes = [
      ...activePadChordNotes, ...activeEditorPreviewNotes, ...sequencerActiveNotes,
      ...activeSequencerManualNotes, ...Array.from(activeKeyboardNotes.values()).flat()
    ];
    if (activePianoNote) notes.push(activePianoNote);
    return [...new Set(notes)];
  }, [activePadChordNotes, activeEditorPreviewNotes, activePianoNote, sequencerActiveNotes, activeSequencerManualNotes, activeKeyboardNotes]);
    
  useEffect(() => {
    if (allActiveNotes.length === 0 && !isPlaying) setLastPlayedName(null);
  }, [allActiveNotes, isPlaying]);

  const highlightedNotesForPiano = useMemo(() => normalizeNotesForPiano([...new Set([...allActiveNotes, ...hoveredNotes])]), [allActiveNotes, hoveredNotes]);
  const pressedPianoNotes = useMemo(() => normalizeNotesForPiano(allActiveNotes), [allActiveNotes]);

  const handleAddPattern = () => {
    const matchingPreset = PRESET_DRUM_PATTERNS.find(p => p.name === category);
    const drumPreset = matchingPreset ? matchingPreset.pattern : PRESET_DRUM_PATTERNS[0].pattern;
    const newPattern = createNewPattern(`Pattern ${patterns.length + 1}`, 4, drumPreset);
    setPatterns(prev => [...prev, newPattern]);
    setCurrentPatternId(newPattern.id);
  };

  const handleDeletePattern = (id: string) => {
    if (patterns.length <= 1) return;
    const newPatterns = patterns.filter(p => p.id !== id);
    setPatterns(newPatterns);
    if (currentPatternId === id) {
      setCurrentPatternId(newPatterns[0].id);
    }
  };
  
  const handleCopyPattern = (idToCopy: string) => {
    const patternToCopy = patterns.find(p => p.id === idToCopy);
    if (!patternToCopy) return;

    const newPattern: Pattern = {
        ...JSON.parse(JSON.stringify(patternToCopy)), // Deep copy
        id: generateId(),
        name: `${patternToCopy.name} (copy)`,
    };

    const sourceIndex = patterns.findIndex(p => p.id === idToCopy);
    
    setPatterns(prev => {
        const newPatterns = [...prev];
        newPatterns.splice(sourceIndex + 1, 0, newPattern);
        return newPatterns;
    });
    setCurrentPatternId(newPattern.id);
  };
  
  const handleReorderPatterns = (draggedId: string, targetId: string) => {
    setPatterns(prevPatterns => {
      const newPatterns = [...prevPatterns];
      const draggedIndex = newPatterns.findIndex(p => p.id === draggedId);
      const targetIndex = newPatterns.findIndex(p => p.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prevPatterns;

      const [draggedItem] = newPatterns.splice(draggedIndex, 1);
      newPatterns.splice(targetIndex, 0, draggedItem);
      
      return newPatterns;
    });
  };

  const handleToggleDrumEditor = () => {
    if (isDrumEditorOpen && !isDrumEditorClosing) {
      setIsDrumEditorClosing(true);
      setTimeout(() => {
        setIsDrumEditorOpen(false);
        setIsDrumEditorClosing(false);
      }, 300); // match animation duration
    } else if (!isDrumEditorOpen) {
      setIsDrumEditorOpen(true);
    }
  };

  const handleTogglePiano = () => {
    if (isPianoVisible && !isPianoClosing) {
      setIsPianoClosing(true);
      setTimeout(() => {
        setIsPianoVisible(false);
        setIsPianoClosing(false);
      }, 300); // match animation duration
    } else if (!isPianoVisible) {
      setIsPianoVisible(true);
    }
  };

  const handleStartApp = useCallback(() => {
    Tone.start();
    
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.warn(`Could not enter fullscreen mode: ${err.message}`);
      });
    }

    setIsAppReady(true);
  }, []);

  if (!isAppReady) {
    return <LoadingScreen isLoaded={isPianoLoaded} onStart={handleStartApp} />;
  }
  
  const drumEditorPanelHeight = 244;
  const pianoPanelHeight = 136;
  const drumEditorRow = (isDrumEditorOpen && !isDrumEditorClosing) ? `${drumEditorPanelHeight}px` : '0px';
  const pianoRow = (isPianoVisible && !isPianoClosing) ? `${pianoPanelHeight}px` : '0px';

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex selection:bg-indigo-500 selection:text-white overflow-hidden">
      <main className="flex-1 grid grid-rows-[1fr_auto] w-full overflow-hidden">
        {/* Grid Row 1: Main Content */}
        <div 
          className="overflow-y-auto custom-scrollbar min-h-0"
          onClick={handleMainContentClick}
        >
          <div className="flex flex-col gap-2 px-8 py-2">
            <div className="flex-shrink-0">
              <Header />
              <HoverDisplay name={lastPlayedName || hoveredItemName} />
            </div>
            
            <div className="flex-shrink-0">
              <ArrangementView
                patterns={patterns}
                currentPattern={currentPattern}
                onSelectPattern={setCurrentPatternId}
                onAddPattern={handleAddPattern}
                onDeletePattern={handleDeletePattern}
                onRenamePattern={renamePattern}
                onCopyPattern={handleCopyPattern}
                onReorderPatterns={handleReorderPatterns}
                bpm={bpm}
                onBpmChange={setBpm}
                onToggleBarMode={handleToggleBarMode}
                isDrumsEnabled={isDrumsEnabled}
                onToggleDrumsEnabled={() => setIsDrumsEnabled(p => !p)}
                onToggleDrumEditor={handleToggleDrumEditor}
                isDrumEditorOpen={isDrumEditorOpen}
                isMetronomeOn={isMetronomeOn}
                onMetronomeToggle={() => setIsMetronomeOn(prev => !prev)}
                isPianoVisible={isPianoVisible}
                onTogglePiano={handleTogglePiano}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </div>

            <div className="flex-shrink-0 bg-gray-800/50 rounded-lg border border-gray-700">
              <Sequencer 
                sequence={processedSequence}
                onAddChord={addChordToSequence}
                onUpdateChord={updateChordInSequence}
                onRemoveChord={removeChordFromSequence}
                onChordDoubleClick={setEditingChord}
                onPlayChord={playSequencerChord}
                onChordSelect={handleSequencerChordSelect}
                onDeselect={handleDeselectChords}
                onChordMouseUp={handleSequencerChordMouseUp}
                playheadPosition={playheadPosition}
                playingChordId={playingChordId}
                selectedChordIds={selectedChordIds}
                bars={bars}
                onSeek={handleSeek}
                isClickMuted={isSequencerClickMuted}
                onMuteToggle={() => setIsSequencerClickMuted(p => !p)}
              />
            </div>
          </div>
        </div>
        
        {/* Grid Row 2: Bottom Panels */}
        <div>
          <div 
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{
              gridTemplateRows: `${drumEditorRow} ${pianoRow}`,
            }}
          >
            <div className="overflow-hidden">
              {(isDrumEditorOpen || isDrumEditorClosing) && (
                <DrumEditor
                  pattern={drumPattern}
                  onPatternChange={handleDrumPatternChange}
                  volume={drumVol}
                  onVolumeChange={setDrumVol}
                  activeStep={activeDrumStep}
                  bars={bars}
                  onClose={handleToggleDrumEditor}
                />
              )}
            </div>
            <div className="overflow-hidden">
              {(isPianoVisible || isPianoClosing) && (
                <div className="px-8 pb-2">
                  <Piano 
                    highlightedNotes={highlightedNotesForPiano}
                    pressedNotes={pressedPianoNotes}
                    onKeyMouseDown={handlePianoMouseDown}
                    onKeyMouseEnter={handlePianoKeyMouseEnter}
                    onKeyMouseLeave={handlePianoKeyMouseLeave}
                    onPianoMouseLeave={handlePianoMouseLeave}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="z-30">
            <TransportControls 
              isPlaying={isPlaying}
              onPlayPause={handlePlay}
              onStop={handleStop}
              onPanic={handlePanic}
              playheadPosition={playheadPosition}
              bars={bars}
              masterVolume={masterVolume}
              onMasterVolumeChange={setMasterVolume}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(prev => !prev)}
            />
          </div>
        </div>

        {error && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-up" role="alert">
            <p><span className="font-bold">Error:</span> {error}</p>
          </div>
        )}
      </main>

      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 right-4 z-50 p-2 bg-gray-700/80 rounded-full text-white hover:bg-gray-600 transition-colors hidden lg:block shadow-lg"
          aria-label="Open sidebar"
          title="Open Sidebar"
        >
          <HamburgerIcon className="w-6 h-6" />
        </button>
      )}

      <SidePanel
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        songKey={songKey} setSongKey={setSongKey} category={category} setCategory={handleCategoryChange}
        chordSetIndex={chordSetIndex} setChordSetIndex={setChordSetIndex} categories={categories}
        chordSets={displayedChordSets} keys={KEY_OPTIONS} chords={transposedChords}
        onPadMouseDown={handlePadMouseDown} onPadMouseUp={handlePadMouseUp}
        onPadMouseEnter={handlePadMouseEnter} onPadMouseLeave={handlePadMouseLeave}
        isPianoLoaded={isPianoLoaded} octave={octave} setOctave={setOctave}
        inversionLevel={inversionLevel} setInversionLevel={setInversionLevel}
        voicingMode={voicingMode} setVoicingMode={setVoicingMode}
        onGenerate={handleGenerate} isGenerating={isGenerating} keyLabels={KEY_LABELS}
        isSequencerVoicingOn={isSequencerVoicingOn} setIsSequencerVoicingOn={setIsSequencerVoicingOn}
        activeKeyboardPadIndices={activeKeyboardPadIndices}
      />

      {editingChord && (
        <ChordEditor 
          chord={editingChord}
          onClose={() => { stopEditorPreview(); setEditingChord(null); }}
          onApply={handleApplyChordEdit}
          onPreview={playEditorPreview}
          updateChordUtil={updateChord}
        />
      )}
       <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }

          @keyframes fade-in-up {
            from { opacity: 0; transform: translate(-50%, 10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
          .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
          
          @keyframes pulse-fast {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          .animate-pulse-fast { animation: pulse-fast 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
       `}</style>
    </div>
  );
};

export default App;