export const ROOT_NOTE_OPTIONS = [
    { value: 'C', label: 'C' },
    { value: 'C#', label: 'C♯/D♭' },
    { value: 'D', label: 'D' },
    { value: 'D#', label: 'D♯/E♭' },
    { value: 'E', label: 'E' },
    { value: 'F', label: 'F' },
    { value: 'F#', label: 'F♯/G♭' },
    { value: 'G', label: 'G' },
    { value: 'G#', label: 'G♯/A♭' },
    { value: 'A', label: 'A' },
    { value: 'A#', label: 'A♯/B♭' },
    { value: 'B', label: 'B' },
];

export const SCALE_MODE_OPTIONS = [
    { value: 'Major', label: 'Major' },
    { value: 'Minor', label: 'Minor' },
    { value: 'Dorian', label: 'Dorian' },
    { value: 'Mixolydian', label: 'Mixolydian' },
    { value: 'Lydian', label: 'Lydian' },
    { value: 'Phrygian', label: 'Phrygian' },
    { value: 'Locrian', label: 'Locrian' },
    { value: 'Whole Tone', label: 'Whole Tone' },
    { value: 'Half-whole Diminished', label: 'Half-whole Dim.' },
    { value: 'Whole-half Diminished', label: 'Whole-half Dim.' },
    { value: 'Minor Blues', label: 'Minor Blues' },
    { value: 'Minor Pentatonic', label: 'Minor Pentatonic' },
    { value: 'Major Pentatonic', label: 'Major Pentatonic' },
    { value: 'Harmonic Minor', label: 'Harmonic Minor' },
    { value: 'Harmonic Major', label: 'Harmonic Major' },
    { value: 'Dorian #4', label: 'Dorian #4' },
    { value: 'Phrygian Dominant', label: 'Phrygian Dominant' },
    { value: 'Melodic Minor', label: 'Melodic Minor' },
    { value: 'Lydian Augmented', label: 'Lydian Augmented' },
    { value: 'Lydian Dominant', label: 'Lydian Dominant' },
    { value: 'Super Locrian', label: 'Super Locrian' },
    { value: '8-Tone Spanish', label: '8-Tone Spanish' },
    { value: 'Bhairav', label: 'Bhairav' },
    { value: 'Hungarian Minor', label: 'Hungarian Minor' },
    { value: 'Hirajoshi', label: 'Hirajoshi' },
    { value: 'In-Sen', label: 'In-Sen' },
    { value: 'Iwato', label: 'Iwato' },
    { value: 'Kumoi', label: 'Kumoi' },
    { value: 'Pelog Selisir', label: 'Pelog Selisir' },
    { value: 'Pelog Tembung', label: 'Pelog Tembung' },
    { value: 'Messiaen 3', label: 'Messiaen 3' },
    { value: 'Messiaen 4', label: 'Messiaen 4' },
    { value: 'Messiaen 5', label: 'Messiaen 5' },
    { value: 'Messiaen 6', label: 'Messiaen 6' },
    { value: 'Messiaen 7', label: 'Messiaen 7' },
];

export interface ChordSet {
  name: string;
  chords: string[];
}

export type ChordData = {
  [category: string]: ChordSet[];
};

export type ArpeggioRate = '8n' | '16n' | '32n';

export type Articulation =
  | { type: 'arpeggio'; rate: ArpeggioRate }
  | { type: 'strum' };

export interface SequenceChord {
  id: string;
  chordName: string;
  start: number; // in 16th note steps (0-127 for 8 bars)
  duration: number; // in 16th note steps
  octave: number; // The octave offset for this specific chord
  articulation?: Articulation | null;
}

export interface SequenceBassNote {
  id: string;
  noteName: string; // e.g., "C2"
  start: number; // in 16th note steps
  duration: number; // in 16th note steps
}

export type DrumSound = 'kick' | 'snare' | 'hat' | 'clap' | 'rim' | 'timbale';

export interface DrumPatternPreset {
  name: string;
  patterns: {
    '4/4': Record<DrumSound, boolean[]>; // 16 steps
    '3/4': Record<DrumSound, boolean[]>; // 12 steps
  }
}

export interface Pattern {
  id: string;
  name: string;
  sequence: SequenceChord[];
  bassSequence: SequenceBassNote[];
  drumPattern: Record<DrumSound, boolean[]>; // Live patterns can be 64 or 128 steps
  bars: 4 | 8;
  timeSignature: '4/4' | '3/4';
}