import { DrumPatternPreset } from '../../types';

export const DRUM_SOUNDS = ['kick', 'snare', 'hat', 'clap', 'rim', 'timbale'] as const;

// Helper to create an empty pattern for a sound
const emptyTrack = (steps: 12 | 16) => Array(steps).fill(false);

export const PRESET_DRUM_PATTERNS: DrumPatternPreset[] = [
  {
    name: "70's Funk & Soul",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, false, true, false, false, true, false, false, true, false, true, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    emptyTrack(16),
        rim:     emptyTrack(16),
        timbale: emptyTrack(16),
      },
      '3/4': { // Syncopated funk waltz
        kick:    [true, false, false, false, false, true, false, true, false, false, false, false],
        snare:   [false, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, false, true, true, false, true, true, false, true, true, false, true],
        clap:    emptyTrack(12),
        rim:     emptyTrack(12),
        timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "80's",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, false],
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        rim:     emptyTrack(16),
        timbale: emptyTrack(16),
      },
       '3/4': { // Power waltz
        kick:    [true, false, false, false, false, false, true, false, false, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, true, false, false, false],
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    [false, false, false, false, true, false, false, false, true, false, false, false],
        rim:     emptyTrack(12),
        timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Alternative",
    patterns: {
      '4/4': {
        kick:    [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    emptyTrack(16),
        rim:     emptyTrack(16),
        timbale: emptyTrack(16),
      },
      '3/4': { // Driving rock waltz
        kick:    [true, false, false, true, false, false, false, false, false, true, false, false],
        snare:   [false, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    emptyTrack(12),
        rim:     emptyTrack(12),
        timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Blues",
    patterns: {
      '4/4': { // Shuffle feel
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true, false],
        clap:    emptyTrack(16),
        rim:     [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
        timbale: emptyTrack(16),
      },
      '3/4': { // Shuffle waltz
        kick:    [true, false, false, false, false, false, true, false, false, false, false, false],
        snare:   [false, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, false, true, true, false, true, true, false, true, true, false, true],
        clap:    emptyTrack(12),
        rim:     [false, false, false, true, false, false, false, true, false, false, false, true],
        timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Bossa Nova",
    patterns: {
      '4/4': {
        kick:    [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true],
        snare:   emptyTrack(16),
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    emptyTrack(16),
        rim:     [false, false, true, false, true, false, true, false, false, false, true, false, true, false, true, false],
        timbale: emptyTrack(16),
      },
      '3/4': { // Jazz Waltz with Bossa flavor
        kick:    [true, false, false, false, false, true, false, true, false, false, false, false],
        snare:   emptyTrack(12),
        hat:     [true, false, true, false, true, false, true, false, true, false, true, false],
        clap:    emptyTrack(12),
        rim:     [false, false, true, false, false, false, true, false, false, false, true, false],
        timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Chill",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, false, false, false, true, true, false, false, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
        hat:     [false, false, true, false, false, false, true, false, false, false, true, false, true, false, true, false],
        clap:    [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
        rim:     emptyTrack(16),
        timbale: emptyTrack(16),
      },
      '3/4': { // Sparse lofi waltz
        kick:    [true, false, false, false, false, true, false, false, false, false, false, false],
        snare:   [false, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [false, false, true, false, false, true, false, false, true, false, false, true],
        clap:    emptyTrack(12),
        rim:     [false, false, false, false, false, false, false, false, true, false, false, false],
        timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Cinematic",
    patterns: {
      '4/4': {
        kick:    [true, false, true, false, true, false, false, false, true, false, true, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     emptyTrack(16),
        clap:    emptyTrack(16),
        rim:     emptyTrack(16),
        timbale: [false, true, false, true, false, true, false, false, false, true, false, true, false, true, false, true],
      },
      '3/4': { // Marching feel
        kick:    [true, false, false, false, false, false, false, false, false, false, false, false],
        snare:   emptyTrack(12),
        hat:     emptyTrack(12),
        clap:    emptyTrack(12),
        rim:     emptyTrack(12),
        timbale: [false, false, true, false, true, false, true, false, false, true, false, true],
      }
    },
  },
  {
    name: "Classical",
    patterns: {
      '4/4': {
        kick:    emptyTrack(16), snare:   emptyTrack(16), hat:     emptyTrack(16),
        clap:    emptyTrack(16), rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': {
        kick:    emptyTrack(12), snare:   emptyTrack(12), hat:     emptyTrack(12),
        clap:    emptyTrack(12), rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Common Progressions", // Basic Pop Rock
    patterns: {
      '4/4': {
        kick:  [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:   [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap:  emptyTrack(16), rim:   emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // Standard pop waltz
        kick:  [true, false, false, false, false, false, false, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, true, false, false, false],
        hat:   [true, true, true, true, true, true, true, true, true, true, true, true],
        clap:  emptyTrack(12), rim:   emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Contemporary R&B",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, false, true, false, true, false, true, false, false, false, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [false, false, true, true, false, true, true, true, false, true, true, true, false, true, true, true],
        clap:    emptyTrack(16), rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // Laid back waltz
        kick:    [true, false, false, true, false, false, false, false, true, false, false, false],
        snare:   [false, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, false, true, true, true, false, true, true, true, false, true, true],
        clap:    emptyTrack(12), rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Deep House",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   emptyTrack(16),
        hat:     [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // Three-on-the-floor waltz
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   emptyTrack(12),
        hat:     [false, false, true, false, false, true, false, false, true, false, false, true],
        clap:    [false, false, false, false, true, false, false, false, true, false, false, false],
        rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Disco",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [false, false, true, true, false, false, true, true, false, false, true, true, false, false, true, true],
        clap:    emptyTrack(16), rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // Disco waltz
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, true, false, false, false],
        hat:     [false, true, true, false, true, true, false, true, true, false, true, true],
        clap:    emptyTrack(12), rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Divisi 4 Part",
    patterns: {
      '4/4': {
        kick: emptyTrack(16), snare: emptyTrack(16), hat: emptyTrack(16),
        clap: emptyTrack(16), rim: emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': {
        kick: emptyTrack(12), snare: emptyTrack(12), hat: emptyTrack(12),
        clap: emptyTrack(12), rim: emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Drum & Bass",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, false, true, false, true, false, false, true, false, false, true, false, false],
        snare:   [false, false, false, true, false, false, false, false, false, true, false, false, true, false, true, false],
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    emptyTrack(16), rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // Fast breakbeat waltz
        kick:    [true, false, false, false, true, false, false, false, false, false, false, false],
        snare:   [false, false, false, false, false, false, true, false, false, true, false, true],
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    emptyTrack(12), rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "EDM",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // Pumping waltz
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   emptyTrack(12),
        hat:     [false, false, true, false, false, true, false, false, true, false, false, true],
        clap:    [false, false, false, false, true, false, false, false, true, false, false, false],
        rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Fixed Bass",
    patterns: {
      '4/4': {
        kick:    [true, false, true, false, false, false, true, false, true, false, true, false, false, false, true, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true],
        clap:    emptyTrack(16), rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': {
        kick:    [true, false, true, false, false, false, true, false, false, false, true, false],
        snare:   [false, false, false, false, true, false, false, false, true, false, false, false],
        hat:     [true, false, true, true, false, true, true, false, true, true, false, true],
        clap:    emptyTrack(12), rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Future Bass",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, false, true, false, false, true, false, false, true, false, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, true, true, false, true, true, true, false, true, true, true, false, true, true, true, true],
        clap:    [false, false, false, false, true, false, true, false, false, false, false, false, true, false, false, false],
        rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': {
        kick:    [true, false, false, false, false, true, false, false, true, false, false, false],
        snare:   [false, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, true, true, false, true, false, true, true, true, false, true, false],
        clap:    [false, false, false, false, false, false, false, false, true, false, false, false],
        rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Gospel",
    patterns: {
      '4/4': {
        kick:    [true, false, false, true, false, false, true, false, true, false, false, true, false, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
        hat:     [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true, false],
        clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // Gospel Shuffle Waltz
        kick:    [true, false, false, false, false, false, true, false, false, false, false, false],
        snare:   [false, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, false, true, true, false, true, true, false, true, true, false, true],
        clap:    [false, false, false, false, true, false, false, false, true, false, false, false],
        rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "Hip-Hop",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, false, true, false, false, true, false, false, true, false, false, true, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, false, true, false, true, false, true, true, true, false, true, false, true, false, true, false],
        clap:    emptyTrack(16), rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // Boom-bap waltz
        kick:    [true, false, false, false, true, false, false, true, false, false, false, false],
        snare:   [false, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, false, true, false, true, false, true, false, true, false, true, false],
        clap:    emptyTrack(12), rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "House",
    patterns: {
      '4/4': {
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        clap:    emptyTrack(16), rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // House Waltz
        kick:    [true, false, false, false, true, false, false, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, true, false, false, false],
        hat:     [false, true, false, true, false, true, false, true, false, true, false, true],
        clap:    emptyTrack(12), rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
  {
    name: "J-K-Pop",
    patterns: {
      '4/4': {
        kick:    [true, true, false, false, true, false, true, false, true, true, false, false, true, false, true, false],
        snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        rim:     emptyTrack(16), timbale: emptyTrack(16),
      },
      '3/4': { // High energy waltz
        kick:    [true, false, true, false, false, false, true, false, true, false, false, false],
        snare:   [false, false, false, false, true, false, false, false, true, false, false, false],
        hat:     [true, true, true, true, true, true, true, true, true, true, true, true],
        clap:    [false, false, false, false, true, false, false, false, true, false, false, false],
        rim:     emptyTrack(12), timbale: emptyTrack(12),
      }
    },
  },
];