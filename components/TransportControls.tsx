import React, { useMemo } from 'react';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPanic: () => void;
  playheadPosition: number; // in beats
  bars: 4 | 8;
  timeSignature: '4/4' | '3/4';
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
);
const StopIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6 6h12v12H6z" /></svg>
);

const PanicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none" />
  </svg>
);

export const TransportControls: React.FC<TransportControlsProps> = ({ 
  isPlaying, onPlayPause, onStop, onPanic, playheadPosition, bars, timeSignature,
  masterVolume, onMasterVolumeChange, isMuted, onMuteToggle
}) => {
  const buttonClasses = "w-12 h-12 flex items-center justify-center rounded-full bg-gray-700/60 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900";

  const timeDisplay = useMemo(() => {
    const stepsPerBar = timeSignature === '4/4' ? 16 : 12;
    const totalSixteenths = Math.floor(playheadPosition * 4);
    const bar = Math.floor(totalSixteenths / stepsPerBar) + 1;
    const beat = Math.floor((totalSixteenths % stepsPerBar) / 4) + 1;
    const sixteenth = (totalSixteenths % 4) + 1;
    return `${String(bar).padStart(2, '0')}:${beat}:${sixteenth}`;
  }, [playheadPosition, timeSignature]);

  return (
    <div className="relative flex items-center justify-between w-full px-4 h-[72px] bg-gradient-to-r from-indigo-600 to-purple-600 border-t border-indigo-400">
      
      {/* Left: Counter */}
      <div className="bg-black/25 rounded-[3px] px-4 py-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        <div className="font-mono text-base leading-normal text-white tracking-wider" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>
          {timeDisplay}
        </div>
      </div>

      {/* Center: Transport Controls */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
        <button onClick={onStop} className={buttonClasses} aria-label="Stop" title={`SEQUENCER:\nStop playback and return to start`}>
          <StopIcon className="w-6 h-6" />
        </button>

        <button
          onClick={onPlayPause}
          className="w-16 h-16 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 active:scale-100 ring-4 ring-indigo-500/50 hover:ring-indigo-500/75 focus:outline-none"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1 text-purple-600" />}
        </button>

        <button
          onClick={onPanic}
          className={`${buttonClasses} text-gray-400 hover:bg-red-600 hover:text-white`}
          aria-label="Panic: Stop all sound"
          title={`SEQUENCER:\nPanic:\nImmediately stop all sound`}
        >
          <PanicIcon className="w-6 h-6" />
        </button>
      </div>
      
      {/* Right: Master Volume */}
      <div className="flex items-center gap-4">
        <input
            type="range"
            min={-60}
            max={6}
            step={1}
            value={isMuted ? -60 : masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-32 h-2 bg-gray-900/50 rounded-[3px] appearance-none cursor-pointer range-slider"
            aria-label="Master volume"
            title={`SEQUENCER:\nMaster Volume: ${masterVolume.toFixed(1)} dB`}
            disabled={isMuted}
        />
        <button 
          onClick={onMuteToggle} 
          className={buttonClasses} 
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          title={`SEQUENCER:\n${isMuted ? 'Unmute All Audio' : 'Mute All Audio'}`}
        >
          {isMuted ? <SpeakerOffIcon className="w-6 h-6" /> : <SpeakerIcon className="w-6 h-6" />}
        </button>
      </div>

      <style>{`
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #a5b4fc; /* indigo-300 */
          cursor: pointer;
        }
        .range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #a5b4fc;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        .range-slider:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};