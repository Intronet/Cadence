
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
  bassSynth,
  drumPlayers,
  drumVolume,
  humanizeProgression,
  parseNote,
  KEY_SIGNATURES,
  NOTE_TO_INDEX,
  transposeChord,
  findLowestNote
} from './index';
import { KEY_OPTIONS, ChordSet, SequenceChord, Pattern, DrumSound, DrumPatternPreset, SequenceBassNote } from './types';
import { Piano, PianoHandle } from './components/Piano';
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
const LoadingScreen: React.FC<{ isLoaded: boolean; onStart: () => void; }> = ({ isLoaded, onStart }) => {
  const [progress, setProgress] = useState(0);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setProgress(100);
      setIsButtonEnabled(true);
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
          {isLoaded ? (
            <div 
              className="h-full bg-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          ) : (
            <div className="relative w-full h-full">
              <div 
                className="absolute top-0 h-full bg-indigo-500 rounded-full animate-indeterminate-loader"
                style={{ width: '33.33%' }}
              ></div>
            </div>
          )}
        </div>
        
        <button 
          onClick={onStart} 
          disabled={!isButtonEnabled}
          className="mt-4 px-6 py-3 bg-indigo-600 rounded-[3px] text-lg font-semibold transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 hover:enabled:bg-indigo-700 hover:enabled:scale-105"
        >
          Click to Start
        </button>
        <p className="text-gray-400 mt-4 h-6 flex items-center justify-center">
          {isLoaded ? <span className="text-green-400">Audio ready....</span> : 'Loading audio samples...'}
        </p>
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
  const [manualDisplayText, setManualDisplayText] = useState<{ name: string; notes: string } | null>(null);
  const [sequencerDisplayText, setSequencerDisplayText] = useState<{ name: string; notes: string } | null>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const pianoRef = useRef<PianoHandle>(null);
  
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
  const [clipboard, setClipboard] = useState<Array<SequenceChord>>([]);
  const [activeChordEditor, setActiveChordEditor] = useState<SequenceChord | null>(null);

  const [isDrumsEnabled, setIsDrumsEnabled] = useState(true);
  const [isDrumEditorOpen, setIsDrumEditorOpen] = useState(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [activeDrumStep, setActiveDrumStep] = useState<number | null>(null);
  const [activeKeyboardPadIndices, setActiveKeyboardPadIndices] = useState<Set<number>>(new Set());
  const [dialog, setDialog] = useState<{ type: 'deletePattern' | 'timeSignature' | 'barMode', data?: any } | null>(null);
  const [basslineStyle, setBasslineStyle] = useState<'root'>('root');


  useEffect(() => {
    const loadAudio = async () => {
      try {
        await initAudio();
        setIsPianoLoaded(true);
      } catch (err) {
        console.error("Failed to initialize audio:", err);
        setError("Could not load audio samples. Please refresh the page.");
      }
    };
    loadAudio();
  }, []);
  
  const handleStart = () => {
      requestFullScreen();
      Tone.start();
      setIsAppReady(true);
  };

  const currentPattern = useMemo(() => patterns.find(p => p.id === currentPatternId), [patterns, currentPatternId]);

  const chordSets = useMemo(() => {
    const allSets = [
      ...staticChordData[category] || [],
      ...generatedChordSets
    ];
    return allSets.map(set => ({
      ...set,
      chords: transposeProgression(set.chords, songKey)
    }));
  }, [category, songKey, generatedChordSets]);
  
  const displayedChords = useMemo(() => {
    if (chordSets.length === 0) return Array(16).fill('...');
    const set = chordSets[chordSetIndex] || { chords: [] };
    const chords = set.chords;
    return [...chords, ...Array(Math.max(0, 16 - chords.length)).fill('...')].slice(0, 16);
  }, [chordSets, chordSetIndex]);

  const getVoicedChordNotes = useCallback((chordName: string) => {
    switch(voicingMode) {
      case 'manual':
        return getChordNoteStrings(chordName, octave);
      case 'auto':
        return getChordNoteStrings(chordName, 0); // Voicing will be handled by humanizeProgression later
      case 'off':
      default:
        const rootPosChord = chordName.replace(INVERSION_REGEX, '').trim();
        return getChordNoteStrings(rootPosChord, 0);
    }
  }, [voicingMode, octave]);

  const handlePadMouseDown = useCallback((chordName: string) => {
    if (chordName === '...') return;
    const notes = getVoicedChordNotes(chordName);
    setActivePadChordNotes(notes);
    startChordSound(notes);
    const normalizedNotes = normalizeNotesForPiano(notes);
    pianoRef.current?.scrollToNote(normalizedNotes[0]);
  }, [getVoicedChordNotes]);

  const handlePadMouseUp = useCallback(() => {
    stopChordSound(activePadChordNotes);
    setActivePadChordNotes([]);
  }, [activePadChordNotes]);

  const handlePadHover = useCallback((chordName: string) => {
    if (chordName === '...') {
      setHoveredNotes([]);
      setManualDisplayText(null);
      return;
    }
    const notes = getVoicedChordNotes(chordName);
    setHoveredNotes(notes);
    setManualDisplayText({ name: chordName, notes: notes.join(' ')});
  }, [getVoicedChordNotes]);

  const handlePadLeave = useCallback(() => {
    setHoveredNotes([]);
    setManualDisplayText(null);
  }, []);
  
  const handlePianoKeyDown = useCallback((note: string) => {
    setActivePianoNote(note);
    startNoteSound(note);
    setHoveredNotes([note]);
    setManualDisplayText({ name: note, notes: '' });
  }, []);

  const handlePianoKeyUp = useCallback((note: string) => {
    stopNoteSound(note);
    if (activePianoNote === note) {
      setActivePianoNote(null);
    }
    setHoveredNotes([]);
    setManualDisplayText(null);
  }, [activePianoNote]);
  
  const handleGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const progression = await generateProgression(prompt, songKey);
      if (progression.length > 0) {
        const newSet: ChordSet = { name: prompt, chords: progression };
        setGeneratedChordSets(prev => [newSet, ...prev]);
        setCategory(Object.keys(staticChordData)[0]); // Reset to a static category to avoid confusion
        setChordSetIndex(0); // Select the newly generated progression
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  }, [songKey]);

  // --- Sequencer Handlers ---
  const handleAddChord = useCallback((chordName: string, start: number) => {
    if (!currentPattern) return;
    const newChord: SequenceChord = {
      id: generateId(),
      chordName,
      start: Math.round(start),
      duration: 8, // 8 steps = half note
    };
    const newSequence = [...currentPattern.sequence, newChord];
    setPatterns(patterns => patterns.map(p => p.id === currentPatternId ? { ...p, sequence: newSequence } : p));
  }, [currentPattern, currentPatternId, setPatterns]);

  const handleUpdateChord = useCallback((id: string, newProps: Partial<SequenceChord>) => {
    if (!currentPattern) return;
    const newSequence = currentPattern.sequence.map(c =>
      c.id === id ? { ...c, ...newProps } : c
    );
    setPatterns(patterns => patterns.map(p => p.id === currentPatternId ? { ...p, sequence: newSequence } : p));
  }, [currentPattern, currentPatternId, setPatterns]);
  
  const handleRemoveChords = useCallback((idsToRemove: Set<string>) => {
    if (!currentPattern) return;
    const newSequence = currentPattern.sequence.filter(c => !idsToRemove.has(c.id));
    setPatterns(patterns => patterns.map(p => p.id === currentPatternId ? { ...p, sequence: newSequence } : p));
    setSelectedChordIds(new Set());
  }, [currentPattern, currentPatternId, setPatterns]);
  
  const handleChordSelect = useCallback((id: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedChordIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    } else {
      setSelectedChordIds(new Set([id]));
    }
  }, []);
  
  const handleDeselect = useCallback(() => {
    setSelectedChordIds(new Set());
  }, []);
  
  // --- Metronome Setup ---
  const metronome = useRef<Tone.Player | null>(null);
  useEffect(() => {
    metronome.current = new Tone.Player("/samples/metronome.wav").toDestination();
    metronome.current.volume.value = -12; // Quieter tick
  }, []);
  
  // --- Sequencer Playback Logic ---
  const chordPart = useRef<Tone.Part | null>(null);
  const bassPart = useRef<Tone.Part | null>(null);
  const drumParts = useRef<Map<DrumSound, Tone.Part>>(new Map());
  const metronomePart = useRef<Tone.Part | null>(null);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);
  
  useEffect(() => {
    if (!currentPattern) return;

    // --- Stop and clear previous parts ---
    chordPart.current?.stop(0).dispose();
    bassPart.current?.stop(0).dispose();
    drumParts.current.forEach(part => part.stop(0).dispose());
    drumParts.current.clear();
    metronomePart.current?.stop(0).dispose();

    // --- Rebuild parts for current pattern ---
    const STEPS_PER_BAR = currentPattern.timeSignature === '4/4' ? 16 : 12;
    const TOTAL_STEPS = currentPattern.bars * STEPS_PER_BAR;

    // --- Chord Part ---
    const sequenceForPlayback = isSequencerVoicingOn && voicingMode === 'auto'
        ? humanizeProgression(currentPattern.sequence.map(c => c.chordName))
        : currentPattern.sequence.map(c => c.chordName);

    const chordEvents = currentPattern.sequence.map((chord, index) => {
        const chordNameToUse = sequenceForPlayback[index];
        return {
            time: `${Math.floor(chord.start / 4)}:${(chord.start % 4)}`,
            duration: `${Math.floor(chord.duration / 4)}:${(chord.duration % 4)}`,
            chordName: chordNameToUse,
            id: chord.id,
        };
    });

    chordPart.current = new Tone.Part((time, value) => {
        const notes = getChordNoteStrings(value.chordName, 0);
        sampler.triggerAttackRelease(notes, value.duration, time);
        Tone.Draw.schedule(() => {
            setPlayingChordId(value.id);
            setSequencerActiveNotes(notes);
            setSequencerDisplayText({ name: value.chordName, notes: notes.join(' ')});
        }, time);
    }, chordEvents).start(0);

    // --- Bass Part ---
     const bassEvents = currentPattern.bassSequence.map(note => ({
        time: `${Math.floor(note.start / 4)}:${(note.start % 4)}`,
        duration: `${Math.floor(note.duration / 4)}:${(note.duration % 4)}`,
        noteName: note.noteName,
        id: note.id,
    }));
    
    bassPart.current = new Tone.Part((time, value) => {
        bassSynth.triggerAttackRelease(value.noteName, value.duration, time);
        Tone.Draw.schedule(() => {
          // You might want a separate state for the playing bass note if needed
        }, time);
    }, bassEvents).start(0);

    // --- Drum Part ---
    if (isDrumsEnabled) {
      DRUM_SOUNDS.forEach(sound => {
        const events = [];
        for (let i = 0; i < TOTAL_STEPS; i++) {
          if (currentPattern.drumPattern[sound]?.[i]) {
            events.push(i);
          }
        }
        const part = new Tone.Part((time) => {
          drumPlayers.player(sound).start(time);
        }, events.map(step => `${Math.floor(step / 4)}:${(step % 4)}`)).start(0);
        drumParts.current.set(sound, part);
      });
    }

    // --- Metronome Part ---
    if (isMetronomeOn) {
      const beats = Array.from({ length: currentPattern.bars * (currentPattern.timeSignature === '4/4' ? 4 : 3) }, (_, i) => i);
      metronomePart.current = new Tone.Part(time => {
        metronome.current?.start(time);
      }, beats).start(0);
    }
    
    return () => {
        chordPart.current?.stop(0).dispose();
        bassPart.current?.stop(0).dispose();
        drumParts.current.forEach(part => part.stop(0).dispose());
        drumParts.current.clear();
        metronomePart.current?.stop(0).dispose();
    };
}, [currentPattern, isSequencerVoicingOn, voicingMode, isDrumsEnabled, isMetronomeOn]);

  const handlePlayPause = useCallback(() => {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      Tone.start(); // Ensure audio context is running
      Tone.Transport.start();
      setIsPlaying(true);
    }
  }, []);

  const handleStop = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    setIsPlaying(false);
    setPlayingChordId(null);
    setSequencerActiveNotes([]);
    setSequencerDisplayText(null);
    setActiveDrumStep(null);
  }, []);

  const handlePanic = useCallback(() => {
    // Stop transport and cancel all scheduled events
    Tone.Transport.stop();
    Tone.Transport.cancel();
    // Release all active voices on the synths
    sampler.releaseAll();
    // FIX: MonoSynth does not have a `releaseAll` method. `triggerRelease` is used to stop the single voice of the synth.
    bassSynth.triggerRelease();
    drumPlayers.stopAll();
    
    // Reset state
    setIsPlaying(false);
    setPlayingChordId(null);
    setSequencerActiveNotes([]);
    setActivePadChordNotes([]);
    setSequencerDisplayText(null);
    setActiveDrumStep(null);
    
    // It's often good to reset position as well
    Tone.Transport.position = 0;
  }, []);

  const handleSeek = (positionInBeats: number) => {
    Tone.Transport.position = `${Math.floor(positionInBeats / 4)}:${positionInBeats % 4}:0`;
    setPlayheadPosition(positionInBeats);
  };
  
  // --- Animation frame loop for playhead ---
  useEffect(() => {
    let animationFrameId: number;
    const update = () => {
      const beats = Tone.Transport.seconds * (Tone.Transport.bpm.value / 60);
      setPlayheadPosition(beats);
      
      if (isDrumsEnabled && isPlaying) {
          const stepsPerBeat = 4;
          const totalSteps = (currentPattern?.bars || 4) * (currentPattern?.timeSignature === '4/4' ? 16 : 12);
          const currentStep = Math.floor(beats * stepsPerBeat) % totalSteps;
          setActiveDrumStep(currentStep);
      } else {
          setActiveDrumStep(null);
      }

      animationFrameId = requestAnimationFrame(update);
    };
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      setActiveDrumStep(null);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isDrumsEnabled, currentPattern]);
  
  // Reset sequencer display when playback stops
  useEffect(() => {
    if (!isPlaying) {
      const timeout = setTimeout(() => {
        setPlayingChordId(null);
        setSequencerActiveNotes([]);
        setSequencerDisplayText(null);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isPlaying]);

  // --- Volume Controls ---
  useEffect(() => {
    Tone.getDestination().volume.value = isMuted ? -Infinity : masterVolume;
  }, [masterVolume, isMuted]);

  useEffect(() => {
    drumVolume.volume.value = isMuted ? -Infinity : 0; // Drum volume is relative to master
  }, [isMuted]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleStop();
      } else if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && e.code === 'KeyY') {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && e.code === 'KeyC') {
        if (selectedChordIds.size > 0 && currentPattern) {
            e.preventDefault();
            const chordsToCopy = currentPattern.sequence.filter(c => selectedChordIds.has(c.id));
            setClipboard(chordsToCopy);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.code === 'KeyV') {
          if (clipboard.length > 0 && currentPattern) {
              e.preventDefault();
              const startPoint = Math.floor(playheadPosition * 4); // convert beats to 16th steps
              const firstChordStart = clipboard[0].start;

              const newChords = clipboard.map(c => ({
                  ...c,
                  id: generateId(),
                  start: startPoint + (c.start - firstChordStart)
              }));
              
              const newSequence = [...currentPattern.sequence, ...newChords];
              setPatterns(pats => pats.map(p => p.id === currentPattern.id ? { ...p, sequence: newSequence } : p));
          }
      }
      else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedChordIds.size > 0) {
          e.preventDefault();
          handleRemoveChords(selectedChordIds);
        }
      } else {
        const padIndex = CODE_TO_PAD_INDEX[e.code];
        if (padIndex !== undefined && padIndex < displayedChords.length) {
          e.preventDefault();
          const chordName = displayedChords[padIndex];
          if (chordName && chordName !== '...') {
            setActiveKeyboardPadIndices(prev => new Set(prev).add(padIndex));
            handlePadMouseDown(chordName);
          }
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const padIndex = CODE_TO_PAD_INDEX[e.code];
      if (padIndex !== undefined) {
        setActiveKeyboardPadIndices(prev => {
          const newSet = new Set(prev);
          newSet.delete(padIndex);
          return newSet;
        });
        handlePadMouseUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePlayPause, handleStop, undo, redo, selectedChordIds, handleRemoveChords, clipboard, currentPattern, playheadPosition, setPatterns, displayedChords, handlePadMouseDown, handlePadMouseUp]);
  
  // --- Pattern Controls ---
  const handleSelectPattern = (id: string) => setCurrentPatternId(id);

  const handleAddPattern = () => {
    const newName = `Pattern ${patterns.length + 1}`;
    const newPattern = createNewPattern(newName, 4, '4/4');
    setPatterns(p => [...p, newPattern]);
    setCurrentPatternId(newPattern.id);
  };

  const handleDeletePattern = (id: string) => {
    if (patterns.length <= 1) return; // Can't delete the last pattern
    
    setDialog({ type: 'deletePattern', data: { id, name: patterns.find(p => p.id === id)?.name }});
  };

  const confirmDeletePattern = (id: string) => {
    const newPatterns = patterns.filter(p => p.id !== id);
    setPatterns(newPatterns);
    if (currentPatternId === id) {
      setCurrentPatternId(newPatterns[0].id);
    }
    setDialog(null);
  };

  const handleRenamePattern = (id: string, newName: string) => {
    setPatterns(pats => pats.map(p => p.id === id ? { ...p, name: newName } : p));
  };
  
  const handleCopyPattern = (id: string) => {
      const patternToCopy = patterns.find(p => p.id === id);
      if (!patternToCopy) return;

      const newPattern: Pattern = {
          ...patternToCopy,
          id: generateId(),
          name: `${patternToCopy.name} Copy`,
      };
      setPatterns(pats => [...pats, newPattern]);
      setCurrentPatternId(newPattern.id);
  };

  const handleReorderPatterns = (draggedId: string, targetId: string) => {
    const draggedIndex = patterns.findIndex(p => p.id === draggedId);
    const targetIndex = patterns.findIndex(p => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newPatterns = [...patterns];
    const [draggedItem] = newPatterns.splice(draggedIndex, 1);
    newPatterns.splice(targetIndex, 0, draggedItem);
    setPatterns(newPatterns);
  };

  const handleToggleBarMode = (patternId: string) => {
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) return;
    
    const newBars = pattern.bars === 4 ? 8 : 4;

    if (newBars === 4) {
        const stepsPerBar = pattern.timeSignature === '4/4' ? 16 : 12;
        const chordsInSecondHalf = pattern.sequence.some(c => c.start >= 4 * stepsPerBar);
        const drumsInSecondHalf = DRUM_SOUNDS.some(sound => 
            pattern.drumPattern[sound]?.some((step, i) => step && i >= 4 * stepsPerBar)
        );

        if (chordsInSecondHalf || drumsInSecondHalf) {
            setDialog({ type: 'barMode', data: { patternId, newBars }});
            return;
        }
    }
    
    confirmToggleBarMode(patternId, newBars);
  };

  const confirmToggleBarMode = (patternId: string, newBars: 4 | 8) => {
    setPatterns(pats => pats.map(p => {
        if (p.id === patternId) {
            const stepsPerBar = p.timeSignature === '4/4' ? 16 : 12;
            const newTotalSteps = newBars * stepsPerBar;

            const newSequence = p.sequence.filter(c => c.start < newTotalSteps);

            const newDrumPattern = { ...p.drumPattern };
            DRUM_SOUNDS.forEach(sound => {
                newDrumPattern[sound] = p.drumPattern[sound].slice(0, newTotalSteps);
            });

            return { ...p, bars: newBars, sequence: newSequence, drumPattern: newDrumPattern };
        }
        return p;
    }));
    setDialog(null);
  };
  
  const handleTimeSignatureChange = (patternId: string, ts: '4/4' | '3/4') => {
      const pattern = patterns.find(p => p.id === patternId);
      if (!pattern || pattern.timeSignature === ts) return;

      setDialog({ type: 'timeSignature', data: { patternId, newTimeSignature: ts }});
  };

  const confirmTimeSignatureChange = (patternId: string, newTimeSignature: '4/4' | '3/4') => {
      setPatterns(pats => pats.map(p => {
        if (p.id === patternId) {
            // Reset sequences and drum patterns when changing time signature
            return {
                ...p,
                timeSignature: newTimeSignature,
                sequence: [],
                bassSequence: [],
                drumPattern: createExpandedDrumPattern(EMPTY_DRUM_PATTERNS[newTimeSignature], p.bars, newTimeSignature)
            };
        }
        return p;
      }));
      setDialog(null);
  };

  const handleDrumPatternChange = (sound: DrumSound, step: number, value: boolean) => {
      if (!currentPattern) return;
      const newDrumPattern = { ...currentPattern.drumPattern };
      newDrumPattern[sound][step] = value;
      setPatterns(pats => pats.map(p => p.id === currentPattern.id ? { ...p, drumPattern: newDrumPattern } : p));
  };

  const handleApplyDrumPreset = (presetPattern: Record<DrumSound, boolean[]>) => {
    if (!currentPattern) return;
    const expandedPattern = createExpandedDrumPattern(presetPattern, currentPattern.bars, currentPattern.timeSignature);
    setPatterns(pats => pats.map(p => p.id === currentPattern.id ? { ...p, drumPattern: expandedPattern } : p));
  };
  
  // --- Bassline Generation ---
  const handleGenerateBassline = useCallback((style: 'root') => {
    if (!currentPattern || currentPattern.sequence.length === 0) return;
    
    let newBassSequence: SequenceBassNote[] = [];

    if (style === 'root') {
        currentPattern.sequence.forEach(chord => {
            const notes = getChordNoteStrings(chord.chordName, 0); // Get notes in root position octave 0
            const lowestNote = findLowestNote(notes);
            if (lowestNote) {
                const bassNoteName = lowestNote.replace(/\d/, '2'); // Put it in octave 2
                newBassSequence.push({
                    id: generateId(),
                    noteName: bassNoteName,
                    start: chord.start,
                    duration: chord.duration,
                });
            }
        });
    }

    setPatterns(pats => pats.map(p => p.id === currentPattern.id ? { ...p, bassSequence: newBassSequence } : p));

  }, [currentPattern, setPatterns]);
  
  // --- Dialog Rendering ---
  const renderDialog = () => {
    if (!dialog) return null;

    if (dialog.type === 'deletePattern') {
        return (
            <ConfirmationDialog
                title="Delete Pattern"
                message={<p>Are you sure you want to delete the pattern "<strong>{dialog.data.name}</strong>"? This action cannot be undone.</p>}
                confirmText="Delete"
                onConfirm={() => confirmDeletePattern(dialog.data.id)}
                onCancel={() => setDialog(null)}
            />
        );
    }
    
    if (dialog.type === 'timeSignature') {
        return (
            <ConfirmationDialog
                title="Change Time Signature"
                message={<p>Changing the time signature will clear the current chord sequence and drum pattern. Are you sure you want to continue?</p>}
                onConfirm={() => confirmTimeSignatureChange(dialog.data.patternId, dialog.data.newTimeSignature)}
                onCancel={() => setDialog(null)}
            />
        );
    }
    
    if (dialog.type === 'barMode') {
      return (
          <ConfirmationDialog
              title="Change Pattern Length"
              message={<p>Reducing the pattern length will remove all notes and drum hits from the second half. This action cannot be undone. Are you sure you want to continue?</p>}
              onConfirm={() => confirmToggleBarMode(dialog.data.patternId, dialog.data.newBars)}
              onCancel={() => setDialog(null)}
          />
      );
    }

    return null;
  };

  if (!isAppReady) {
    return <LoadingScreen isLoaded={isPianoLoaded} onStart={handleStart} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white select-none">
      {renderDialog()}
      {activeChordEditor && (
        <ChordEditor 
          chord={activeChordEditor} 
          onClose={() => setActiveChordEditor(null)}
          onApply={(newChordName) => {
            handleUpdateChord(activeChordEditor.id, { chordName: newChordName });
          }}
          onPreview={(chordName) => playChordOnce(getChordNoteStrings(chordName, 0), '8n')}
          updateChordUtil={updateChord}
        />
      )}
      <Header />
      
      <main ref={mainAreaRef} className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <HoverDisplay data={sequencerDisplayText || manualDisplayText} />
          <ArrangementView 
            patterns={patterns}
            currentPattern={currentPattern}
            onSelectPattern={handleSelectPattern}
            onAddPattern={handleAddPattern}
            onDeletePattern={handleDeletePattern}
            onRenamePattern={handleRenamePattern}
            onCopyPattern={handleCopyPattern}
            onReorderPatterns={handleReorderPatterns}
            bpm={bpm}
            onBpmChange={setBpm}
            onToggleBarMode={handleToggleBarMode}
            onTimeSignatureChange={handleTimeSignatureChange}
            isDrumsEnabled={isDrumsEnabled}
            onToggleDrumsEnabled={() => setIsDrumsEnabled(v => !v)}
            onToggleDrumEditor={() => setIsDrumEditorOpen(v => !v)}
            isDrumEditorOpen={isDrumEditorOpen}
            isMetronomeOn={isMetronomeOn}
            onMetronomeToggle={() => setIsMetronomeOn(v => !v)}
            isPianoVisible={isPianoVisible}
            onTogglePiano={() => setIsPianoVisible(v => !v)}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            basslineStyle={basslineStyle}
            onSetBasslineStyle={setBasslineStyle}
            onGenerateBass={handleGenerateBassline}
          />
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-sequencer-scrollbar">
            <Sequencer
              sequence={currentPattern?.sequence || []}
              bassSequence={currentPattern?.bassSequence || []}
              onAddChord={handleAddChord}
              onUpdateChord={handleUpdateChord}
              onRemoveChord={(id) => handleRemoveChords(new Set([id]))}
              onChordDoubleClick={setActiveChordEditor}
              onPlayChord={(name) => playChordOnce(getChordNoteStrings(name, 0), '8n')}
              onChordSelect={handleChordSelect}
              onDeselect={handleDeselect}
              onChordMouseUp={() => { /* Handled by global mouseup in drag effect */}}
              playheadPosition={playheadPosition}
              playingChordId={playingChordId}
              playingBassNoteId={null} // Update if you add bass note highlighting
              selectedChordIds={selectedChordIds}
              bars={currentPattern?.bars || 4}
              timeSignature={currentPattern?.timeSignature || '4/4'}
              onSeek={handleSeek}
              isClickMuted={isSequencerClickMuted}
              onMuteToggle={() => setIsSequencerClickMuted(v => !v)}
            />
          </div>
           {isDrumEditorOpen && currentPattern && (
                <DrumEditor
                    pattern={currentPattern.drumPattern}
                    onPatternChange={handleDrumPatternChange}
                    volume={0} // Placeholder for individual drum volume
                    onVolumeChange={() => {}} // Placeholder
                    activeStep={activeDrumStep}
                    bars={currentPattern.bars}
                    timeSignature={currentPattern.timeSignature}
                    onClose={() => setIsDrumEditorOpen(false)}
                    presets={PRESET_DRUM_PATTERNS}
                    onApplyPreset={handleApplyDrumPreset}
                />
            )}
           {isPianoVisible && (
              <div className="p-2 bg-gray-800/50">
                  <Piano 
                    ref={pianoRef}
                    highlightedNotes={normalizeNotesForPiano([...hoveredNotes, ...sequencerActiveNotes])}
                    pressedNotes={normalizeNotesForPiano([...activePadChordNotes, ...(activePianoNote ? [activePianoNote] : [])])}
                    onKeyMouseDown={handlePianoKeyDown}
                    onKeyMouseEnter={(note) => { if (activePianoNote) handlePianoKeyDown(note); }}
                    onKeyMouseLeave={() => { if (activePianoNote) handlePianoKeyUp(activePianoNote); }}
                    onPianoMouseLeave={() => { if (activePianoNote) handlePianoKeyUp(activePianoNote); }}
                  />
              </div>
            )}
          <TransportControls 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            onPanic={handlePanic}
            playheadPosition={playheadPosition}
            bars={currentPattern?.bars || 4}
            timeSignature={currentPattern?.timeSignature || '4/4'}
            masterVolume={masterVolume}
            onMasterVolumeChange={setMasterVolume}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(m => !m)}
          />
        </div>
        <SidePanel
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          chords={displayedChords}
          songKey={songKey}
          setSongKey={setSongKey}
          category={category}
          setCategory={setCategory}
          chordSetIndex={chordSetIndex}
          setChordSetIndex={setChordSetIndex}
          categories={Object.keys(staticChordData)}
          chordSets={chordSets}
          keys={KEY_OPTIONS}
          onPadMouseDown={handlePadMouseDown}
          onPadMouseUp={handlePadMouseUp}
          onPadMouseEnter={handlePadHover}
          onPadMouseLeave={handlePadLeave}
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
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-800/80 hover:bg-indigo-600/80 p-2 rounded-l-md transition-colors"
            aria-label="Open sidebar"
            title="Open Sidebar"
          >
            <HamburgerIcon className="w-6 h-6" />
          </button>
        )}
      </main>
      <style>{`
        .custom-sequencer-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-sequencer-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
        .custom-sequencer-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 4px; }
        .custom-sequencer-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }
      `}</style>
    </div>
  );
};

export default App;
