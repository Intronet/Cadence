import React from 'react';
import { DrumPatternPreset, DrumSound } from '../types';
import { DRUM_SOUNDS } from './drums/drumPatterns';
import { XIcon } from './icons/XIcon';

interface DrumEditorProps {
  pattern?: Record<DrumSound, boolean[]>;
  onPatternChange: (sound: DrumSound, step: number, value: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  activeStep: number | null;
  bars: 4 | 8;
  timeSignature: '4/4' | '3/4';
  onClose: () => void;
  presets: DrumPatternPreset[];
  onApplyPreset: (pattern: Record<DrumSound, boolean[]>) => void;
  height: number;
  setHeight: (height: number) => void;
  setIsResizing: (isResizing: boolean) => void;
  isDrumsEnabled: boolean;
  onToggleDrumsEnabled: () => void;
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
  timeSignature,
  onClose,
  presets,
  onApplyPreset,
  height,
  setHeight,
  setIsResizing,
  isDrumsEnabled,
  onToggleDrumsEnabled,
}) => {
  const stepButtonBase = "w-full h-full rounded-[4px] transition-colors duration-100 border";

  const STEPS_PER_BAR = timeSignature === '4/4' ? 16 : 12;
  const BEATS_PER_BAR = timeSignature === '4/4' ? 4 : 3;
  const TOTAL_STEPS = bars * STEPS_PER_BAR;
  const TOTAL_BEATS = bars * BEATS_PER_BAR;

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    if (!presetName) return;

    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      onApplyPreset(preset.patterns[timeSignature]);
    }
    // Reset select so it can be re-triggered
    e.target.value = "";
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
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
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };


  return (
    <div className="relative flex flex-col h-full flex-shrink-0 bg-gray-800 rounded-[4px] border border-gray-700 p-3 mt-2">
      <div 
        onMouseDown={handleResizeMouseDown}
        className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-20"
        title="Drag to resize"
      />
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <h3 className="text-xl font-bold text-indigo-300">Drum Engine</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="drum-enabled-toggle" className="font-semibold text-gray-200">Enabled</label>
            <button
              id="drum-enabled-toggle"
              onClick={onToggleDrumsEnabled}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 ${
                isDrumsEnabled ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  isDrumsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <select
            onChange={handlePresetChange}
            defaultValue=""
            className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-[4px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent block p-1.5 transition-all duration-200 cursor-pointer"
            title="Apply a drum preset"
          >
            <option value="">Apply Preset...</option>
            {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
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
              className="w-24 h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
              aria-label="Drum volume"
            />
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Close drum editor">
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-[80px_1fr] gap-x-4 pt-2 mt-2 border-t border-gray-700 flex-1 min-h-0">
        <div className="flex flex-col gap-1">
          {DRUM_SOUNDS.map(sound => (
            <div key={sound} className="h-8 flex items-center justify-end pr-2 text-sm font-semibold text-gray-300">
              {soundLabels[sound]}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <div 
            className="relative grid gap-1"
            style={{ 
              gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(1.25rem, 1fr))`,
            }}
          >
            {/* Beat and Bar dividers */}
            {Array.from({ length: TOTAL_BEATS - 1 }).map((_, i) => {
              const isBarLine = (i + 1) % BEATS_PER_BAR === 0;
              return (
                  <div 
                      key={`divider-${i}`} 
                      className={`absolute top-0 bottom-0 ${isBarLine ? 'w-0.5 bg-gray-600 z-10' : 'w-px bg-gray-700'}`} 
                      style={{ left: `calc(${(i + 1) * 4 * 100 / TOTAL_STEPS}% - 0.5px)` }}
                  ></div>
              );
            })}
            
            {DRUM_SOUNDS.map(sound => (
              <React.Fragment key={sound}>
                {Array.from({ length: TOTAL_STEPS }).map((_, step) => {
                  const isActive = pattern?.[sound]?.[step] || false;
                  const isBeat = step % 4 === 0;
                  const isPlaying = activeStep === step;
                  return (
                    <div
                      key={`${sound}-${step}`}
                      className={`h-8 p-px rounded-[4px] ${isBeat ? 'bg-gray-700/50' : 'bg-transparent'}`}
                    >
                      <button
                        onClick={() => onPatternChange(sound, step, !isActive)}
                        aria-pressed={isActive}
                        className={`${stepButtonBase} ${isActive ? 'bg-indigo-500 border-indigo-300' : 'bg-gray-800/80 hover:bg-gray-700 border-gray-700'}`}
                      >
                        {isPlaying && <div className="w-full h-full bg-sky-400/50 rounded-[4px] animate-pulse-fast"></div>}
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