import React, { useState, useRef, useLayoutEffect } from 'react';
import { Controls } from './PromptForm';
import { Pad } from './Loader';
import { XIcon } from './icons/XIcon';
import { ChordSet, ROOT_NOTE_OPTIONS, SCALE_MODE_OPTIONS } from '../types';
import { OctaveSlider } from './OctaveSlider';
import { updateChord, hasSeventh } from '../index';

interface ToolkitProps {
  onClose: () => void;
  keyLabels: string[];
  isPianoLoaded: boolean;
  height: number;
  setHeight: (height: number) => void;
  setIsResizing: (isResizing: boolean) => void;
  quarterNoteWidth: number;
  chords: string[];
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
  onPadMouseDown: (chordName: string) => void;
  onPadMouseUp: () => void;
  onPadMouseEnter: (chordName: string) => void;
  onPadMouseLeave: () => void;
  octave: number;
  setOctave: (octave: number) => void;
  inversionLevel: number;
  setInversionLevel: (level: number) => void;
  voicingMode: 'off' | 'manual' | 'auto';
  setVoicingMode: (mode: 'off' | 'manual' | 'auto') => void;
  activeKeyboardPadIndices: Set<number>;
}

const InversionControl: React.FC<{
  inversionLevel: number;
  setInversionLevel: (level: number) => void;
  disabled: boolean;
}> = ({ inversionLevel, setInversionLevel, disabled }) => {
  const labels = ['3rd', '2nd', '1st', 'Root', '1st', '2nd', '3rd'];
  const values = [-3, -2, -1, 0, 1, 2, 3];

  // Map from internal logic value to the UI slider's linear value
  const internalToUiMap: { [key: number]: number } = {
    [-3]: -1, [-2]: -2, [-1]: -3,
    [0]: 0,
    [1]: 1, [2]: 2, [3]: 3
  };
  
  // Map from UI slider's linear value to the internal logic value
  const uiToInternalMap: { [key: number]: number } = {
    [-3]: -1, [-2]: -2, [-1]: -3,
    [0]: 0,
    [1]: 1, [2]: 2, [3]: 3
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uiValue = parseInt(e.target.value, 10);
    const internalValue = Object.keys(internalToUiMap).find(key => internalToUiMap[Number(key) as keyof typeof internalToUiMap] === uiValue);
    if (internalValue) {
      setInversionLevel(Number(internalValue));
    }
  };

  const currentUiValue = internalToUiMap[inversionLevel as keyof typeof internalToUiMap] ?? 0;

  return (
    <div className={`flex flex-col gap-1 transition-opacity duration-200 ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-sm font-medium text-gray-400">Inversion</label>
      <div className="flex flex-col items-center bg-gray-800 border-2 border-gray-700 rounded-[4px] px-2 pt-1 justify-center h-[4rem]">
        <div className="flex justify-between w-full px-1 text-xs text-gray-400 font-semibold">
          {labels.map((label, index) => (
            <div key={values[index]} className="flex flex-col items-center text-center w-10">
              <span className={currentUiValue === values[index] ? 'text-indigo-300' : ''}>{label}</span>
              {label !== 'Root' && <span className={`text-[10px] ${currentUiValue === values[index] ? 'text-indigo-300' : 'text-gray-500'}`}>{index < 3 ? 'Low' : 'High'}</span>}
            </div>
          ))}
        </div>
        <div className="relative w-full h-4 mt-1">
          <input
            type="range"
            min="-3"
            max="3"
            step="1"
            value={currentUiValue}
            onChange={handleSliderChange}
            disabled={disabled}
            className="w-full h-2 bg-transparent appearance-none cursor-pointer range-slider-inversion z-10 absolute top-1/2 -translate-y-1/2"
            aria-label="Inversion slider"
            title={`INVERSIONS:\nControl chord voicings.\n'Manual' mode only.`}
          />
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-600 rounded-full mx-[12px]"></div>
        </div>
      </div>
      <style>{`
        .range-slider-inversion {
          background: transparent;
        }
        .range-slider-inversion::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 18px;
          border-radius: 10px;
          background: #818cf8; /* indigo-400 */
          cursor: pointer;
          transition: background .2s;
          margin-top: -3px; /* vertically center oval on track */
          z-index: 20;
          position: relative;
          border: 2px solid #1f2937;
        }
        
        .range-slider-inversion::-moz-range-thumb {
          width: 28px;
          height: 18px;
          border-radius: 10px;
          background: #818cf8;
          cursor: pointer;
          border: 2px solid #1f2937;
          transition: background .2s;
        }

        .range-slider-inversion:hover:not(:disabled)::-webkit-slider-thumb {
            background: #a78bfa; /* purple-400 */
        }

        .range-slider-inversion:hover:not(:disabled)::-moz-range-thumb {
            background: #a78bfa;
        }

        .range-slider-inversion:disabled::-webkit-slider-thumb {
            background: #6b7280; /* gray-500 */
            cursor: not-allowed;
        }

        .range-slider-inversion:disabled::-moz-range-thumb {
            background: #6b7280; /* gray-500 */
            cursor: not-allowed;
        }
      `}</style>
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
    <div className="flex items-center bg-gray-800 border-2 border-gray-700 rounded-[4px] p-1 w-full">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => setMode(option.value)}
          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-[4px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800
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

export const Toolkit: React.FC<ToolkitProps> = ({ 
  onClose, keyLabels, isPianoLoaded, height, setHeight, setIsResizing, quarterNoteWidth,
  chords, songRootNote, setSongRootNote, songMode, setSongMode, category, setCategory,
  chordSetIndex, setChordSetIndex, categories, chordSets, onPadMouseDown, onPadMouseUp,
  onPadMouseEnter, onPadMouseLeave, octave, setOctave, inversionLevel, setInversionLevel,
  voicingMode, setVoicingMode, activeKeyboardPadIndices
}) => {
  const [pianosWidth, setPianosWidth] = useState(250);
  const [controlsWidth, setControlsWidth] = useState(250);
  const [voicingWidth, setVoicingWidth] = useState(350);
  
  const pianoOptions = ['Steinway Grand Piano', 'Classic Upright Piano', 'Rhodes Mark I Electric Piano', '80s DX7 FM E-Piano', 'Wurlitzer 200A', 'Hohner Clavinet D6', 'Baroque Harpsichord'];
  const [selectedPiano, setSelectedPiano] = useState(pianoOptions[0]);

  const progressionSelectorRef = useRef<HTMLDivElement>(null);
  const pianoListContainerRef = useRef<HTMLDivElement>(null);
  const [pianoListHeight, setPianoListHeight] = useState<number | string>('auto');

  useLayoutEffect(() => {
    const calculateHeight = () => {
      if (progressionSelectorRef.current && pianoListContainerRef.current) {
        const progressionRect = progressionSelectorRef.current.getBoundingClientRect();
        const pianoListRect = pianoListContainerRef.current.getBoundingClientRect();
        
        const availableHeight = progressionRect.bottom - pianoListRect.top;
        const newHeight = availableHeight;
        
        if (newHeight > 20) { // Basic sanity check
          setPianoListHeight(newHeight);
        }
      }
    };

    calculateHeight();

    const containerElement = progressionSelectorRef.current?.closest('.pt-2');
    const resizeObserver = new ResizeObserver(calculateHeight);
    
    if (containerElement) {
        resizeObserver.observe(containerElement);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [pianosWidth, controlsWidth, voicingWidth, height]);


  const onPadDragStart = (e: React.DragEvent<HTMLButtonElement>, chordName: string) => {
    let finalChordName = chordName;
    
    // Apply manual inversion to the chord name if in manual mode
    if (voicingMode === 'manual') {
      const actualInversion = Math.abs(inversionLevel);
      const isThirdInvPossible = hasSeventh(chordName);
      // Cap inversion at 2 for triads, 3 for seventh+ chords.
      const cappedInversion = isThirdInvPossible ? actualInversion : Math.min(actualInversion, 2);
      finalChordName = updateChord(chordName, { inversion: cappedInversion });
    }

    const dragImage = e.currentTarget;
    const rect = dragImage.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Use a clone to ensure consistent drag image styling and size
    const clone = dragImage.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.width = quarterNoteWidth > 0 ? `${quarterNoteWidth}px` : `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    document.body.appendChild(clone);

    e.dataTransfer.setDragImage(clone, offsetX, offsetY);
    e.dataTransfer.setData("text/plain", finalChordName);
    e.dataTransfer.effectAllowed = "copy";
    
    // Clean up clone after the drag frame is captured
    setTimeout(() => document.body.removeChild(clone), 0);
  };

  const handleVerticalResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const newHeight = startHeight - deltaY;
        
        const MIN_HEIGHT = 200;
        const MAX_HEIGHT = window.innerHeight * 0.8;

        setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight)));
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const handlePianosResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = pianosWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = startWidth + deltaX;
        
        const MIN_WIDTH = 200;
        const MAX_WIDTH = 450;

        setPianosWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleControlsResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = controlsWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = startWidth + deltaX;
        
        const MIN_WIDTH = 200;
        const MAX_WIDTH = 450;

        setControlsWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleVoicingResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = voicingWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = startWidth + deltaX;
        
        const MIN_WIDTH = 200;
        const MAX_WIDTH = 450;

        setVoicingWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative bg-gray-800 rounded-[4px] border border-gray-700 p-3 h-full mt-2">
      <div 
        onMouseDown={handleVerticalResizeMouseDown}
        className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-10"
        title="Drag to resize"
      />
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          <h3 className="text-xl font-bold text-indigo-300">Chord Machine</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Close toolkit">
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="flex pt-2 mt-2 border-t border-gray-700 flex-1 min-h-0">
           {/* New Column: Pianos */}
          <div className="flex-shrink-0 flex flex-col px-4" style={{ width: `${pianosWidth}px` }}>
            <label className="block mb-2 text-sm font-medium text-gray-400 flex-shrink-0">Piano Selection</label>
            <div 
              ref={pianoListContainerRef}
              style={{ height: pianoListHeight }}
              className="overflow-y-auto custom-scrollbar border-2 border-gray-700 rounded-[4px] bg-[#282828] p-1"
            >
              {pianoOptions.map(piano => (
                <button 
                  key={piano}
                  onClick={() => setSelectedPiano(piano)}
                  className={`w-full text-left p-2 rounded-[2px] transition-colors text-sm font-bold whitespace-normal ${
                    selectedPiano === piano 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-transparent text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {piano}
                </button>
              ))}
            </div>
          </div>


          <div
            onMouseDown={handlePianosResizeMouseDown}
            className="w-1.5 flex-shrink-0 cursor-col-resize bg-gray-700 hover:bg-indigo-600 transition-colors duration-200"
            title="Drag to resize"
          />
          
           {/* Column: Controls */}
          <div className="flex-shrink-0 overflow-y-auto custom-scrollbar px-4" style={{ width: `${controlsWidth}px` }}>
              <div className="space-y-4">
                 <Controls
                    progressionRef={progressionSelectorRef}
                    songRootNote={songRootNote}
                    setSongRootNote={setSongRootNote}
                    songMode={songMode}
                    setSongMode={setSongMode}
                    category={category}
                    setCategory={(newCategory) => {
                      setCategory(newCategory);
                      setChordSetIndex(0);
                    }}
                    chordSetIndex={chordSetIndex}
                    setChordSetIndex={setChordSetIndex}
                    categories={categories}
                    chordSets={chordSets}
                    rootNoteOptions={ROOT_NOTE_OPTIONS}
                    scaleModeOptions={SCALE_MODE_OPTIONS}
                 />
              </div>
          </div>
          
          <div
            onMouseDown={handleControlsResizeMouseDown}
            className="w-1.5 flex-shrink-0 cursor-col-resize bg-gray-700 hover:bg-indigo-600 transition-colors duration-200"
            title="Drag to resize"
          />

          {/* Column: Voicing */}
          <div className="flex-shrink-0 overflow-y-auto custom-scrollbar px-4" style={{ width: `${voicingWidth}px` }}>
              <div className="space-y-3" title={`VOICING:\n'Off' plays root position.\n'Manual' allows setting octave & inversion.\n'Auto' creates smooth voice leading.`}>
                  <VoicingModeControl mode={voicingMode} setMode={setVoicingMode} />
                  <div className="flex items-end gap-4 border-t border-gray-700/50 pt-2 mt-2">
                    <div className="flex-grow">
                      <OctaveSlider octave={octave} setOctave={setOctave} />
                    </div>
                  </div>
                  <InversionControl
                      inversionLevel={inversionLevel}
                      setInversionLevel={setInversionLevel}
                      disabled={voicingMode !== 'manual'}
                  />
              </div>
          </div>
          
          <div
            onMouseDown={handleVoicingResizeMouseDown}
            className="w-1.5 flex-shrink-0 cursor-col-resize bg-gray-700 hover:bg-indigo-600 transition-colors duration-200"
            title="Drag to resize"
          />

          {/* Column: Pads */}
          <div className="flex-1 min-w-0 flex flex-col pl-4">
              <div className="overflow-y-auto custom-scrollbar flex-1 pb-2">
                 <div className="flex flex-wrap gap-2">
                    {chords.map((chord, index) => (
                        <div key={`${chord}-${index}`} 
                             className="bg-indigo-500/80 rounded-[4px] p-[2px] shadow-lg"
                             style={{ width: quarterNoteWidth > 0 ? `${quarterNoteWidth}px` : '5rem' }}
                        >
                            <Pad
                                chordName={chord}
                                onMouseDown={onPadMouseDown}
                                onMouseUp={onPadMouseUp}
                                onMouseEnter={onPadMouseEnter}
                                onMouseLeave={onPadMouseLeave}
                                onDragStart={(e) => onPadDragStart(e, chord)}
                                isLoaded={isPianoLoaded}
                                keyLabel={keyLabels[index]}
                                isPressedByKeyboard={activeKeyboardPadIndices.has(index)}
                            />
                        </div>
                    ))}
                 </div>
              </div>
          </div>
        </div>
      </div>
       <style>{`
        .range-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 28px;
            height: 18px;
            border-radius: 10px;
            background: #818cf8; /* indigo-400 */
            cursor: pointer;
            transition: background .2s;
            margin-top: -3px; /* vertically center oval on track */
            border: 2px solid #1f2937;
        }
        
        .range-slider::-moz-range-thumb {
            width: 28px;
            height: 18px;
            border-radius: 10px;
            background: #818cf8;
            cursor: pointer;
            border: 2px solid #1f2937;
            transition: background .2s;
        }

        .range-slider:hover:not(:disabled)::-webkit-slider-thumb {
            background: #a78bfa; /* purple-400 */
        }

        .range-slider:hover:not(:disabled)::-moz-range-thumb {
            background: #a78bfa;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
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
    </div>
  );
};