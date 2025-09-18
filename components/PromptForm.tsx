import React from 'react';
import { ChordSet } from '../types';

interface ControlsProps {
  songKey: string;
  setSongKey: (key: string) => void;
  category: string;
  setCategory: (category: string) => void;
  chordSetIndex: number;
  setChordSetIndex: (index: number) => void;
  categories: string[];
  chordSets: ChordSet[];
  keys: { value: string; label: string; }[];
}

export const Controls: React.FC<ControlsProps> = ({
  songKey,
  setSongKey,
  category,
  setCategory,
  chordSetIndex,
  setChordSetIndex,
  categories,
  chordSets,
  keys,
}) => {

  const selectStyles = "bg-gray-800 border-2 border-gray-700 text-gray-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent block p-2.5 transition-all duration-200 w-full";
  const labelStyles = "block mb-2 text-sm font-medium text-gray-400";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="song-key-select" className={labelStyles}>Song Key</label>
          <select 
            id="song-key-select" 
            value={songKey} 
            onChange={(e) => setSongKey(e.target.value)} 
            className={selectStyles}
            title="Set the global key for all chord progressions"
            onWheel={(e) => {
              e.preventDefault();
              const currentIndex = keys.findIndex(k => k.value === songKey);
              let newIndex = currentIndex;
              if (e.deltaY < 0) { // Scroll up
                  newIndex = Math.max(0, currentIndex - 1);
              } else { // Scroll down
                  newIndex = Math.min(keys.length - 1, currentIndex + 1);
              }
              if (newIndex !== currentIndex) {
                  setSongKey(keys[newIndex].value);
              }
            }}
          >
            {keys.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="category-select" className={labelStyles}>Category</label>
          <select 
            id="category-select" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            className={selectStyles}
            title="Choose a genre or style category"
            onWheel={(e) => {
              e.preventDefault();
              const currentIndex = categories.indexOf(category);
              let newIndex = currentIndex;
              if (e.deltaY < 0) { // Scroll up
                  newIndex = Math.max(0, currentIndex - 1);
              } else { // Scroll down
                  newIndex = Math.min(categories.length - 1, currentIndex + 1);
              }
              if (newIndex !== currentIndex) {
                  setCategory(categories[newIndex]);
              }
            }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="chord-set-select" className={labelStyles}>Chord Set</label>
        <select 
          id="chord-set-select" 
          value={chordSetIndex} 
          onChange={(e) => setChordSetIndex(parseInt(e.target.value, 10))} 
          className={selectStyles}
          title="Select a specific chord progression from the category"
          onWheel={(e) => {
            e.preventDefault();
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
            <option key={p.name + index} value={index}>
              {p.name.length > 70 ? p.name.substring(0, 67) + '...' : p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
