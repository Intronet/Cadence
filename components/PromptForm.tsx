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

  const selectStyles = "bg-gray-800 border-2 border-gray-700 text-gray-200 text-sm rounded-[3px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent block p-2.5 transition-all duration-200 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const labelStyles = "block mb-2 text-sm font-medium text-gray-400";
  const isDiatonicMode = category === 'Diatonic Chords';

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
            title={`ROOT:\nSet the global root note for\nall chord progressions`}
            onWheel={(e) => {
              e.preventDefault();
              const currentIndex = rootNoteOptions.findIndex(k => k.value === songRootNote);
              let newIndex = currentIndex;
              if (e.deltaY < 0) { // Scroll up
                  newIndex = Math.max(0, currentIndex - 1);
              } else { // Scroll down
                  newIndex = Math.min(rootNoteOptions.length - 1, currentIndex + 1);
              }
              if (newIndex !== currentIndex) {
                  setSongRootNote(rootNoteOptions[newIndex].value);
              }
            }}
          >
            {rootNoteOptions.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="song-mode-select" className={labelStyles}>Mode/Scale</label>
          <select 
            id="song-mode-select" 
            value={songMode} 
            onChange={(e) => setSongMode(e.target.value)} 
            className={selectStyles}
            disabled={!isDiatonicMode}
            title={!isDiatonicMode ? "Disabled (select 'Diatonic Chords' category to enable)" : `MODE/SCALE:\nSet the global mode/scale`}
            onWheel={(e) => {
              e.preventDefault();
              if (!isDiatonicMode) return;
              const currentIndex = scaleModeOptions.findIndex(k => k.value === songMode);
              let newIndex = currentIndex;
              if (e.deltaY < 0) { // Scroll up
                  newIndex = Math.max(0, currentIndex - 1);
              } else { // Scroll down
                  newIndex = Math.min(scaleModeOptions.length - 1, currentIndex + 1);
              }
              if (newIndex !== currentIndex) {
                  setSongMode(scaleModeOptions[newIndex].value);
              }
            }}
          >
            {scaleModeOptions.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
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
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      
      <div ref={progressionRef}>
        <label htmlFor="chordset-select" className={labelStyles}>Progression</label>
        <select 
          id="chordset-select" 
          value={chordSetIndex} 
          onChange={(e) => setChordSetIndex(Number(e.target.value))} 
          className={selectStyles}
          title={isDiatonicMode ? "Generated Diatonic Chords" : "Select a specific chord progression from the category"}
          onWheel={(e) => {
            e.preventDefault();
            if (isDiatonicMode) return;
            let newIndex = chordSetIndex;
            if (e.deltaY < 0) { // Scroll up
                newIndex = Math.max(0, chordSetIndex - 1);
            } else { // Scroll down
                newIndex = Math.min(chordSets.length - 1, chordSetIndex + 1);
            }
            if (newIndex !== chordSetIndex) {
                setChordSetIndex(newIndex);
            }
          }}
        >
          {chordSets.map((p, index) => (
            <option key={`${category}-${p.name}-${index}`} value={index}>
              {p.name.length > 70 ? p.name.substring(0, 67) + '...' : p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};