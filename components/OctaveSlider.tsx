import React from 'react';

interface OctaveSliderProps {
  octave: number;
  setOctave: (octave: number) => void;
}

export const OctaveSlider: React.FC<OctaveSliderProps> = ({ octave, setOctave }) => {
  const octaveLabel = octave > 0 ? `+${octave}` : `${octave}`;

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-gray-400">Octave</label>
      <div className="flex items-center gap-3 bg-gray-800 border-2 border-gray-700 rounded-lg p-1 pr-3 h-[2.625rem]">
        <input
          type="range"
          min="-3"
          max="3"
          step="1"
          value={octave}
          onChange={(e) => setOctave(parseInt(e.target.value, 10))}
          onWheel={(e) => {
            e.preventDefault();
            let newValue = octave;
            if (e.deltaY < 0) { // Scroll up
                newValue = Math.min(3, octave + 1);
            } else { // Scroll down
                newValue = Math.max(-3, octave - 1);
            }
            if (newValue !== octave) {
                setOctave(newValue);
            }
          }}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-slider"
          aria-label="Octave slider"
          title="Shift the playback octave up or down"
        />
        <span className="text-sm font-medium text-gray-200 w-8 text-center flex-shrink-0" title={`Octave: ${octaveLabel}`}>{octaveLabel}</span>
      </div>
      <style>{`
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #818cf8; /* indigo-400 */
          cursor: pointer;
          transition: background .2s;
        }
        
        .range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #818cf8;
          cursor: pointer;
          border: none;
          transition: background .2s;
        }

        .range-slider:hover::-webkit-slider-thumb {
            background: #a78bfa; /* purple-400 */
        }

        .range-slider:hover::-moz-range-thumb {
            background: #a78bfa;
        }
      `}</style>
    </div>
  );
};
