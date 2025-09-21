import React from 'react';
import { ChordSet } from '../types';

interface ControlsProps {
  songRootNote: string;
  setSongRootNote: (key: string) => void;
  songMode: string;
  setSongMode: (mode: string) => void;
  category: string;
  setCategory: (category: string) => void;
  chordSetIndex: number;
  setChordSetIndex: (index: number) => void;
  categories: string[];
  chordSets: ChordSet[];
  rootNoteOptions: { value: string; label: string; }[];
  scaleModeOptions: { value: string; label: string; }[];
  progressionRef?: React.RefObject<HTMLDivElement>;
}

export const Controls: React.FC<ControlsProps> = ({
  songRootNote,
  setSongRootNote,
  songMode,
  setSongMode,
  category,
  setCategory,
  chordSetIndex,
  setChordSetIndex,
  categories,
  chordSets,
  rootNoteOptions,
  scaleModeOptions,
  progressionRef,
}) => {
  const labelStyles = "block mb-2 text-sm font-medium text-gray-400";
  const selectStyles = "w-full bg-gray-800 border-2 border-gray-700 text-gray-200 text-sm rounded-[4px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent p-2.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const isDiatonicMode = category === 'Diatonic Chords';

  const progressionOptions = chordSets.map((p, index) => ({
    value: index.toString(),
    label: p.name.length > 70 ? p.name.substring(0, 67) + '...' : p.name
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="song-root-select" className={labelStyles}>Root Note</label>
          <select
            id="song-root-select"
            value={songRootNote}
            onChange={(e) => setSongRootNote(e.target.value)}
            className={selectStyles}
            title={"ROOT:\nSet the global root note for\nall chord progressions"}
          >
            {rootNoteOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="song-mode-select" className={labelStyles}>Mode/Scale</label>
          <select
            id="song-mode-select"
            value={songMode}
            onChange={(e) => setSongMode(e.target.value)}
            disabled={!isDiatonicMode}
            className={selectStyles}
            title={!isDiatonicMode ? "Disabled (select 'Diatonic Chords' to enable)" : "MODE/SCALE:\nSet the global mode/scale"}
          >
            {scaleModeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="category-select" className={labelStyles}>Category</label>
        <select
          id="category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectStyles}
          title="Select a category of chord progressions"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      
      <div ref={progressionRef}>
        <label htmlFor="chordset-select" className={labelStyles}>Progression</label>
        <select
          id="chordset-select"
          value={chordSetIndex}
          onChange={(e) => setChordSetIndex(Number(e.target.value))}
          disabled={isDiatonicMode}
          className={selectStyles}
          title={isDiatonicMode ? "Generated Diatonic Chords" : "Select a specific chord progression from the category"}
        >
          {progressionOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};