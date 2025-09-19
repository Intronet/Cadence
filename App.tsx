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
import { KEY_OPTIONS, ChordSet, SequenceChord, Pattern, DrumSound, DrumPatternPreset } from './types';
import { Piano } from './components/Piano';
import { generateProgression } from './services/geminiService';
import { HoverDisplay } from './components/HoverDisplay';
import { Sequencer } from './components/Sequencer';
import * as Tone from 'tone';
import { TransportControls } from './components/TransportControls';
import { ChordEditor } from './components/ChordEditor';
import { DrumEditor } from './components/DrumMachine';
import { PRESET_DRUM_PATTERNS, DRUM_SOUNDS, EMPTY_DRUM_PATTERNS } from './components/drums/drumPatterns';
import { ArrangementView } from './components/PatternControls';
import { HamburgerIcon } from './components/icons/HamburgerIcon';
import { ConfirmationDialog } from './components/ConfirmationDialog';


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
      setProgress(100); 

      const timer = setTimeout(() => {
        setIsButtonEnabled(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center text-white overflow-hidden">
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
          className="mt-4 px-6 py-3 bg-indigo-600 rounded-[3px] text-lg font-semibold transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 hover:enabled:bg-indigo-700 hover:enabled:scale-105"
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
  'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3,
  'KeyQ': 4, 'KeyW': 5, 'KeyE': 6, 'KeyR': 7,
  'KeyA': 8, 'KeyS': 9, 'KeyD': 10, 'KeyF': 11,
  'KeyZ': 12, 'KeyX': 13, 'KeyC': 14, 'KeyV': 15,
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
const createExpandedDrumPattern = (
  basePattern: Record<DrumSound, boolean[]>,
  bars: number,
  timeSignature: '4/4' | '3/4'
): Record<DrumSound, boolean[]> => {
  const newPattern = {} as Record<DrumSound, boolean[]>;
  const stepsPerBar = timeSignature === '4/4' ? 16 : 12;

  DRUM_SOUNDS.forEach(sound => {
    const track = basePattern[sound] || [];
    const singleBarPattern = track.length >= stepsPerBar
      ? track.slice(0, stepsPerBar)
      : [...track, ...Array(stepsPerBar - track.length).fill(false)];
    newPattern[sound] = Array(bars).fill(singleBarPattern).flat();
  });
  return newPattern;
};

const createNewPattern = (
  name: string,
  bars: 4 | 8,
  timeSignature: '4/4' | '3/4',
  initialDrumPatterns?: Record<DrumSound, boolean[]>
): Pattern => ({
  id: generateId(),
  name,
  bars,
  timeSignature,
  sequence: [],
  drumPattern: initialDrumPatterns ?? createExpandedDrumPattern(EMPTY_DRUM_PATTERNS[timeSignature], bars, timeSignature),
});


const requestFullScreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    }
};

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [songKey, setSongKey] = useState<string>('C');
  const [category, setCategory] = useState<string>(Object.keys(staticChordData)[0]);
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
  const [hoveredNotes, setHoveredNotes] = useState<string[]>([]);
  const [displayText, setDisplayText] = useState<{ name: string; notes: string } | null>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPianoVisible, setIsPianoVisible] = useState(false);

  const [masterVolume, setMasterVolume] = useState(0); // in dB
  const [isMuted, setIsMuted] = useState(false);

  const {
    state: patterns,
    setState: setPatterns,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory<Pattern[]>([createNewPattern('Pattern 1', 4, '4/4')]);
  
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
  const timeSignature = useMemo(() => currentPattern?.timeSignature ?? '4/4', [currentPattern]);
  const timeSignatureValue = useMemo(() => timeSignature === '4/4' ? 4 : 3, [timeSignature]);

  const [activeKeyboardNotes, setActiveKeyboardNotes] = useState<Map<string, string[]>>(new Map());
  const [activeKeyboardPadIndices, setActiveKeyboardPadIndices] = useState<Set<number>>(new Set());
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const updatePattern = useCallback((id: string, updates: Partial<Pattern>) => {
    setPatterns(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  }, [setPatterns]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;

      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier) {
        const key = e.key.toLowerCase();
        
        const isUndo = key === 'z' && !e.shiftKey;
        const isRedo = key === 'y' || (key === 'z' && e.shiftKey);
        if (isUndo) { e.preventDefault(); undo(); return; }
        if (isRedo) { e.preventDefault(); redo(); return; }

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
          const stepsPerBar = timeSignature === '4/4' ? 16 : 12;
          const patternEndStep = bars * stepsPerBar;
          const validNewChords = newChords.filter(c => c.start < patternEndStep);
          if (validNewChords.length > 0) {
            const newSequence = [...sequence, ...validNewChords];
            updatePattern(currentPatternId, { sequence: newSequence });
            const newSelectedIds = new Set(validNewChords.map(c => c.id));
            setSelectedChordIds(newSelectedIds);
          }
        }
      } else {
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
  }, [undo, redo, selectedChordIds, sequence, clipboard, bars, timeSignature, currentPatternId, updatePattern]);

  useEffect(() => {
    Tone.Destination.volume.value = masterVolume;
  }, [masterVolume]);

  useEffect(() => {
    Tone.Destination.mute = isMuted;
  }, [isMuted]);

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

  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const metronomeRef = useRef<{ synth: Tone.Synth, loop: Tone.Loop | null } | null>(null);

  const [editingChord, setEditingChord] = useState<SequenceChord | null>(null);
  const [activeEditorPreviewNotes, setActiveEditorPreviewNotes] = useState<string[]>([]);

  const [isDrumsEnabled, setIsDrumsEnabled] = useState(false);
  const [drumVol, setDrumVol] = useState(-6);
  const [activeDrumStep, setActiveDrumStep] = useState<number | null>(null);
  const [isDrumEditorOpen, setIsDrumEditorOpen] = useState(false);
  const [isDrumEditorClosing, setIsDrumEditorClosing] = useState(false);
  const drumSequenceRef = useRef<Tone.Sequence<number> | null>(null);
  const drumPattern = useMemo(() => currentPattern?.drumPattern, [currentPattern]);

  const [timeSignatureChangeRequest, setTimeSignatureChangeRequest] = useState<{ patternId: string, newTimeSignature: '4/4' | '3/4' } | null>(null);

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

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    Tone.Transport.timeSignature = timeSignatureValue;
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = Tone.Time(`${bars}m`).toSeconds();
  }, [bars, timeSignatureValue]);


  useEffect(() => {
    const metronomeSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.1 },
      volume: -6,
    }).toDestination();
    metronomeRef.current = { synth: metronomeSynth, loop: null };

    return () => {
      metronomeRef.current?.synth.dispose();
      metronomeRef.current?.loop?.dispose();
    };
  }, []);

  useEffect(() => {
    const currentMetronome = metronomeRef.current;
    if (currentMetronome?.loop) {
      currentMetronome.loop.dispose();
      currentMetronome.loop = null;
    }

    if (isMetronomeOn && currentMetronome) {
      const loop = new Tone.Loop(time => {
        if (!metronomeRef.current) return;

        const ticks = Tone.Transport.getTicksAtTime(time);
        const ppq = Tone.Transport.PPQ;
        const beatsPerBar = timeSignatureValue;

        if (ticks % (ppq * beatsPerBar) === 0) {
          metronomeRef.current.synth.triggerAttackRelease('C5', '16n', time);
        } else if (ticks % ppq === 0) {
          metronomeRef.current.synth.triggerAttackRelease('C4', '16n', time);
        }
      }, '4n').start(0);
      currentMetronome.loop = loop;
    }
  }, [isMetronomeOn, timeSignatureValue]);

  useEffect(() => {
    drumVolume.volume.value = drumVol;
  }, [drumVol]);


  const categories = useMemo(() => [...Object.keys(staticChordData), ...generatedChordSets.map(p => p.name)], [generatedChordSets]);
  const chordSets = useMemo(() => {
    const allData = { ...staticChordData, ...generatedChordSets.reduce((acc, curr) => ({ ...acc, [curr.name]: [curr] }), {}) };
    return allData[category] || [];
  }, [category, generatedChordSets]);
  const currentChordSet = useMemo(() => (chordSets[chordSetIndex]?.chords || []).slice(0, 16), [chordSets, chordSetIndex]);

  useEffect(() => {
    initAudio().then(() => setIsPianoLoaded(true));
  }, []);

  const getNotesForVoicing = useCallback((chordName: string) => {
    if (voicingMode === 'manual') {
        return getChordNoteStrings(updateChord(chordName, { inversion: inversionLevel }), octave);
    }
    return getChordNoteStrings(chordName, octave);
  }, [voicingMode, inversionLevel, octave]);

  const humanizedSequence = useMemo(() => {
      if (voicingMode === 'auto' && isSequencerVoicingOn && sequence.length > 0) {
          const originalNames = sequence.map(s => s.chordName);
          const humanizedNames = humanizeProgression(originalNames);
          return sequence.map((s, i) => ({ ...s, chordName: humanizedNames[i] }));
      }
      return sequence;
  }, [sequence, voicingMode, isSequencerVoicingOn]);
  

  const stopActivePadNotes = useCallback(() => {
    if (activePadChordNotes.length > 0) {
      stopChordSound(activePadChordNotes);
      setActivePadChordNotes([]);
      setDisplayText(null);
    }
  }, [activePadChordNotes]);

  const handlePadMouseDown = (chordName: string) => {
    const notes = getNotesForVoicing(chordName);
    startChordSound(notes);
    setActivePadChordNotes(notes);
    const parsed = parseChord(chordName);
    const cleanName = parsed ? `${parsed.root}${parsed.quality}` : chordName;
    setDisplayText({ name: cleanName, notes: getChordNoteStrings(chordName, 0).map(n => n.replace(/[0-9]/g, '')).join(' ') });
  };

  const handlePadMouseEnter = (chordName: string) => {
    const notes = getNotesForVoicing(chordName);
    const parsed = parseChord(chordName);
    const cleanName = parsed ? `${parsed.root}${parsed.quality}` : chordName;
    setDisplayText({ name: cleanName, notes: getChordNoteStrings(chordName, 0).map(n => n.replace(/[0-9]/g, '')).join(' ') });
    setHoveredNotes(notes);
  };
  const clearHoveredNotes = () => {
    setDisplayText(null);
    setHoveredNotes([]);
  };

  const stopActivePianoNote = useCallback(() => {
    if (activePianoNote) {
      stopNoteSound(activePianoNote);
      setActivePianoNote(null);
      setDisplayText(null);
    }
  }, [activePianoNote]);

  const handlePianoMouseDown = (note: string) => {
    startNoteSound(note);
    setActivePianoNote(note);
    setDisplayText({ name: note.replace(/[0-9]/g, ''), notes: '' });
  };
  const handlePianoMouseEnter = (note: string) => {
    if (activePianoNote) {
      stopNoteSound(activePianoNote);
      startNoteSound(note);
      setActivePianoNote(note);
      setDisplayText({ name: note.replace(/[0-9]/g, ''), notes: '' });
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      stopActivePadNotes();
      stopActivePianoNote();
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [stopActivePadNotes, stopActivePianoNote]);


  const activePianoNotes = useMemo(() => normalizeNotesForPiano([
    ...hoveredNotes,
    ...activePadChordNotes,
    ...(activePianoNote ? [activePianoNote] : []),
    ...sequencerActiveNotes,
    ...activeSequencerManualNotes,
    ...activeEditorPreviewNotes,
    ...Array.from(activeKeyboardNotes.values()).flat()
  ]), [hoveredNotes, activePadChordNotes, activePianoNote, sequencerActiveNotes, activeSequencerManualNotes, activeEditorPreviewNotes, activeKeyboardNotes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (pressedKeysRef.current.has(e.code) || (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;
        pressedKeysRef.current.add(e.code);

        const padIndex = CODE_TO_PAD_INDEX[e.code];
        if (padIndex !== undefined && padIndex < currentChordSet.length) {
            e.preventDefault();
            const chordName = currentChordSet[padIndex];
            const notes = getNotesForVoicing(chordName);
            startChordSound(notes);
            setActiveKeyboardNotes(prev => new Map(prev).set(e.code, notes));
            setActiveKeyboardPadIndices(prev => new Set(prev).add(padIndex));
            const parsed = parseChord(chordName);
            const cleanName = parsed ? `${parsed.root}${parsed.quality}` : chordName;
            setDisplayText({ name: cleanName, notes: getChordNoteStrings(chordName, 0).map(n => n.replace(/[0-9]/g, '')).join(' ') });
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        pressedKeysRef.current.delete(e.code);
        const padIndex = CODE_TO_PAD_INDEX[e.code];
        if (padIndex !== undefined) {
          e.preventDefault();
          const notes = activeKeyboardNotes.get(e.code);
          if (notes) {
              stopChordSound(notes);
              setActiveKeyboardNotes(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(e.code);
                  if (newMap.size === 0) {
                    setDisplayText(null);
                  }
                  return newMap;
              });
          }
          setActiveKeyboardPadIndices(prev => {
              const newSet = new Set(prev);
              newSet.delete(padIndex);
              return newSet;
          });
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentChordSet, getNotesForVoicing, activeKeyboardNotes]);

  const addChordToSequencer = (chordName: string, start: number) => {
    const newChord: SequenceChord = { id: generateId(), chordName, start, duration: 8 };
    updatePattern(currentPatternId, { sequence: [...sequence, newChord] });
  };
  const updateSequencerChord = (id: string, newProps: Partial<SequenceChord>) => {
    const newSequence = sequence.map(c => c.id === id ? { ...c, ...newProps } : c);
    updatePattern(currentPatternId, { sequence: newSequence });
  };
  const removeSequencerChord = (id: string) => {
    const newSequence = sequence.filter(c => c.id !== id);
    updatePattern(currentPatternId, { sequence: newSequence });
  };
  const playSequencerChordPreview = (chordName: string) => {
    if (isSequencerClickMuted) return;
    const notes = getChordNoteStrings(chordName, octave);
    playChordOnce(notes, '8n');
    setActiveSequencerManualNotes(notes);
    setTimeout(() => setActiveSequencerManualNotes([]), Tone.Time('8n').toMilliseconds());
  };
  
  const handleChordSelect = (id: string, e: React.MouseEvent) => {
    const isSelected = selectedChordIds.has(id);
    if (e.shiftKey) {
      const newSelection = new Set(selectedChordIds);
      if (isSelected) newSelection.delete(id);
      else newSelection.add(id);
      setSelectedChordIds(newSelection);
    } else if (e.ctrlKey || e.metaKey) {
       const newSelection = new Set(selectedChordIds);
       if (isSelected) newSelection.delete(id);
       else newSelection.add(id);
       setSelectedChordIds(newSelection);
    } else {
      if (!isSelected) {
        setSelectedChordIds(new Set([id]));
      }
    }
  };
  const stopActiveManualNotes = () => {};

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const chords = await generateProgression(prompt, songKey);
      if (chords.length > 0) {
        const newSet: ChordSet = { name: prompt, chords };
        setGeneratedChordSets(prev => [newSet, ...prev]);
        setCategory(prompt);
        setChordSetIndex(0);
      } else {
        setError("AI returned no chords. Please try a different prompt.");
      }
    } catch (e) {
      setError("Failed to generate progression. Please check your prompt or API key.");
      console.error(e);
    }
    setIsGenerating(false);
  };
  
  const togglePlay = useCallback(() => {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  }, []);

  const handleStop = () => {
    setIsPlaying(false);
    Tone.Transport.stop();
    setPlayheadPosition(0);
    setPlayingChordId(null);
    setActiveDrumStep(null);
  };

  const handlePanic = () => {
    handleStop();
    Tone.Transport.cancel();
    sampler.releaseAll();
    DRUM_SOUNDS.forEach(sound => drumPlayers.player(sound).stop());
    setActivePadChordNotes([]);
    setActivePianoNote(null);
    setActiveSequencerManualNotes([]);
    setSequencerActiveNotes([]);
    setActiveEditorPreviewNotes([]);
    setActiveKeyboardNotes(new Map());
  };

  const handleSeek = (beats: number) => {
    Tone.Transport.ticks = beats * Tone.Transport.PPQ;
    if (!isPlaying) {
      setPlayheadPosition(beats);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setChordSetIndex(0);
  };
  
  const handleMetronomeToggle = () => {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    setIsMetronomeOn(v => !v);
  };

  useEffect(() => {
    const animate = () => {
      if (Tone.Transport.state === 'started') {
        const positionInBeats = Tone.Transport.ticks / Tone.Transport.PPQ;
        setPlayheadPosition(positionInBeats);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }

    if (humanizedSequence && humanizedSequence.length > 0) {
        const partEvents = humanizedSequence.map(s => {
            return {
                time: Tone.Time('16n').toSeconds() * s.start,
                duration: Tone.Time('16n').toSeconds() * s.duration,
                chord: s,
            };
        });

        const part = new Tone.Part<{ time: number; duration: number; chord: SequenceChord }>((time, event) => {
            const notes = getChordNoteStrings(event.chord.chordName, octave);
            sampler.triggerAttackRelease(notes, event.duration, time);
            
            Tone.Draw.schedule(() => {
                setPlayingChordId(event.chord.id);
                setSequencerActiveNotes(notes);
            }, time);

            Tone.Draw.schedule(() => {
                setPlayingChordId(null);
                setSequencerActiveNotes([]);
            }, time + event.duration * 0.95);

        }, partEvents).start(0);
        partRef.current = part;
    } else {
        setPlayingChordId(null);
    }

    return () => {
      partRef.current?.dispose();
      partRef.current = null;
    };
  }, [humanizedSequence, octave]);
  
  useEffect(() => {
    if (drumSequenceRef.current) {
      drumSequenceRef.current.dispose();
      drumSequenceRef.current = null;
    }

    if (isDrumsEnabled && drumPattern) {
      const stepsPerBar = timeSignature === '4/4' ? 16 : 12;
      const totalSteps = bars * stepsPerBar;
      
      const sequence = new Tone.Sequence<number>((time, step) => {
        DRUM_SOUNDS.forEach(sound => {
          if (drumPattern[sound]?.[step]) {
            drumPlayers.player(sound).start(time);
          }
        });
        Tone.Draw.schedule(() => {
          setActiveDrumStep(step);
        }, time);
      }, Array.from({ length: totalSteps }, (_, i) => i), '16n').start(0);

      drumSequenceRef.current = sequence;
    } else {
      setActiveDrumStep(null);
    }

    return () => {
      drumSequenceRef.current?.dispose();
      drumSequenceRef.current = null;
    };
  }, [isDrumsEnabled, drumPattern, bars, timeSignature]);

  const handleAddPattern = () => {
    setPatterns(prev => {
      const newName = `Pattern ${prev.length + 1}`;
      const newPattern = createNewPattern(
        newName,
        currentPattern.bars,
        currentPattern.timeSignature,
        currentPattern.drumPattern
      );
      return [...prev, newPattern];
    });
  };

  const handleDeletePattern = (id: string) => {
    setPatterns(prev => {
      const newPatterns = prev.filter(p => p.id !== id);
      if (currentPatternId === id) {
        setCurrentPatternId(newPatterns[0]?.id || '');
      }
      return newPatterns;
    });
  };

  const handleRenamePattern = (id: string, newName: string) => {
    if (newName.trim()) {
      updatePattern(id, { name: newName.trim() });
    }
  };
  
  const handleCopyPattern = (id: string) => {
    const patternToCopy = patterns.find(p => p.id === id);
    if (!patternToCopy) return;

    setPatterns(prev => {
      const newPattern = {
        ...patternToCopy,
        id: generateId(),
        name: `${patternToCopy.name} Copy`
      };
      const originalIndex = prev.findIndex(p => p.id === id);
      const newPatterns = [...prev];
      newPatterns.splice(originalIndex + 1, 0, newPattern);
      return newPatterns;
    });
  };

  const handleReorderPatterns = (draggedId: string, targetId: string) => {
    setPatterns(prev => {
      const draggedIndex = prev.findIndex(p => p.id === draggedId);
      const targetIndex = prev.findIndex(p => p.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newPatterns = [...prev];
      const [draggedItem] = newPatterns.splice(draggedIndex, 1);
      newPatterns.splice(targetIndex, 0, draggedItem);
      return newPatterns;
    });
  };

  const onTimeSignatureChange = (patternId: string, ts: '4/4' | '3/4') => {
    const pattern = patterns.find(p => p.id === patternId);
    if (pattern && pattern.timeSignature !== ts) {
      setTimeSignatureChangeRequest({ patternId, newTimeSignature: ts });
    }
  };

  const handleConfirmTimeSignatureChange = () => {
    if (!timeSignatureChangeRequest) return;
    const { patternId, newTimeSignature } = timeSignatureChangeRequest;
    const oldPattern = patterns.find(p => p.id === patternId);
    if (!oldPattern) return;

    const oldStepsPerBar = oldPattern.timeSignature === '4/4' ? 16 : 12;
    const newStepsPerBar = newTimeSignature === '4/4' ? 16 : 12;
    const newDrumPattern = { ...oldPattern.drumPattern };

    DRUM_SOUNDS.forEach(sound => {
      const oldTrack = oldPattern.drumPattern[sound] || [];
      const newTrack: boolean[] = [];
      for (let bar = 0; bar < oldPattern.bars; bar++) {
        const oldBar = oldTrack.slice(bar * oldStepsPerBar, (bar + 1) * oldStepsPerBar);
        const newBar = [...oldBar, ...Array(newStepsPerBar).fill(false)].slice(0, newStepsPerBar);
        newTrack.push(...newBar);
      }
      newDrumPattern[sound] = newTrack;
    });

    updatePattern(patternId, { timeSignature: newTimeSignature, drumPattern: newDrumPattern });
    setTimeSignatureChangeRequest(null);
  };
  
  const toggleDrumEditor = () => {
    if (isDrumEditorOpen) {
      setIsDrumEditorClosing(true);
      setTimeout(() => {
        setIsDrumEditorOpen(false);
        setIsDrumEditorClosing(false);
      }, 300);
    } else {
      setIsDrumEditorOpen(true);
    }
  };

  const updateDrumPattern = (sound: DrumSound, step: number, value: boolean) => {
    const newDrumPattern = { ...drumPattern };
    const newTrack = [...(newDrumPattern[sound] || [])];
    newTrack[step] = value;
    newDrumPattern[sound] = newTrack;
    updatePattern(currentPatternId, { drumPattern: newDrumPattern as Record<DrumSound, boolean[]> });
  };
  
  const handleApplyDrumPreset = (presetPattern: Record<DrumSound, boolean[]>) => {
    const newPattern = createExpandedDrumPattern(presetPattern, bars, timeSignature);
    updatePattern(currentPatternId, { drumPattern: newPattern });
  };
  
  const playEditorPreview = useCallback((chordName: string) => {
    const notes = getChordNoteStrings(chordName, octave);
    playChordOnce(notes, '4n');
    setActiveEditorPreviewNotes(notes);
  }, [octave]);

  const stopActiveEditorPreviewNotes = () => {
    setActiveEditorPreviewNotes([]);
  };

  const sequenceWithOverlapInfo = useMemo(() => {
    return sequence.map((chord, i) => ({ ...chord, isOverlappingOnTop: false }));
  }, [sequence]);


  if (!isAppReady) {
    return <LoadingScreen isLoaded={isPianoLoaded} onStart={() => {
      setIsAppReady(true);
      requestFullScreen();
    }} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <main className="relative flex-1 flex flex-col min-h-0 min-w-0">
        {!isSidebarOpen && (
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 right-4 z-30 p-2 bg-gray-700/80 rounded-full text-white hover:bg-gray-600 transition-colors hidden lg:block"
                aria-label="Open sidebar"
                title="Open Sidebar"
            >
                <HamburgerIcon className="w-6 h-6" />
            </button>
        )}
        <Header />
        <ArrangementView
          patterns={patterns}
          currentPattern={currentPattern}
          onSelectPattern={setCurrentPatternId}
          onAddPattern={handleAddPattern}
          onDeletePattern={handleDeletePattern}
          onRenamePattern={handleRenamePattern}
          onCopyPattern={handleCopyPattern}
          onReorderPatterns={handleReorderPatterns}
          bpm={bpm}
          onBpmChange={setBpm}
          onToggleBarMode={() => updatePattern(currentPatternId, { bars: bars === 4 ? 8 : 4 })}
          onTimeSignatureChange={onTimeSignatureChange}
          isDrumsEnabled={isDrumsEnabled}
          onToggleDrumsEnabled={() => setIsDrumsEnabled(v => !v)}
          onToggleDrumEditor={toggleDrumEditor}
          isDrumEditorOpen={isDrumEditorOpen}
          isMetronomeOn={isMetronomeOn}
          onMetronomeToggle={handleMetronomeToggle}
          isPianoVisible={isPianoVisible}
          onTogglePiano={() => setIsPianoVisible(v => !v)}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <div 
          className="relative flex-1 min-h-0 overflow-y-auto"
          ref={mainAreaRef}
        >
          <div 
            className="flex flex-col h-full"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedChordIds(new Set());
              }
            }}
          >
              <Sequencer
                sequence={sequenceWithOverlapInfo}
                onAddChord={addChordToSequencer}
                onUpdateChord={updateSequencerChord}
                onRemoveChord={removeSequencerChord}
                onChordDoubleClick={chord => setEditingChord(chord)}
                onPlayChord={playSequencerChordPreview}
                onChordSelect={handleChordSelect}
                onDeselect={() => setSelectedChordIds(new Set())}
                onChordMouseUp={stopActiveManualNotes}
                playheadPosition={playheadPosition}
                playingChordId={playingChordId}
                selectedChordIds={selectedChordIds}
                bars={bars}
                timeSignature={timeSignature}
                onSeek={handleSeek}
                isClickMuted={isSequencerClickMuted}
                onMuteToggle={() => setIsSequencerClickMuted(v => !v)}
              />

            <div className={`relative transition-all duration-300 ease-in-out ${isPianoVisible ? 'h-52 mt-0' : 'h-12 mt-[10px]'}`}>
                {/* Piano container, always h-40 */}
                <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden">
                    <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${isPianoVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                        <Piano 
                          highlightedNotes={activePianoNotes}
                          pressedNotes={activePianoNotes}
                          onKeyMouseDown={handlePianoMouseDown}
                          onKeyMouseEnter={handlePianoMouseEnter}
                          onKeyMouseLeave={stopActivePianoNote}
                          onPianoMouseLeave={stopActivePianoNote}
                        />
                    </div>
                </div>
                {/* Hover Display container */}
                <div className="absolute bottom-0 left-0 right-0 h-12">
                    <HoverDisplay data={displayText} />
                </div>
            </div>

            {error && <div className="text-red-500 text-center pointer-events-auto">{error}</div>}
          </div>
        </div>
        
        <div className={`transition-all duration-300 ease-in-out ${isDrumEditorOpen && !isDrumEditorClosing ? 'max-h-80' : 'max-h-0'} overflow-hidden`}>
            {isDrumEditorOpen && drumPattern && (
              <DrumEditor 
                pattern={drumPattern}
                onPatternChange={updateDrumPattern}
                volume={drumVol}
                onVolumeChange={setDrumVol}
                activeStep={activeDrumStep}
                bars={bars}
                timeSignature={timeSignature}
                onClose={toggleDrumEditor}
                presets={PRESET_DRUM_PATTERNS}
                onApplyPreset={handleApplyDrumPreset}
              />
            )}
        </div>

        <TransportControls 
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
          onStop={handleStop}
          onPanic={handlePanic}
          playheadPosition={playheadPosition}
          bars={bars}
          timeSignature={timeSignature}
          masterVolume={masterVolume}
          onMasterVolumeChange={setMasterVolume}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(v => !v)}
        />
      </main>
      <SidePanel
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chords={currentChordSet}
        songKey={songKey}
        setSongKey={setSongKey}
        category={category}
        setCategory={handleCategoryChange}
        chordSetIndex={chordSetIndex}
        setChordSetIndex={setChordSetIndex}
        categories={categories}
        chordSets={chordSets}
        keys={KEY_OPTIONS}
        onPadMouseDown={handlePadMouseDown}
        onPadMouseUp={stopActivePadNotes}
        onPadMouseEnter={handlePadMouseEnter}
        onPadMouseLeave={clearHoveredNotes}
        isPianoLoaded={isPianoLoaded}
        octave={octave}
        setOctave={setOctave}
        inversionLevel={inversionLevel}
        setInversionLevel={setInversionLevel}
        voicingMode={voicingMode}
        setVoicingMode={setVoicingMode}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        keyLabels={KEY_LABELS}
        isSequencerVoicingOn={isSequencerVoicingOn}
        setIsSequencerVoicingOn={setIsSequencerVoicingOn}
        activeKeyboardPadIndices={activeKeyboardPadIndices}
      />
      
      {editingChord && (
        <ChordEditor 
          chord={editingChord} 
          onClose={() => {
            setEditingChord(null);
            stopActiveEditorPreviewNotes();
          }}
          onApply={(newChordName) => {
            updateSequencerChord(editingChord.id, { chordName: newChordName });
            setEditingChord(null);
            stopActiveEditorPreviewNotes();
          }}
          onPreview={playEditorPreview}
          updateChordUtil={updateChord}
        />
      )}
      
      {timeSignatureChangeRequest && (
        <ConfirmationDialog
          title="Change Time Signature"
          message={<>Changing the time signature will adjust the drum pattern and may alter its feel.<br/>This action cannot be undone. Do you want to continue?</>}
          onConfirm={handleConfirmTimeSignatureChange}
          onCancel={() => setTimeSignatureChangeRequest(null)}
          confirmText="Change"
        />
      )}
    </div>
  );
};

export default App;