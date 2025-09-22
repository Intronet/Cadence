import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Header } from './components/Header';
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
  bassSampler,
  drumPlayers,
  drumVolume,
  humanizeProgression,
  parseNote,
  KEY_SIGNATURES,
  NOTE_TO_INDEX,
  transposeChord,
  findLowestNote,
  generateDiatonicChords,
  hasSeventh
} from './index';
import { ROOT_NOTE_OPTIONS, SCALE_MODE_OPTIONS, ChordSet, SequenceChord, Pattern, DrumSound, DrumPatternPreset, SequenceBassNote, Articulation, ArpeggioRate } from './types';
import { Piano, PianoHandle } from './components/Piano';
import { HoverDisplay } from './components/HoverDisplay';
import { Sequencer } from './components/Sequencer';
import * as Tone from 'tone';
import { ChordEditor } from './components/ChordEditor';
import { DrumEditor } from './components/DrumMachine';
import { PRESET_DRUM_PATTERNS, DRUM_SOUNDS, EMPTY_DRUM_PATTERNS } from './components/drums/drumPatterns';
import { ArrangementView } from './components/PatternControls';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { Toolkit } from './components/Toolkit';


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
      setIndex(i => i - 1);
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
const LoadingScreen: React.FC<{ isLoaded: boolean; onStart: () => void; isFadingOut: boolean }> = ({ isLoaded, onStart, isFadingOut }) => {
  const [progress, setProgress] = useState(0);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading audio samples...');

  useEffect(() => {
    if (isLoaded) {
      setProgress(100); 

      const animationDuration = 2500;
      
      const textTimer = setTimeout(() => {
        setLoadingText('Loaded audio samples');
      }, animationDuration);

      const buttonTimer = setTimeout(() => {
        setIsButtonEnabled(true);
      }, animationDuration);

      return () => {
        clearTimeout(textTimer);
        clearTimeout(buttonTimer);
      };
    }
  }, [isLoaded]);

  return (
    <div className={`fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center text-white overflow-hidden transition-opacity duration-[1500ms] ease-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
          className="mt-4 px-6 py-3 bg-indigo-600 rounded-[4px] text-lg font-semibold transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 hover:enabled:bg-indigo-700 hover:enabled:scale-105"
        >
          Click to Start
        </button>
        <p className="text-gray-400 mt-4">{loadingText}</p>
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
  bassSequence: [],
  drumPattern: initialDrumPatterns ?? createExpandedDrumPattern(EMPTY_DRUM_PATTERNS[timeSignature], bars, timeSignature),
});


const App: React.FC = () => {
  const [isLoaderVisible, setIsLoaderVisible] = useState(true);
  const [isLoaderFadingOut, setIsLoaderFadingOut] = useState(false);
  const [isPianoLoaded, setIsPianoLoaded] = useState(false);
  
  const [songRootNote, setSongRootNote] = useState<string>('C');
  const [songMode, setSongMode] = useState<string>('Major');
  const [category, setCategory] = useState<string>('Diatonic Chords');
  const [chordSetIndex, setChordSetIndex] = useState(0);
  const [octave, setOctave] = useState(0);
  const [inversionLevel, setInversionLevel] = useState(0); 
  const [voicingMode, setVoicingMode] = useState<'off' | 'manual' | 'auto'>('manual');
  const [activePadChordNotes, setActivePadChordNotes] = useState<string[]>([]);
  const [activePianoNote, setActivePianoNote] = useState<string | null>(null);
  const [hoveredNotes, setHoveredNotes] = useState<string[]>([]);
  const [manualDisplayText, setManualDisplayText] = useState<{ name: string; notes: string } | null>(null);
  const [sequencerDisplayText, setSequencerDisplayText] = useState<{ name: string; notes: string } | null>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const pianoRef = useRef<PianoHandle>(null);
  
  const [isPianoVisible, setIsPianoVisible] = useState(false);

  const [masterVolume, setMasterVolume] = useState(0); // in dB
  const [isMuted, setIsMuted] = useState(false);
  
  const [humanizeTiming, setHumanizeTiming] = useState(0); // 0-1
  const [humanizeDynamics, setHumanizeDynamics] = useState(0); // 0-1

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
  const [isSequencerClickMuted, setIsSequencerClickMuted] = useState(false);
  const [selectedChordIds, setSelectedChordIds] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<Array<Omit<SequenceChord, 'id'>>>([]);
  const chordPartRef = useRef<Tone.Part | null>(null);
  const bassPartRef = useRef<Tone.Part | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const prevSongRootRef = useRef<string>(songRootNote);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [aiGeneratedChordSets, setAiGeneratedChordSets] = useState<ChordSet[]>([]);

  const currentPattern = useMemo(() => patterns.find(p => p.id === currentPatternId) ?? patterns[0], [patterns, currentPatternId]);
  const sequence = useMemo(() => currentPattern?.sequence || [], [currentPattern]);
  const bassSequence = useMemo(() => currentPattern?.bassSequence || [], [currentPattern]);
  const bars = useMemo(() => currentPattern?.bars ?? 4, [currentPattern]);
  const timeSignature = useMemo(() => currentPattern?.timeSignature ?? '4/4', [currentPattern]);
  const timeSignatureValue = useMemo(() => timeSignature === '4/4' ? 4 : 3, [timeSignature]);
  
  const [sequencerWidth, setSequencerWidth] = useState(0);
  const [sequencerActiveBassNotes, setSequencerActiveBassNotes] = useState<string[]>([]);
  const [playingBassNoteId, setPlayingBassNoteId] = useState<string | null>(null);


  const [activeKeyboardNotes, setActiveKeyboardNotes] = useState<Map<string, string[]>>(new Map());
  const [activeKeyboardPadIndices, setActiveKeyboardPadIndices] = useState<Set<number>>(new Set());
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const handleStart = () => {
    // Delay the start of the fade-out by 0.5 seconds
    setTimeout(() => {
      setIsLoaderFadingOut(true);
      // Set a timer to remove the loader from the DOM after the fade-out animation completes
      setTimeout(() => {
        setIsLoaderVisible(false);
      }, 1500); // This is the duration of the fade-out animation
    }, 500); // This is the delay before the fade-out starts
  };

  const updatePattern = useCallback((id: string, updates: Partial<Pattern>) => {
    setPatterns(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  }, [setPatterns]);

  const handleTogglePiano = () => {
    setIsPianoVisible(v => !v);
  };


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

  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const metronomeRef = useRef<{ synth: Tone.Synth, loop: Tone.Loop | null } | null>(null);

  const [editingChord, setEditingChord] = useState<SequenceChord | null>(null);
  const [activeEditorPreviewNotes, setActiveEditorPreviewNotes] = useState<string[]>([]);

  const [isDrumsEnabled, setIsDrumsEnabled] = useState(false);
  const [isBasslineEnabled, setIsBasslineEnabled] = useState(true);
  const [drumVol, setDrumVol] = useState(-6);
  const [activeDrumStep, setActiveDrumStep] = useState<number | null>(null);
  const [isDrumEditorOpen, setIsDrumEditorOpen] = useState(false);
  const [isDrumEditorClosing, setIsDrumEditorClosing] = useState(false);
  const drumSequenceRef = useRef<Tone.Sequence<number> | null>(null);
  const drumPattern = useMemo(() => currentPattern?.drumPattern, [currentPattern]);
  
  const [isChordMachineOpen, setIsChordMachineOpen] = useState(true);
  const [isChordMachineClosing, setIsChordMachineClosing] = useState(false);
  const [chordMachineHeight, setChordMachineHeight] = useState(290);
  const [isResizingChordMachine, setIsResizingChordMachine] = useState(false);
  const [drumEditorHeight, setDrumEditorHeight] = useState(290);
  const [isResizingDrums, setIsResizingDrums] = useState(false);

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


  const categories = useMemo(() => {
    const baseCategories = ['Diatonic Chords', ...Object.keys(staticChordData)];
    if (aiGeneratedChordSets.length > 0) {
      return ['AI Generated', ...baseCategories];
    }
    return baseCategories;
  }, [aiGeneratedChordSets]);

  const chordSets = useMemo(() => {
    if (category === 'Diatonic Chords') {
      return [{ name: `${songRootNote} ${songMode}`, chords: [] }];
    }
    if (category === 'AI Generated') {
      return aiGeneratedChordSets;
    }
    return staticChordData[category] || [];
  }, [category, songRootNote, songMode, aiGeneratedChordSets]);
  
  const displayedChords = useMemo(() => {
    if (category === 'Diatonic Chords') {
      return generateDiatonicChords(songRootNote, songMode);
    }
    const originalChords = (chordSets[chordSetIndex]?.chords || []).slice(0, 16);

    if (songRootNote === 'C' && category !== 'AI Generated') {
        return originalChords;
    }

    // AI progressions are generated for the current key, so no transposition needed
    if (category === 'AI Generated') {
        return originalChords;
    }

    const sourceKeyIndex = NOTE_TO_INDEX['C'];
    const targetKeyIndex = parseNote(songRootNote);

    if (isNaN(sourceKeyIndex) || isNaN(targetKeyIndex)) {
        return originalChords;
    }

    const interval = targetKeyIndex - sourceKeyIndex;
    const useSharps = KEY_SIGNATURES[songRootNote] !== 'flats';

    return originalChords.map(chord => transposeChord(chord, interval, useSharps));
  }, [category, songRootNote, songMode, chordSets, chordSetIndex]);

  useEffect(() => {
    initAudio().then(() => setIsPianoLoaded(true));
  }, []);

  const scrollToLowestNote = useCallback((notes: string[]) => {
    if (notes.length === 0 || !pianoRef.current) return;
    const lowestNote = findLowestNote(notes);
    if (lowestNote) {
      pianoRef.current.scrollToNote(lowestNote);
    }
  }, []);

  const getNotesForVoicing = useCallback((chordName: string) => {
    if (voicingMode === 'manual') {
      const actualInversion = Math.abs(inversionLevel);
      const isThirdInvPossible = hasSeventh(chordName);
      const cappedInversion = !isThirdInvPossible && actualInversion >= 3 ? 2 : actualInversion;

      const octaveAdjustment = inversionLevel < 0 ? -1 : 0;
      return getChordNoteStrings(updateChord(chordName, { inversion: cappedInversion }), octave + octaveAdjustment);
    }
    return getChordNoteStrings(chordName, octave);
  }, [voicingMode, inversionLevel, octave]);

  const humanizedSequence = useMemo(() => {
    // Auto-voicing for sequencer has been disabled per user request.
    return sequence;
  }, [sequence]);
  
  const generatedBassline = useMemo(() => {
    if (!isBasslineEnabled) return [];

    return sequence.map(chord => {
        const parsed = parseChord(chord.chordName);
        const rootNote = parsed ? (parsed.bass || parsed.root) : null;
        if (!rootNote) return null;

        const bassOctave = 2; // Keep it simple
        const bassNoteName = `${rootNote}${bassOctave}`;

        return {
            id: generateId(),
            noteName: bassNoteName,
            start: chord.start,
            duration: chord.duration,
        };
    }).filter((n): n is SequenceBassNote => n !== null);
  }, [sequence, isBasslineEnabled]);

  useEffect(() => {
      const hasChanged = 
          bassSequence.length !== generatedBassline.length || 
          bassSequence.some((note, i) => 
              note.noteName !== generatedBassline[i].noteName ||
              note.start !== generatedBassline[i].start ||
              note.duration !== generatedBassline[i].duration
          );

      if (hasChanged) {
          updatePattern(currentPatternId, { bassSequence: generatedBassline });
      }
  }, [generatedBassline, bassSequence, currentPatternId, updatePattern]);


  const stopActivePadNotes = useCallback(() => {
    if (activePadChordNotes.length > 0) {
      stopChordSound(activePadChordNotes);
      setActivePadChordNotes([]);
      setManualDisplayText(null);
    }
  }, [activePadChordNotes]);

  const handlePadMouseDown = (chordName: string) => {
    const notes = getNotesForVoicing(chordName);
    scrollToLowestNote(notes);
    startChordSound(notes);
    setActivePadChordNotes(notes);
    const parsed = parseChord(chordName);
    const cleanName = parsed ? `${parsed.root}${parsed.quality}` : chordName;
    setManualDisplayText({ name: cleanName, notes: getChordNoteStrings(chordName, 0).map(n => n.replace(/[0-9]/g, '')).join(' ') });
  };

  const handlePadMouseEnter = (chordName: string) => {
    const notes = getNotesForVoicing(chordName);
    scrollToLowestNote(notes);
    const parsed = parseChord(chordName);
    const cleanName = parsed ? `${parsed.root}${parsed.quality}` : chordName;
    setManualDisplayText({ name: cleanName, notes: getChordNoteStrings(chordName, 0).map(n => n.replace(/[0-9]/g, '')).join(' ') });
    setHoveredNotes(notes);
  };
  const clearHoveredNotes = () => {
    setManualDisplayText(null);
    setHoveredNotes([]);
  };

  const stopActivePianoNote = useCallback(() => {
    if (activePianoNote) {
      stopNoteSound(activePianoNote);
      setActivePianoNote(null);
      setManualDisplayText(null);
    }
  }, [activePianoNote]);

  const handlePianoMouseDown = (note: string) => {
    startNoteSound(note);
    setActivePianoNote(note);
    setManualDisplayText({ name: note.replace(/[0-9]/g, ''), notes: '' });
  };

  const handlePianoMouseEnter = (note: string) => {
    if (activePianoNote) { // Glissando
      scrollToLowestNote([note]);
      stopNoteSound(activePianoNote);
      startNoteSound(note);
      setActivePianoNote(note);
      setManualDisplayText({ name: note.replace(/[0-9]/g, ''), notes: '' });
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
    ...sequencerActiveBassNotes,
    ...activeSequencerManualNotes,
    ...activeEditorPreviewNotes,
    ...Array.from(activeKeyboardNotes.values()).flat()
  ]), [hoveredNotes, activePadChordNotes, activePianoNote, sequencerActiveNotes, sequencerActiveBassNotes, activeSequencerManualNotes, activeEditorPreviewNotes, activeKeyboardNotes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (pressedKeysRef.current.has(e.code) || (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;
        pressedKeysRef.current.add(e.code);

        const padIndex = CODE_TO_PAD_INDEX[e.code];
        if (padIndex !== undefined && padIndex < displayedChords.length) {
            e.preventDefault();
            const chordName = displayedChords[padIndex];
            const notes = getNotesForVoicing(chordName);
            scrollToLowestNote(notes);
            startChordSound(notes);
            setActiveKeyboardNotes(prev => new Map(prev).set(e.code, notes));
            setActiveKeyboardPadIndices(prev => new Set(prev).add(padIndex));
            const parsed = parseChord(chordName);
            const cleanName = parsed ? `${parsed.root}${parsed.quality}` : chordName;
            setManualDisplayText({ name: cleanName, notes: getChordNoteStrings(chordName, 0).map(n => n.replace(/[0-9]/g, '')).join(' ') });
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
                    setManualDisplayText(null);
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
  }, [displayedChords, getNotesForVoicing, scrollToLowestNote]);

  const addChordToSequencer = (chordName: string, start: number, octaveOverride?: number) => {
    const newChord: SequenceChord = { 
      id: generateId(), 
      chordName, 
      start, 
      duration: 4, 
      octave: octaveOverride !== undefined ? octaveOverride : octave
    };
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
  const playSequencerChordPreview = (chord: SequenceChord) => {
    if (isSequencerClickMuted) return;
    const notes = getChordNoteStrings(chord.chordName, chord.octave);
    scrollToLowestNote(notes);
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
    setPlayingBassNoteId(null);
    setActiveDrumStep(null);
  };

  const handlePanic = () => {
    handleStop();
    Tone.Transport.cancel();
    sampler.releaseAll();
    bassSampler.releaseAll();
    DRUM_SOUNDS.forEach(sound => drumPlayers.player(sound).stop());
    setActivePadChordNotes([]);
    setActivePianoNote(null);
    setActiveSequencerManualNotes([]);
    setSequencerActiveNotes([]);
    setSequencerActiveBassNotes([]);
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

  const handleSequencerInteraction = useCallback(() => {
    if (isPlaying) {
      togglePlay();
    }
  }, [isPlaying, togglePlay]);

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const systemInstruction = `You are a music theory expert. Your task is to generate one or more chord progressions based on the user's prompt. The user is currently working in the key of ${songRootNote} ${songMode}. Consider this context when generating progressions. Return the response as a JSON array of objects. Each object should represent a chord progression and have a 'name' (string) and a 'chords' (array of 8 to 16 strings). The chord names must be parsable by a music notation library (e.g., "Cmaj7", "G7", "Amin", "F#min7(b5)"). Be creative and generate musically interesting and coherent progressions. The name should be descriptive of the progression. Generate between 1 and 3 progressions.`;

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: {
                        type: Type.STRING,
                        description: "A descriptive name for the chord progression.",
                    },
                    chords: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                            description: "A chord in the progression, e.g., 'Cmaj7' or 'G7/B'."
                        },
                        description: "An array of 8 to 16 chord names.",
                    },
                },
                required: ["name", "chords"],
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a chord progression based on this prompt: "${prompt}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const generatedProgressions = JSON.parse(jsonStr);
        
        if (Array.isArray(generatedProgressions) && generatedProgressions.length > 0) {
            setAiGeneratedChordSets(generatedProgressions);
            setCategory('AI Generated');
            setChordSetIndex(0);
        } else {
            console.error('Invalid format from AI:', generatedProgressions);
            setGenerationError('Received an invalid format from the AI.');
        }

    } catch (error) {
        console.error("Error generating chords:", error);
        setGenerationError('Failed to generate chords. Please try again.');
    } finally {
        setIsGenerating(false);
    }
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
    if (chordPartRef.current) {
      chordPartRef.current.dispose();
      chordPartRef.current = null;
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
            const notes = getChordNoteStrings(event.chord.chordName, event.chord.octave);
            if (!notes || notes.length === 0) return;

            Tone.Draw.schedule(() => {
              scrollToLowestNote(notes);
              setPlayingChordId(event.chord.id);
            }, time);

            if (event.chord.articulation?.type === 'arpeggio') {
                const rate = event.chord.articulation.rate;
                const direction = event.chord.articulation.direction;
                const gate = event.chord.articulation.gate;
                const singleNoteDuration = Tone.Time(rate).toSeconds();
                const noteCount = Math.floor(event.duration / singleNoteDuration);

                let sequenceNotes: string[] = [];
                switch (direction) {
                    case 'down':
                        sequenceNotes = [...notes].reverse();
                        break;
                    case 'upDown':
                        sequenceNotes = [...notes, ...[...notes].reverse().slice(1, -1)];
                        break;
                    case 'random':
                        // Generate the random sequence once for this chord event
                        const randomNotes = [];
                        for (let i = 0; i < noteCount; i++) {
                            randomNotes.push(notes[Math.floor(Math.random() * notes.length)]);
                        }
                        sequenceNotes = randomNotes;
                        break;
                    case 'up':
                    default:
                        sequenceNotes = notes;
                        break;
                }
                
                for (let i = 0; i < noteCount; i++) {
                    const note = direction === 'random' ? sequenceNotes[i] : sequenceNotes[i % sequenceNotes.length];
                    const attackTime = time + i * singleNoteDuration;
                    
                    if (attackTime < time + event.duration) {
                        const timeJitter = (Math.random() - 0.5) * humanizeTiming * 0.02;
                        const velocity = 0.8 + (Math.random() - 0.5) * humanizeDynamics * 0.4;
                        sampler.triggerAttackRelease(note, singleNoteDuration * gate, attackTime + timeJitter, velocity);
                        Tone.Draw.schedule(() => {
                            setSequencerActiveNotes([note]);
                        }, attackTime);
                    }
                }
            } else if (event.chord.articulation?.type === 'strum') {
                const strumDelay = 0.04;
                 Tone.Draw.schedule(() => {
                    setSequencerActiveNotes([]);
                }, time);
                notes.forEach((note, index) => {
                    const attackTime = time + (index * strumDelay);
                    if (attackTime < time + event.duration) {
                        const releaseDuration = event.duration - (index * strumDelay);
                        const velocity = 0.8 + (Math.random() - 0.5) * humanizeDynamics * 0.4;
                        if (releaseDuration > 0) {
                            sampler.triggerAttackRelease(note, releaseDuration, attackTime, velocity);
                        }
                        Tone.Draw.schedule(() => {
                            setSequencerActiveNotes(prev => [...prev, note]);
                        }, attackTime);
                    }
                });
            } else { // Block chord
                 Tone.Draw.schedule(() => {
                    setSequencerActiveNotes([]);
                }, time);
                notes.forEach(note => {
                    const timeOffset = (Math.random() - 0.5) * humanizeTiming * 0.05; // Max +/- 25ms
                    const velocity = 0.8 + (Math.random() - 0.5) * humanizeDynamics * 0.4; // Range 0.6 to 1.0
                    sampler.triggerAttackRelease(note, event.duration, time + timeOffset, velocity);
                     Tone.Draw.schedule(() => {
                        setSequencerActiveNotes(prev => [...prev, note]);
                    }, time + timeOffset);
                });
            }
            
            Tone.Draw.schedule(() => {
                setPlayingChordId(null);
                setSequencerActiveNotes([]);
            }, time + event.duration * 0.95);

        }, partEvents).start(0);
        chordPartRef.current = part;
    } else {
        setPlayingChordId(null);
    }

    return () => {
      chordPartRef.current?.dispose();
      chordPartRef.current = null;
    };
  }, [humanizedSequence, scrollToLowestNote, humanizeTiming, humanizeDynamics]);
  
  useEffect(() => {
    if (bassPartRef.current) {
      bassPartRef.current.dispose();
      bassPartRef.current = null;
    }
  
    if (bassSequence && bassSequence.length > 0) {
      const partEvents = bassSequence.map(note => ({
        time: Tone.Time('16n').toSeconds() * note.start,
        duration: Tone.Time('16n').toSeconds() * note.duration,
        noteName: note.noteName,
        id: note.id,
      }));
  
      const part = new Tone.Part<{ time: number; duration: number; noteName: string; id: string }>((time, event) => {
        const timeOffset = (Math.random() - 0.5) * humanizeTiming * 0.05;
        const velocity = 0.9 + (Math.random() - 0.5) * humanizeDynamics * 0.2; // Bass has less dynamic range
        bassSampler.triggerAttackRelease(event.noteName, event.duration, time + timeOffset, velocity);
        
        Tone.Draw.schedule(() => {
          setPlayingBassNoteId(event.id);
          setSequencerActiveBassNotes([event.noteName]);
        }, time);
  
        Tone.Draw.schedule(() => {
          setPlayingBassNoteId(null);
          setSequencerActiveBassNotes([]);
        }, time + event.duration * 0.95);
  
      }, partEvents).start(0);
      bassPartRef.current = part;
    } else {
      setPlayingBassNoteId(null);
    }
  
    return () => {
      bassPartRef.current?.dispose();
      bassPartRef.current = null;
    };
  }, [bassSequence, humanizeTiming, humanizeDynamics]);
  

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

    updatePattern(patternId, { timeSignature: newTimeSignature, drumPattern: newDrumPattern, bassSequence: [] });
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
  
  const toggleChordMachine = () => {
    if (isChordMachineOpen) {
      setIsChordMachineClosing(true);
      setTimeout(() => {
        setIsChordMachineOpen(false);
        setIsChordMachineClosing(false);
      }, 300);
    } else {
      setIsChordMachineOpen(true);
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
  
  const playEditorPreview = useCallback((chordName: string, baseOctave: number) => {
    const notes = getChordNoteStrings(chordName, baseOctave);
    scrollToLowestNote(notes);
    playChordOnce(notes, '4n');
    setActiveEditorPreviewNotes(notes);
  }, [scrollToLowestNote]);

  const stopActiveEditorPreviewNotes = () => {
    setActiveEditorPreviewNotes([]);
  };

  // Sequencer display logic
  useEffect(() => {
    if (isPlaying && playingChordId) {
      const activeChord = humanizedSequence.find(c => c.id === playingChordId);
      if (activeChord) {
        const parsed = parseChord(activeChord.chordName);
        const cleanName = parsed ? `${parsed.root}${parsed.quality}`.replace(INVERSION_REGEX, '').trim() : activeChord.chordName;
        const notesString = getChordNoteStrings(activeChord.chordName, 0).map(n => n.replace(/[0-9]/g, '')).join(' ');
        setSequencerDisplayText({ name: cleanName, notes: notesString });
      }
    } else {
      setSequencerDisplayText(null); // Clear when playback stops or between chords
    }
  }, [isPlaying, playingChordId, humanizedSequence]);

  const displayText = useMemo(() => {
    return sequencerDisplayText ?? manualDisplayText;
  }, [sequencerDisplayText, manualDisplayText]);

  const stepsPerLane = (timeSignature === '4/4' ? 16 : 12) * 4;
  const TRACK_PADDING = 10;
  const gridWidth = sequencerWidth > 0 ? sequencerWidth - (TRACK_PADDING * 2) : 0;
  const stepWidth = gridWidth > 0 ? gridWidth / stepsPerLane : 0;
  const quarterNoteWidth = stepWidth * 4;

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {isLoaderVisible && <LoadingScreen isLoaded={isPianoLoaded} onStart={handleStart} isFadingOut={isLoaderFadingOut} />}

      <main className="relative flex-1 flex flex-col min-h-0 min-w-0">
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
          isBasslineEnabled={isBasslineEnabled}
          onToggleBasslineEnabled={() => setIsBasslineEnabled(v => !v)}
          onToggleDrumEditor={toggleDrumEditor}
          isDrumEditorOpen={isDrumEditorOpen}
          isMetronomeOn={isMetronomeOn}
          onMetronomeToggle={handleMetronomeToggle}
          isPianoVisible={isPianoVisible}
          onTogglePiano={handleTogglePiano}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
          onStop={handleStop}
          onPanic={handlePanic}
          playheadPosition={playheadPosition}
          masterVolume={masterVolume}
          onMasterVolumeChange={setMasterVolume}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(v => !v)}
          isChordMachineOpen={isChordMachineOpen}
          onToggleChordMachine={toggleChordMachine}
          humanizeTiming={humanizeTiming}
          onHumanizeTimingChange={setHumanizeTiming}
          humanizeDynamics={humanizeDynamics}
          onHumanizeDynamicsChange={setHumanizeDynamics}
        />
        <Sequencer
          sequence={sequence}
          bassSequence={bassSequence}
          onAddChord={addChordToSequencer}
          onUpdateChord={updateSequencerChord}
          onRemoveChord={removeSequencerChord}
          onChordDoubleClick={chord => setEditingChord(chord)}
          onPlayChord={playSequencerChordPreview}
          onChordSelect={handleChordSelect}
          onDeselect={() => setSelectedChordIds(new Set())}
          onChordMouseUp={stopActiveManualNotes}
          onInteraction={handleSequencerInteraction}
          playheadPosition={playheadPosition}
          playingChordId={playingChordId}
          playingBassNoteId={playingBassNoteId}
          selectedChordIds={selectedChordIds}
          bars={bars}
          timeSignature={timeSignature}
          onSeek={handleSeek}
          isClickMuted={isSequencerClickMuted}
          onMuteToggle={() => setIsSequencerClickMuted(v => !v)}
          onWidthChange={setSequencerWidth}
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
              <div className={`relative transition-all duration-300 ease-in-out ${isPianoVisible ? 'h-52 mt-0' : 'h-12 mt-[10px]'}`}>
                  {/* Piano container, always h-40 */}
                  <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden">
                      <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${isPianoVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                          <Piano 
                            ref={pianoRef}
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

              {/* This spacer fills the REMAINING empty area, preventing clicks on the background from deselecting chords. */}
              <div className="flex-1" />

          </div>
        </div>
        
        <div 
          className={`transition-height duration-300 ease-in-out overflow-hidden ${isResizingChordMachine ? '!duration-0' : ''}`}
          style={{ height: isChordMachineOpen && !isChordMachineClosing ? `${chordMachineHeight}px` : '0px' }}
        >
            {isChordMachineOpen && (
              <Toolkit 
                onClose={toggleChordMachine}
                keyLabels={KEY_LABELS}
                isPianoLoaded={isPianoLoaded}
                height={chordMachineHeight}
                setHeight={setChordMachineHeight}
                setIsResizing={setIsResizingChordMachine}
                quarterNoteWidth={quarterNoteWidth}
                chords={displayedChords}
                songRootNote={songRootNote}
                setSongRootNote={setSongRootNote}
                songMode={songMode}
                setSongMode={setSongMode}
                category={category}
                setCategory={handleCategoryChange}
                chordSetIndex={chordSetIndex}
                setChordSetIndex={setChordSetIndex}
                categories={categories}
                chordSets={chordSets}
                onPadMouseDown={handlePadMouseDown}
                onPadMouseUp={stopActivePadNotes}
                onPadMouseEnter={handlePadMouseEnter}
                onPadMouseLeave={clearHoveredNotes}
                octave={octave}
                setOctave={setOctave}
                inversionLevel={inversionLevel}
                setInversionLevel={setInversionLevel}
                voicingMode={voicingMode}
                setVoicingMode={setVoicingMode}
                activeKeyboardPadIndices={activeKeyboardPadIndices}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                generationError={generationError}
              />
            )}
        </div>
        
        <div 
          className={`transition-height duration-300 ease-in-out overflow-hidden ${isResizingDrums ? '!duration-0' : ''}`}
          style={{ height: isDrumEditorOpen && !isDrumEditorClosing ? `${drumEditorHeight}px` : '0px' }}
        >
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
                height={drumEditorHeight}
                setHeight={setDrumEditorHeight}
                setIsResizing={setIsResizingDrums}
              />
            )}
        </div>

        <div className="h-[30px] bg-gray-800 flex-shrink-0 border-t border-gray-700 flex items-center justify-center text-sm text-gray-400">
          {(isResizingChordMachine || isResizingDrums) && 
            <span>
              {isResizingChordMachine ? `Chord Machine Height: ${Math.round(chordMachineHeight)}px` : `Drum Editor Height: ${Math.round(drumEditorHeight)}px`}
            </span>
          }
        </div>
      </main>
      
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