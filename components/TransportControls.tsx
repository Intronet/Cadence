import React from 'react';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPanic: () => void;
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

export const TransportControls: React.FC<TransportControlsProps> = ({ isPlaying, onPlayPause, onStop, onPanic }) => {
  const buttonClasses = "w-12 h-12 flex items-center justify-center rounded-full bg-gray-700/60 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900";

  return (
    <div className="flex items-center justify-center gap-6 w-full p-2 bg-gradient-to-r from-indigo-600 to-purple-600 border-t border-indigo-400">
      <button onClick={onStop} className={buttonClasses} aria-label="Stop" title="Stop playback and return to start">
        <StopIcon className="w-6 h-6" />
      </button>

      <button
        onClick={onPlayPause}
        className="w-16 h-16 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 active:scale-100 ring-4 ring-indigo-500/50 hover:ring-indigo-500/75 focus:outline-none"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
      </button>

      <button
        onClick={onPanic}
        className={`${buttonClasses} text-gray-400 hover:bg-red-600 hover:text-white`}
        aria-label="Panic: Stop all sound"
        title="Panic: Immediately stop all sound"
      >
        <PanicIcon className="w-6 h-6" />
      </button>
    </div>
  );
};
