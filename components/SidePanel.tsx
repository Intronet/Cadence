
import React from 'react';
import { PadGrid } from './ResultCard';
import { Controls } from './PromptForm';
import { ChordSet } from '../types';
import { OctaveSlider } from './OctaveSlider';
import { Generator } from './Generator';

interface SidePanelProps {
  chords: string[];
  songKey: string;
  setSongKey: (key: string) => void;
  category: string;
  setCategory: (category: string) => void;
  chordSetIndex: number;
  setChordSetIndex: (index: number) => void;
  categories: string[];
  chordSets: ChordSet[];
  keys: { value: string; label: string; }[];
  onPadMouseDown: (chordName: string) => void;
  onPadMouseUp: () => void;
  onPadMouseEnter: (chordName: string) => void;
  onPadMouseLeave: () => void;
  isPianoLoaded: boolean;
  octave: number;
  setOctave: (octave: number) => void;
  inversionLevel: number;
  setInversionLevel: (level: number) => void;
  voicingMode: 'off' | 'manual' | 'auto';
  setVoicingMode: (mode: 'off' | 'manual' | 'auto') => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  keyLabels: string[];
  isSequencerVoicingOn: boolean;
  setIsSequencerVoicingOn: (isOn: boolean) => void;
  activeKeyboardPadIndices: Set<number>;
}

const InversionControl: React.FC<{
  inversionLevel: number;
  setInversionLevel: (level: number) => void;
  disabled: boolean;
}> = ({ inversionLevel, setInversionLevel, disabled }) => {
  const options = [
    { label: 'Root', value: 0 },
    { label: '1st Inv', value: 1 },
    { label: '2nd Inv', value: 2 },
    { label: '3rd Inv', value: 3 },
  ];

  return (
    <div className={`flex flex-col gap-2 transition-opacity duration-200 ${disabled ? 'opacity-50' : ''}`}>
       <label className="block text-sm font-medium text-gray-400">Inversion</label>
       <div className="flex items-center bg-gray-800 border-2 border-gray-700 rounded-lg p-1">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => setInversionLevel(option.value)}
            disabled={disabled}
            className={`flex-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800
              ${inversionLevel === option.value && !disabled
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-300 hover:bg-gray-700'
              }
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
            aria-pressed={inversionLevel === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const VoicingModeControl: React.FC<{
  mode: 'off' | 'manual' | 'auto';
  setMode: (mode: 'off' | 'manual' | 'auto') => void;
}> = ({ mode, setMode }) => {
  const options = [
    { label: 'Off', value: 'off' },
    { label: 'Manual', value: 'manual' },
    { label: 'Auto', value: 'auto' },
  ] as const;

  return (
    <div className="flex items-center bg-gray-800 border-2 border-gray-700 rounded-lg p-1 w-full">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => setMode(option.value)}
          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800
            ${mode === option.value
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-300 hover:bg-gray-700'
            }
          `}
          aria-pressed={mode === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const VoicingSequencerToggle: React.FC<{
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  disabled: boolean;
}> = ({ enabled, setEnabled, disabled }) => (
  <div 
    className={`flex justify-between items-center mt-3 pt-3 border-t border-gray-700/50 transition-opacity duration-200 ${disabled ? 'opacity-50' : ''}`}
    title={disabled ? "Only available in 'Auto' voicing mode" : "When enabled, 'Auto' voicing mode will also apply to the chords in the sequencer."}
  >
    <label htmlFor="sequencer-voicing-toggle" className={`text-sm font-medium text-gray-400 ${disabled ? 'cursor-not-allowed' : ''}`}>
      Apply to Sequencer
    </label>
    <button
      type="button"
      id="sequencer-voicing-toggle"
      onClick={() => setEnabled(!enabled)}
      disabled={disabled}
      className={`${enabled ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        aria-hidden="true"
        className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);


export const SidePanel: React.FC<SidePanelProps> = ({
  chords,
  songKey,
  setSongKey,
  category,
  setCategory,
  chordSetIndex,
  setChordSetIndex,
  categories,
  chordSets,
  keys,
  onPadMouseDown,
  onPadMouseUp,
  onPadMouseEnter,
  onPadMouseLeave,
  isPianoLoaded,
  octave,
  setOctave,
  inversionLevel,
  setInversionLevel,
  voicingMode,
  setVoicingMode,
  onGenerate,
  isGenerating,
  keyLabels,
  isSequencerVoicingOn,
  setIsSequencerVoicingOn,
  activeKeyboardPadIndices,
}) => {
  
  const handlePadDragStart = (e: React.DragEvent, chordName: string) => {
    e.dataTransfer.setData("text/plain", chordName);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="w-[34rem] h-full bg-gray-800/30 p-4 border-l border-gray-700 hidden lg:block">
      <div className="h-full grid grid-rows-[auto_1fr] gap-4">
        {/* Non-scrolling controls area */}
        <div className="flex-shrink-0 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-indigo-300 mb-2">Controls</h2>
            <Controls
              songKey={songKey}
              setSongKey={setSongKey}
              category={category}
              setCategory={setCategory}
              chordSetIndex={chordSetIndex}
              setChordSetIndex={setChordSetIndex}
              categories={categories}
              chordSets={chordSets}
              keys={keys}
            />
          </div>
          
          <div>
            <Generator 
              onGenerate={onGenerate} 
              isGenerating={isGenerating} 
            />
          </div>

          <div title="Control how chords are played. 'Off' plays root position. 'Manual' allows setting octave and inversion. 'Auto' creates smooth voice leading.">
            <h2 className="text-lg font-semibold text-indigo-300 mb-2">Voicing</h2>
            <VoicingModeControl mode={voicingMode} setMode={setVoicingMode} />
            <div className="grid grid-cols-2 gap-4 mt-2">
              <OctaveSlider octave={octave} setOctave={setOctave} />
              <InversionControl 
                inversionLevel={inversionLevel} 
                setInversionLevel={setInversionLevel}
                disabled={voicingMode !== 'manual'}
              />
            </div>
             <VoicingSequencerToggle 
                enabled={isSequencerVoicingOn} 
                setEnabled={setIsSequencerVoicingOn} 
                disabled={voicingMode !== 'auto'}
              />
          </div>
        </div>

        {/* Scrolling pad grid area */}
        <div className="min-h-0 pr-2 pb-[10px] overflow-y-scroll custom-scrollbar">
          <PadGrid 
            chords={chords} 
            onPadMouseDown={onPadMouseDown} 
            onPadMouseUp={onPadMouseUp} 
            isPianoLoaded={isPianoLoaded}
            onPadMouseEnter={onPadMouseEnter}
            onPadMouseLeave={onPadMouseLeave}
            onPadDragStart={handlePadDragStart}
            inversionLevel={inversionLevel}
            voicingMode={voicingMode}
            keyLabels={keyLabels}
            activeKeyboardPadIndices={activeKeyboardPadIndices}
          />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937; /* gray-800 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4f46e5; /* indigo-600 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6366f1; /* indigo-500 */
        }
      `}</style>
    </aside>
  );
};
