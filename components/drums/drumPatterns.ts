import { DrumPattern } from '../../types';

export const DRUM_SOUNDS = ['kick', 'snare', 'hat', 'clap', 'rim', 'timbale'] as const;

// Helper to create an empty pattern for a sound
const emptyTrack = () => Array(16).fill(false);

export const PRESET_DRUM_PATTERNS: DrumPattern[] = [
  {
    name: "70's Funk & Soul",
    pattern: {
      kick:    [true, false, false, false, false, true, false, false, true, false, false, true, false, true, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "80's",
    pattern: {
      kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare:   [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false],
      hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Alternative",
    pattern: {
      kick:    [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Blues", // Shuffle feel
    pattern: {
      kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true, false],
      clap:    emptyTrack(),
      rim:     [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
      timbale: emptyTrack(),
    },
  },
  {
    name: "Bossa Nova",
    pattern: {
      kick:    [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true],
      snare:   emptyTrack(),
      hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap:    emptyTrack(),
      rim:     [false, false, true, false, true, false, true, false, false, false, true, false, true, false, true, false],
      timbale: emptyTrack(),
    },
  },
  {
    name: "Chill",
    pattern: {
      kick:    [true, false, false, false, false, false, false, true, true, false, false, false, true, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
      hat:     [false, false, true, false, false, false, true, false, false, false, true, false, true, false, true, false],
      clap:    [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Cinematic",
    pattern: {
      kick:    [true, false, true, false, true, false, false, false, true, false, true, false, true, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     emptyTrack(),
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: [false, true, false, true, false, true, false, false, false, true, false, true, false, true, false, true],
    },
  },
  {
    name: "Classical",
    pattern: {
      kick:    emptyTrack(),
      snare:   emptyTrack(),
      hat:     emptyTrack(),
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Common Progressions", // Basic Pop Rock
    pattern: {
      kick:  [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:   [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap:  emptyTrack(),
      rim:   emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Contemporary R&B",
    pattern: {
      kick:    [true, false, false, false, false, true, false, true, false, true, false, false, false, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [false, false, true, true, false, true, true, true, false, true, true, true, false, true, true, true],
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Deep House",
    pattern: {
      kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare:   emptyTrack(),
      hat:     [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Disco",
    pattern: {
      kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [false, false, true, true, false, false, true, true, false, false, true, true, false, false, true, true],
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Divisi 4 Part", // Same as Classical
    pattern: {
      kick:    emptyTrack(),
      snare:   emptyTrack(),
      hat:     emptyTrack(),
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Drum & Bass", // Amen break simplified
    pattern: {
      kick:    [true, false, false, false, false, true, false, true, false, false, true, false, false, true, false, false],
      snare:   [false, false, false, true, false, false, false, false, false, true, false, false, true, false, true, false],
      hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "EDM",
    pattern: {
      kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Fixed Bass",
    pattern: {
      kick:    [true, false, true, false, false, false, true, false, true, false, true, false, false, false, true, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true],
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Future Bass",
    pattern: {
      kick:    [true, false, false, false, false, true, false, false, true, false, false, true, false, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, true, true, false, true, true, true, false, true, true, true, false, true, true, true, true],
      clap:    [false, false, false, false, true, false, true, false, false, false, false, false, true, false, false, false],
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Gospel", // Shuffle/swing feel
    pattern: {
      kick:    [true, false, false, true, false, false, true, false, true, false, false, true, false, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
      hat:     [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true, false],
      clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "Hip-Hop",
    pattern: {
      kick:    [true, false, false, false, false, true, false, false, true, false, false, true, false, false, true, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, false, true, false, true, false, true, true, true, false, true, false, true, false, true, false],
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "House",
    pattern: {
      kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      clap:    emptyTrack(),
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
  {
    name: "J-K-Pop",
    pattern: {
      kick:    [true, true, false, false, true, false, true, false, true, true, false, false, true, false, true, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      rim:     emptyTrack(),
      timbale: emptyTrack(),
    },
  },
];
