import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Tone from 'tone';

// NOTE: The following is a conceptual new file `utils/music.ts`
// It is included here to adhere to the platform's file modification constraints.
// In a real project, this would be `src/utils/music.ts`.

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const NOTE_TO_INDEX: { [note: string]: number } = {
  'C': 0, 'B#': 0, 'Dbb': 0,
  'C#': 1, 'Db': 1, 'B##': 1,
  'D': 2, 'C##': 2, 'Ebb': 2,
  'D#': 3, 'Eb': 3, 'Fbb': 3,
  'E': 4, 'Fb': 4, 'D##': 4,
  'F': 5, 'E#': 5, 'Gbb': 5,
  'F#': 6, 'Gb': 6, 'E##': 6,
  'G': 7, 'F##': 7, 'Abb': 7,
  'G#': 8, 'Ab': 8,
  'A': 9, 'G##': 9, 'Bbb': 9,
  'A#': 10, 'Bb': 10, 'Cbb': 10,
  'B': 11, 'Cb': 11, 'A##': 11,
};

export const KEY_SIGNATURES: { [key: string]: 'sharps' | 'flats' } = {
  'C': 'sharps', 'G': 'sharps', 'D': 'sharps', 'A': 'sharps', 'E': 'sharps', 'B': 'sharps', 'F#': 'sharps', 'C#': 'sharps',
  'F': 'flats', 'Bb': 'flats', 'Eb': 'flats', 'Ab': 'flats', 'Db': 'flats', 'Gb': 'flats', 'Cb': 'flats',
  'A#': 'flats', 'D#': 'flats', 'G#': 'flats',
};

export const SCALE_MODE_MAPPING: { [mode: string]: { intervals: number[], qualities: string[] } } = {
    'Major':      { intervals: [0, 2, 4, 5, 7, 9, 11], qualities: ['Maj7', 'min7', 'min7', 'Maj7', '7', 'min7', 'min7(b5)'] },
    'Minor':      { intervals: [0, 2, 3, 5, 7, 8, 10], qualities: ['min7', 'min7(b5)', 'Maj7', 'min7', 'min7', 'Maj7', '7'] },
    'Dorian':     { intervals: [0, 2, 3, 5, 7, 9, 10], qualities: ['min7', 'min7', 'Maj7', '7', 'min7', 'min7(b5)', 'Maj7'] },
    'Phrygian':   { intervals: [0, 1, 3, 5, 7, 8, 10], qualities: ['min7', 'Maj7', '7', 'min7', 'min7(b5)', 'Maj7', 'min7'] },
    'Lydian':     { intervals: [0, 2, 4, 6, 7, 9, 11], qualities: ['Maj7', '7', 'min7', 'min7(b5)', 'Maj7', 'min7', 'min7'] },
    'Mixolydian': { intervals: [0, 2, 4, 5, 7, 9, 10], qualities: ['7', 'min7', 'min7(b5)', 'Maj7', 'min7', 'min7', 'Maj7'] },
    'Locrian':    { intervals: [0, 1, 3, 5, 6, 8, 10], qualities: ['min7(b5)', 'Maj7', 'min7', 'min7', 'Maj7', '7', 'min7'] },
};

export const generateDiatonicChords = (rootNote: string, mode: string): string[] => {
    const modeData = SCALE_MODE_MAPPING[mode];
    
    // Fallback to Major scale for modes not yet implemented in the mapping
    const effectiveModeData = modeData || SCALE_MODE_MAPPING['Major'];

    const rootNoteIndex = parseNote(rootNote);
    if (isNaN(rootNoteIndex)) return Array(7).fill('...');

    const useSharps = KEY_SIGNATURES[rootNote] !== 'flats';

    const chords = effectiveModeData.intervals.map((interval, i) => {
        const noteName = transposeNote(rootNote, interval, useSharps);
        const quality = effectiveModeData.qualities[i];
        return `${noteName}${quality}`;
    });

    return chords;
};


// --- Circle of Fifths Data ---
export const CIRCLE_OF_FIFTHS_SHARPS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
export const CIRCLE_OF_FIFTHS_FLATS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

export const getNoteFromCircle = (note: string, offset: number): string => {
  const allNotes = [...CIRCLE_OF_FIFTHS_SHARPS.slice(0, 7), ...CIRCLE_OF_FIFTHS_FLATS.slice(1)];
  const useSharps = CIRCLE_OF_FIFTHS_SHARPS.includes(note);
  const circle = useSharps ? CIRCLE_OF_FIFTHS_SHARPS : ['C', ...CIRCLE_OF_FIFTHS_FLATS];

  let index = circle.indexOf(note);
  if(index === -1) { // Fallback for enharmonic equivalents
    const noteIndex = parseNote(note);
    const sharpMatch = SHARP_NOTES[noteIndex];
    index = circle.indexOf(sharpMatch);
    if(index === -1) {
       const flatMatch = FLAT_NOTES[noteIndex];
       index = circle.indexOf(flatMatch);
    }
  }

  if (index === -1) return note;

  const newIndex = (index + offset + circle.length) % circle.length;
  return circle[newIndex];
};


export const getRelativeMinor = (majorRoot: string): string => {
  return transposeNote(majorRoot, -3, KEY_SIGNATURES[majorRoot] !== 'flats');
};

export const getParallelMinor = (majorRoot: string): string => {
  return majorRoot; // Root stays the same, quality changes
};

export const getDominant = (root: string): string => getNoteFromCircle(root, 1);
export const getSubdominant = (root: string): string => getNoteFromCircle(root, -1);


export const parseNote = (note: string): number => {
    if (!note) return NaN;
    return NOTE_TO_INDEX[note];
};

const transposeNote = (note: string, interval: number, useSharps: boolean): string => {
  if (note === undefined || note === null) return '';
  const noteIndex = parseNote(note);
  if (isNaN(noteIndex)) return note; // Return original if not a parsable note
  
  const transposedIndex = (noteIndex + interval + 12) % 12;
  return useSharps ? SHARP_NOTES[transposedIndex] : FLAT_NOTES[transposedIndex];
};

const CHORD_REGEX = /^([A-G](?:##|bb|#|b)?)([^/]*)(?:\/\s*([A-G](?:##|bb|#|b)?))?$/;
export const INVERSION_REGEX = /\s*\((root|1st inv\.|2nd inv\.|3rd inv\.)\)/;
const normalizeAccidentals = (str: string) => str.replace(/♯/g, '#').replace(/♭/g, 'b');

export const parseChord = (chord: string): { root: string, quality: string, bass?: string, inversion: number } | null => {
  if (!chord) return null;
  const normalizedChord = normalizeAccidentals(chord);
  const match = normalizedChord.trim().match(CHORD_REGEX);
  if (!match) return null;

  let quality = match[2].trim();
  let inversion = 0;

  const inversionMatch = quality.match(INVERSION_REGEX);
  if (inversionMatch) {
    quality = quality.replace(INVERSION_REGEX, '').trim();
    switch (inversionMatch[1]) {
      case 'root': inversion = 0; break;
      case '1st inv.': inversion = 1; break;
      case '2nd inv.': inversion = 2; break;
      case '3rd inv.': inversion = 3; break;
    }
  }

  return {
    root: match[1],
    quality: quality,
    bass: match[3],
    inversion: inversion,
  };
};

// Chord Editor logic
export const updateChord = (
  originalChord: string, 
  updates: { root?: string; quality?: string; toggleQuality?: string, inversion?: number }
): string => {
  const parsed = parseChord(originalChord);
  if (!parsed) return originalChord;

  let newRoot = updates.root !== undefined ? updates.root : parsed.root;
  let newQuality = parsed.quality;
  let newInversion = updates.inversion !== undefined ? updates.inversion : parsed.inversion;

  if (updates.quality !== undefined) {
    const isMinor = updates.quality === 'min';
    const isDim = updates.quality === 'dim';

    // Remove existing quality indicators
    newQuality = newQuality.replace(/min|m|maj|dim|°/gi, '');
    
    if (isMinor) newQuality = 'min' + newQuality;
    else if (isDim) newQuality = 'dim' + newQuality;
    // Major is the absence of min/dim
  }
  
  if (updates.toggleQuality) {
    const token = updates.toggleQuality;
    if (newQuality.includes(token)) {
      newQuality = newQuality.replace(token, '');
    } else {
      newQuality = newQuality + token;
    }
  }

  const invSuffix = 
    newInversion === 1 ? ' (1st inv.)' : 
    newInversion === 2 ? ' (2nd inv.)' : 
    newInversion === 3 ? ' (3rd inv.)' : '';

  // Bass note overrides explicit inversion
  const bassPart = parsed.bass ? ` / ${parsed.bass}` : '';
  
  return `${newRoot}${newQuality.trim()}${bassPart}${invSuffix}`;
};


export const transposeChord = (chord: string, interval: number, useSharps: boolean): string => {
  const parts = parseChord(chord);
  if (!parts) return chord;

  const newRoot = transposeNote(parts.root, interval, useSharps);
  const newBass = parts.bass ? transposeNote(parts.bass, interval, useSharps) : undefined;
  
  const normalizedOriginal = normalizeAccidentals(chord);
  let transposed = normalizedOriginal.replace(parts.root, newRoot);
  if (parts.bass && newBass) {
    transposed = transposed.replace(parts.bass, newBass);
  }
  return transposed;
};

export const transposeProgression = (progression: string[], newKey: string): string[] => {
  if (!progression || progression.length === 0) return [];
  
  const parsedFirstChord = parseChord(progression[0]);
  if (!parsedFirstChord) return progression;

  const firstChordRoot = parsedFirstChord.root;
  const isProgressionMinor = parsedFirstChord.quality.toLowerCase().includes('min');
  
  const originalKeyIndex = parseNote(firstChordRoot);
  const newMajorKeyIndex = parseNote(newKey);
  
  if (isNaN(originalKeyIndex) || isNaN(newMajorKeyIndex)) return progression;
  
  const targetKeyIndex = isProgressionMinor 
    ? (newMajorKeyIndex - 3 + 12) % 12 
    : newMajorKeyIndex;

  const interval = targetKeyIndex - originalKeyIndex;
  
  const useSharps = KEY_SIGNATURES[newKey] !== 'flats';
  
  return progression.map(chord => transposeChord(chord, interval, useSharps));
};

export const hasSeventh = (chordName: string): boolean => {
  const parsed = parseChord(chordName);
  if (!parsed) return false;

  const quality = parsed.quality.toLowerCase();
  
  // A chord has a 3rd inversion if it contains a 7th.
  // 9ths, 11ths, and 13ths chords imply the presence of a 7th.
  return quality.includes('7') || quality.includes('9') || quality.includes('11') || quality.includes('13');
};


// --- Audio Synthesis Engine ---

export const sampler = new Tone.Sampler({
  urls: {
    A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3", A1: "A1.mp3",
    C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", A2: "A2.mp3",
    C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", A3: "A3.mp3",
    C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", A4: "A4.mp3",
    C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", A5: "A5.mp3",
    C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3", A6: "A6.mp3",
    C7: "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3", A7: "A7.mp3",
    C8: "C8.mp3"
  },
  release: 0.1,
  baseUrl: "https://tonejs.github.io/audio/salamander/"
}).toDestination();

    /*****************************************************************************************************************************************************
    'E1': 'E1.mp3', 'F1': 'F1.mp3', 'F#1': 'Fs1.mp3', 'G1': 'G1.mp3', 'G#1': 'Gs1.mp3', 'A1': 'A1.mp3', 'A#1': 'As1.mp3', 'B1': 'B1.mp3',
    'C2': 'C2.mp3', 'C#2': 'Cs2.mp3', 'D2': 'D2.mp3', 'D#2': 'Ds2.mp3', 'E2': 'E2.mp3', 'F2': 'F2.mp3', 'F#2': 'Fs2.mp3', 'G2': 'G2.mp3', 'G#2': 'Gs2.mp3'
    ******************************************************************************************************************************************************/
export const bassSampler = new Tone.Sampler({
  urls: {
        'A#1': 'As1.mp3',
        'A#2': 'As2.mp3',
        'A#3': 'As3.mp3',
        'A#4': 'As4.mp3',
        'C#1': 'Cs1.mp3',
        'C#2': 'Cs2.mp3',
        'C#3': 'Cs3.mp3',
        'C#4': 'Cs4.mp3',
        'E1': 'E1.mp3',
        'E2': 'E2.mp3',
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'G1': 'G1.mp3',
        'G2': 'G2.mp3',
        'G3': 'G3.mp3',
        'G4': 'G4.mp3'
  },
  release: 0.2,
  baseUrl: "/samples/bass/"
}).toDestination();


// --- Drum Machine Engine ---
export const drumVolume = new Tone.Volume(-6).toDestination();
export const drumPlayers = new Tone.Players({
  urls: {
    kick: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/kick.mp3',
    snare: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/snare.mp3',
    hat: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/hihat.mp3',
    rim: '/samples/percussion/rim.wav',
    clap: '/samples/percussion/clap.wav',
    timbale: '/samples/percussion/timbale.wav',
  },
}).connect(drumVolume);


export const initAudio = async () => {
  await Tone.loaded();
  return { sampler, drumPlayers };
};

const getChordNotes = (chord: string, octaveOffset: number): { note: string, octave: number }[] => {
  const parsed = parseChord(chord);
  if (!parsed) return [];

  const root = parsed.root;
  const quality = parsed.quality.replace(/\s+|\(|\)/g, '').toLowerCase().replace('seventh', '7');
  const isDiminished = quality.includes('dim') || quality.includes('°');

  const intervals = new Set<number>([0]);

  const isSus4 = quality.includes('sus4');
  const isSus2 = quality.includes('sus2');
  const isMinor = ((quality.includes('min') || quality.includes('m')) && !quality.includes('maj')) || isDiminished;
  const hasMajorThird = !isSus4 && !isSus2 && !isMinor && !quality.includes('no3');

  if (isSus4) intervals.add(5);
  else if (isSus2) intervals.add(2);
  else if (isMinor) intervals.add(3);
  else if (quality.includes('no3')) { /* no third */ }
  else intervals.add(4);

  if (quality.includes('b5') || isDiminished) {
    intervals.add(6);
  } else if (quality.includes('#5') || quality.includes('aug')) {
    intervals.add(8);
  } else if (!quality.includes('no5') && !quality.includes('tritone')) {
    intervals.add(7);
  }
   if (quality.includes('tritone')) intervals.add(6);

  const isAddChord = quality.includes('add');
  const includes13 = quality.includes('13') && !isAddChord;
  const includes11 = quality.includes('11') && !isAddChord;
  const includes9 = quality.includes('9') && !isAddChord;
  const includes7 = quality.includes('7');

  if (quality.includes('maj7') || quality.includes('maj9') || quality.includes('maj13')) {
    intervals.add(11);
  } else if (isDiminished && includes7) {
    intervals.add(9);
  } else if (includes13 || includes11 || includes9 || includes7) {
    intervals.add(10);
  }

  if (includes13) {
    intervals.add(14);
    intervals.add(21);
  }
  if (includes11) {
    if (!includes13) intervals.add(14);
    if (quality.includes('#11')) intervals.add(18);
    else intervals.add(17);
  }
  if (includes9) {
    if (quality.includes('b9')) intervals.add(13);
    else if (quality.includes('#9')) intervals.add(15);
    else intervals.add(14);
  }
  
  if (quality.includes('add13')) intervals.add(21);
  if (quality.includes('add11')) {
    if (quality.includes('#11')) intervals.add(18);
    else intervals.add(17);
  }
  if (quality.includes('add9')) intervals.add(14);
  
  if (quality.includes('6')) {
    intervals.add(9);
    if (quality.includes('69') || (quality.includes('6') && quality.includes('9'))) {
      intervals.add(14);
    }
  }
  
  if (isMinor && quality.includes('maj7')) {
      intervals.delete(10);
      intervals.add(11);
  }

  const rootNoteIndex = NOTE_TO_INDEX[root];
  if (isNaN(rootNoteIndex)) return [];
  
  const sortedIntervals = Array.from(intervals).sort((a, b) => a - b);

  let currentOctave = 4 + octaveOffset;
  let lastNoteIndex = -1;

  const useSharps = KEY_SIGNATURES[root] !== 'flats' && root.slice(-1) !== 'b';
  const noteNames = useSharps ? SHARP_NOTES : FLAT_NOTES;

  let notes = sortedIntervals.map(interval => {
    const noteIndex = (rootNoteIndex + interval);
    if (noteIndex % 12 < lastNoteIndex) {
      currentOctave++;
    }
    lastNoteIndex = noteIndex % 12;
    return { note: noteNames[noteIndex % 12], octave: currentOctave };
  });

  if (parsed.bass) {
    const bassNoteName = parsed.bass;
    const bassNoteIndex = NOTE_TO_INDEX[bassNoteName];

    if (!isNaN(bassNoteIndex)) {
      const matchingChordToneIndex = notes.findIndex(note => NOTE_TO_INDEX[note.note] === bassNoteIndex);
      
      if (matchingChordToneIndex !== -1) {
        const notesToMove = notes.splice(0, matchingChordToneIndex);
        notesToMove.forEach(note => {
          note.octave += 1;
          notes.push(note);
        });
        notes.sort((a, b) => (a.octave * 12 + NOTE_TO_INDEX[a.note]) - (b.octave * 12 + NOTE_TO_INDEX[b.note]));

      } else {
        if (notes.length > 0) {
            const lowestNote = notes[0];
            const lowestNoteMidi = lowestNote.octave * 12 + NOTE_TO_INDEX[lowestNote.note];
            
            let bassOctave = lowestNote.octave;
            let bassNoteMidi = bassOctave * 12 + bassNoteIndex;
            
            while(bassNoteMidi >= lowestNoteMidi) {
                bassOctave--;
                bassNoteMidi = bassOctave * 12 + bassNoteIndex;
            }
            notes.unshift({ note: bassNoteName, octave: bassOctave });
        }
      }
    }
  } else if (parsed.inversion > 0 && notes.length >= parsed.inversion) {
    const notesToMove = notes.splice(0, parsed.inversion);
    notesToMove.forEach(note => {
      note.octave += 1;
    });
    notes.push(...notesToMove);
  }

  return notes;
};

export const humanizeProgression = (progression: string[]): string[] => {
  if (!progression || progression.length < 2) return progression;

  const toMidi = (note: { note: string, octave: number }) => note.octave * 12 + NOTE_TO_INDEX[note.note];

  const processedProgression: string[] = [progression[0]];
  let prevNotes = getChordNotes(progression[0], 0);

  for (let i = 1; i < progression.length; i++) {
    const currentChordString = progression[i];
    const parsed = parseChord(currentChordString);

    if (!parsed || prevNotes.length === 0) {
      processedProgression.push(currentChordString);
      prevNotes = getChordNotes(currentChordString, 0);
      continue;
    }

    if (parsed.bass) {
      processedProgression.push(currentChordString);
      prevNotes = getChordNotes(currentChordString, 0);
      continue;
    }

    const baseChordName = `${parsed.root}${parsed.quality.replace(INVERSION_REGEX, '').trim()}`;
    const rootNotes = getChordNotes(baseChordName, 0);

    if (rootNotes.length === 0) {
      processedProgression.push(currentChordString);
      prevNotes = [];
      continue;
    }
    
    const numPossibleInversions = rootNotes.length;
    let bestInversionString = baseChordName;
    let bestNotes = rootNotes;
    let minDistance = Infinity;

    const prevAvgMidi = prevNotes.reduce((sum, n) => sum + toMidi(n), 0) / prevNotes.length;

    for (let inv = 0; inv < numPossibleInversions; inv++) {
      const invSuffix = inv === 0 ? '' : inv === 1 ? ' (1st inv.)' : inv === 2 ? ' (2nd inv.)' : inv === 3 ? ' (3rd inv.)' : '';
      const testChordName = `${baseChordName} ${invSuffix}`.trim();
      const currentNotes = getChordNotes(testChordName, 0);
      
      if (currentNotes.length === 0) continue;

      const currentAvgMidi = currentNotes.reduce((sum, n) => sum + toMidi(n), 0) / currentNotes.length;
      const distance = Math.abs(currentAvgMidi - prevAvgMidi);

      if (distance < minDistance) {
        minDistance = distance;
        bestInversionString = testChordName;
        bestNotes = currentNotes;
      }
    }

    processedProgression.push(bestInversionString);
    prevNotes = bestNotes;
  }
  return processedProgression;
};


export const getChordNoteStrings = (chordName: string, octave: number): string[] => {
  const notes = getChordNotes(chordName, octave);
  if (notes.length === 0) return [];
  return notes.map(({ note, octave }) => `${note}${octave}`);
}

export const startChordSound = async (notes: string[]) => {
  if (!sampler.loaded || notes.length === 0) return;
  await Tone.start();
  sampler.triggerAttack(notes);
};

export const stopChordSound = (notes: string[]) => {
  if (!sampler.loaded || notes.length === 0) return;
  sampler.triggerRelease(notes);
};

export const startNoteSound = async (note: string) => {
    if (!sampler.loaded) return;
    await Tone.start();
    sampler.triggerAttack([note]);
}

export const stopNoteSound = (note: string) => {
    if (!sampler.loaded) return;
    sampler.triggerRelease([note]);
}

export const playChordOnce = async (notes: string[], duration: Tone.Unit.Time) => {
  if (!sampler.loaded || notes.length === 0) return;
  await Tone.start();
  sampler.triggerAttackRelease(notes, duration);
};

export const noteToMidi = (note: string): number => {
    const match = note.match(/([A-G](?:##|bb|#|b)?)(-?\d+)/);
    if (!match) return -1;
    const [, pitch, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const noteValue = NOTE_TO_INDEX[pitch];
    if (noteValue === undefined) return -1;
    return noteValue + (octave + 1) * 12;
};

export const findLowestNote = (notes: string[]): string | null => {
  if (!notes || notes.length === 0) return null;
  
  let lowestNote: string | null = null;
  let lowestMidi = Infinity;

  for (const note of notes) {
    const midi = noteToMidi(note);
    if (midi !== -1 && midi < lowestMidi) {
      lowestMidi = midi;
      lowestNote = note;
    }
  }
  return lowestNote;
};


import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);