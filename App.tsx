

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


// Simple unique ID generator
const generateId = () => `_${Math.random().toString(36).substr(2, 9)}`;

// --- Loading Screen Component ---
const LoadingScreen: React.FC<{ isLoaded: boolean; onStart: () => void; }> = ({ isLoaded, onStart }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center text-white">
      <h1 className="text-6xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text mb-2 font-display">
        Cadence
      </h1>
      <p className="text-lg text-gray-400 mb-8 tracking-wider">The Songwriter's Canvas</p>
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
        {isLoaded ? (
          <div className="w-full h-full bg-indigo-500"></div>
        ) : (
          <div className="w-full h-full relative">
            <div className="absolute top-0 bottom-0 w-1/3 bg-indigo-500 rounded-full animate-indeterminate-loader"></div>
          </div>
        )}
      </div>
      {isLoaded ? (
        <button 
          onClick={onStart} 
          className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 animate-fade-in"
        >
          Click to Start
        </button>
      ) : (
        <p className="text-gray-400">Loading audio samples...</p>
      )}
       <style>{`
          @keyframes indeterminate-loader {
            0% { left: -33.33%; }
            100% { left: 100%; }
          }
          .animate-indeterminate-loader {
            animation: indeterminate-loader 1.5s ease-in-out infinite;
          }
           @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
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
  
  // --- Pattern & Sequencer State ---
  const [patterns, setPatterns] = useState<Pattern[]>(() => [createNewPattern('Pattern 1', 4, PRESET_DRUM_PATTERNS[0].pattern)]);
  const [currentPatternId, setCurrentPatternId] = useState(patterns[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [playingChordId, setPlayingChordId] = useState<string | null>(null);
  const [sequencerActiveNotes, setSequencerActiveNotes] = useState<string[]>([]);
  const [activeSequencerManualNotes, setActiveSequencerManualNotes] = useState<string[]>([]);
  const [isSequencerVoicingOn, setIsSequencerVoicingOn] = useState(true);
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
  }, [songKey, sequence, currentPatternId]);

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

  const updatePattern = (id: string, updates: Partial<Pattern>) => {
    setPatterns(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const renamePattern = (id: string, newName: string) => {
    if (newName.trim()) {
      updatePattern(id, { name: newName.trim() });
    }
  };

  const addChordToSequence = (chordName: string, start: number) => {
    const newChord: SequenceChord = {
      id: generateId(), chordName, start, duration: 8,
    };
    const newSequence = [...sequence, newChord];
    updatePattern(currentPatternId, { sequence: newSequence });
  };

  const updateChordInSequence = (id: string, newProps: Partial<SequenceChord>) => {
    const newSequence = sequence.map(c => (c.id === id ? { ...c, ...newProps } : c));
    updatePattern(currentPatternId, { sequence: newSequence });
  };

  const removeChordFromSequence = (id: string) => {
    const newSequence = sequence.filter(c => c.id !== id);
    updatePattern(currentPatternId, { sequence: newSequence });
  };
  
  const handleSequencerChordMouseDown = (chordName: string) => {
// FIX: The 'release' property was incorrectly set as a string. It has been changed to a number to ensure proper audio synthesis.
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
  
  // FIX: Refactored `playEditorPreview` to improve logic and resolve potential type issues.
  // The function now stops previous notes before playing new ones and correctly handles empty chords.
  const playEditorPreview = useCallback((chordName: string) => {
    // Stop old notes first.
    if (activeEditorPreviewNotes.length > 0) {
      stopChordSound(activeEditorPreviewNotes);
    }

    // Then, set up and play new notes.
// FIX: The 'release' property was incorrectly set as a string. It has been changed to a number to ensure proper audio synthesis.
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
  }, [category]); // Only runs when category changes

  useEffect(() => {
      drumVolume.volume.value = drumVol;
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
// FIX: The `sampler.attack` property was incorrectly set as a string. It has been changed to a number to ensure proper audio synthesis.
        sampler.attack = 0.005;
        // FIX: The 'release' property must be a number, not a string.
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
// FIX: The 'attack' and 'release' properties were incorrectly set as strings. They have been changed to numbers to ensure proper audio synthesis.
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
// FIX: The 'release' property was incorrectly set as a string. It has been changed to a number to ensure proper audio synthesis.
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
    const newPatterns = [...patterns];
    newPatterns.splice(sourceIndex + 1, 0, newPattern);

    setPatterns(newPatterns);
    setCurrentPatternId(newPattern.id);
  };
  
  const handleReorderPatterns = (draggedId: string, targetId: string) => {
    const newPatterns = [...patterns];
    const draggedIndex = newPatterns.findIndex(p => p.id === draggedId);
    const targetIndex = newPatterns.findIndex(p => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedItem] = newPatterns.splice(draggedIndex, 1);
    newPatterns.splice(targetIndex, 0, draggedItem);
    
    setPatterns(newPatterns);
  };

  if (!isAppReady) {
    return <LoadingScreen isLoaded={isPianoLoaded} onStart={() => { Tone.start(); setIsAppReady(true); }} />;
  }

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex selection:bg-indigo-500 selection:text-white overflow-hidden">
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <div className="flex-1 flex flex-col gap-2 px-8 py-2 overflow-y-auto custom-scrollbar">
          <div className="flex-shrink-0">
            <Header />
            <div>
              <HoverDisplay name={lastPlayedName || hoveredItemName} />
              <Piano 
                highlightedNotes={highlightedNotesForPiano}
                pressedNotes={pressedPianoNotes}
                onKeyMouseDown={handlePianoMouseDown}
                onKeyMouseEnter={handlePianoKeyMouseEnter}
                onKeyMouseLeave={handlePianoKeyMouseLeave}
                onPianoMouseLeave={handlePianoMouseLeave}
              />
            </div>
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
              onToggleDrumEditor={() => setIsDrumEditorOpen(p => !p)}
              isDrumEditorOpen={isDrumEditorOpen}
              isMetronomeOn={isMetronomeOn}
              onMetronomeToggle={() => setIsMetronomeOn(prev => !prev)}
            />
          </div>

          <div className="flex-shrink-0 bg-gray-800/50 rounded-lg border border-gray-700">
            <Sequencer 
              sequence={processedSequence}
              onAddChord={addChordToSequence}
              onUpdateChord={updateChordInSequence}
              onRemoveChord={removeChordFromSequence}
              onChordDoubleClick={setEditingChord}
              onChordMouseDown={handleSequencerChordMouseDown}
              onChordMouseUp={handleSequencerChordMouseUp}
              playheadPosition={playheadPosition}
              playingChordId={playingChordId}
              bars={bars}
              onSeek={handleSeek}
            />
          </div>
        </div>
        
        {isDrumEditorOpen && (
           <div className="flex-shrink-0 z-20 animate-slide-in-up">
            <DrumEditor
              pattern={drumPattern}
              onPatternChange={handleDrumPatternChange}
              volume={drumVol}
              onVolumeChange={setDrumVol}
              activeStep={activeDrumStep}
              bars={bars}
              onClose={() => setIsDrumEditorOpen(false)}
            />
           </div>
        )}
        
        <div className="flex-shrink-0 z-30">
          <TransportControls 
            isPlaying={isPlaying}
            onPlayPause={handlePlay}
            onStop={handleStop}
            onPanic={handlePanic}
          />
        </div>

        {error && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-up" role="alert">
            <p><span className="font-bold">Error:</span> {error}</p>
          </div>
        )}
      </main>

      <SidePanel
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
          @keyframes slide-in-up {
            from { opacity: 0; transform: translateY(100px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-in-up { animation: slide-in-up 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
          .animate-pulse-fast { animation: pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
       `}</style>
    </div>
  );
};

export default App;