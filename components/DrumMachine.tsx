import React from 'react';
import { DrumPattern, DrumSound } from '../types';
import { DRUM_SOUNDS } from './drums/drumPatterns';
import { XIcon } from './icons/XIcon';

interface DrumEditorProps {
  pattern?: Record<DrumSound, boolean[]>;
  onPatternChange: (sound: DrumSound, step: number, value: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  activeStep: number | null;
  bars: 4 | 8;
  onClose: () => void;
}

const soundLabels: Record<DrumSound, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hat: 'Hi-Hat',
  clap: 'Clap',
  rim: 'Rim',
  timbale: 'Timbale',
};

export const DrumEditor: React.FC<DrumEditorProps> = ({
  pattern,
  onPatternChange,
  volume,
  onVolumeChange,
  activeStep,
  bars,
  onClose,
}) => {
  const stepButtonBase = "w-full h-full rounded transition-colors duration-100 border";
  const TOTAL_STEPS = bars * 16;
  const gridColsClass = bars === 8 ? 'grid-cols-128' : 'grid-cols-64';
  const minWClass = bars === 8 ? 'min-w-[100rem]' : 'min-w-[50rem]';

  return (
    <div className="flex-shrink-0 bg-gray-800 rounded-lg border border-gray-700 p-3 mt-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-indigo-300">Drum Editor</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="drum-volume" className="text-sm font-medium text-gray-400">Vol</label>
            <input
              type="range"
              id="drum-volume"
              min={-40}
              max={6}
              step={1}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              onWheel={(e) => {
                e.preventDefault();
                const change = e.deltaY < 0 ? 1 : -1;
                onVolumeChange(Math.max(-40, Math.min(6, volume + change)));
              }}
              className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-slider"
              aria-label="Drum volume"
            />
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Close drum editor">
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-[80px_1fr] gap-x-4 pt-2 mt-2 border-t border-gray-700">
        <div className="flex flex-col gap-1">
          {DRUM_SOUNDS.map(sound => (
            <div key={sound} className="h-7 flex items-center justify-end pr-2 text-sm font-semibold text-gray-300">
              {soundLabels[sound]}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <div className={`relative grid ${gridColsClass} gap-1 ${minWClass}`}>
            {Array.from({ length: bars * 4 - 1 }).map((_, i) => (
              <div key={`divider-${i}`} className="absolute top-0 bottom-0 w-px bg-gray-600 z-10" style={{ left: `calc(${(i + 1) * 25 / bars}% - 0.5px)` }}></div>
            ))}
            
            {DRUM_SOUNDS.map(sound => (
              <React.Fragment key={sound}>
                {(pattern?.[sound] || Array(TOTAL_STEPS).fill(false)).map((isActive, step) => {
                  const isBeat = step % 4 === 0;
                  const isPlaying = activeStep === step;
                  return (
                    <div
                      key={`${sound}-${step}`}
                      className={`h-7 p-px rounded ${isBeat ? 'bg-gray-700/50' : 'bg-transparent'}`}
                    >
                      <button
                        onClick={() => onPatternChange(sound, step, !isActive)}
                        aria-pressed={isActive}
                        className={`${stepButtonBase} ${isActive ? 'bg-indigo-500 border-indigo-300' : 'bg-gray-800/80 hover:bg-gray-700 border-gray-700'}`}
                      >
                        {isPlaying && <div className="w-full h-full bg-sky-400/50 rounded animate-pulse-fast"></div>}
                      </button>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

       <style>{`
        .grid-cols-64 { grid-template-columns: repeat(64, minmax(0, 1fr)); }
        .grid-cols-128 { grid-template-columns: repeat(128, minmax(0, 1fr)); }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: #818cf8; cursor: pointer; transition: background .2s;
        }
        .range-slider::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%; background: #818cf8;
          cursor: pointer; border: none; transition: background .2s;
        }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #374151; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }
      `}</style>
    </div>
  );
};