import React from 'react';

interface PadProps {
  chordName: string;
  onMouseDown: (chordName: string) => void;
  onMouseUp: () => void;
  onMouseEnter: (chordName: string) => void;
  onMouseLeave: () => void;
  // FIX: Add optional onDragStart prop to support dragging.
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  isLoaded: boolean;
  keyLabel?: string;
  isPressedByKeyboard?: boolean;
}

export const Pad: React.FC<PadProps> = ({ chordName, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, onDragStart, isLoaded, keyLabel, isPressedByKeyboard = false }) => {
  const baseClasses = "relative w-full min-h-[5rem] flex items-center justify-center p-2 rounded-[4px] text-white font-semibold transition-all duration-100 transform focus:outline-none";
  
  const enabledClasses = "cursor-pointer bg-gradient-to-b from-slate-700 to-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] hover:from-slate-600 hover:to-slate-700 active:from-slate-600 active:to-slate-700 active:translate-y-px active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.5)]";
  
  const keyboardPressedClasses = "translate-y-px shadow-[inset_0_3px_5px_rgba(0,0,0,0.5)] bg-gradient-to-b from-slate-600 to-slate-700";

  const disabledClasses = "cursor-not-allowed bg-gray-700 opacity-50 shadow-inner";

  const finalIsDisabled = !isLoaded;
  
  const getTooltipText = () => {
    if (!isLoaded) {
      return 'Loading piano samples...';
    }
    const keyHint = keyLabel ? `\n{Shortcut Key: ${keyLabel}}` : '';
    return `${chordName}${keyHint}\nClick to play or record`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!finalIsDisabled) {
        onMouseDown(chordName);
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!finalIsDisabled) {
        onMouseUp();
      }
    }
  };

  return (
    <div
      role="button"
      tabIndex={finalIsDisabled ? -1 : 0}
      draggable={!finalIsDisabled && !!onDragStart}
      onMouseDown={(e) => { if (e.button === 0 && !finalIsDisabled) onMouseDown(chordName); }}
      onMouseUp={onMouseUp}
      onMouseEnter={() => !finalIsDisabled && onMouseEnter(chordName)}
      onMouseLeave={() => {
        if (!finalIsDisabled) {
            onMouseLeave();
        }
      }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onDragStart={onDragStart}
      className={`${baseClasses} ${finalIsDisabled ? disabledClasses : enabledClasses} ${isPressedByKeyboard && !finalIsDisabled ? keyboardPressedClasses : ''}`}
      aria-label={`Play chord ${chordName}`}
      title={getTooltipText()}
    >
      {keyLabel && <span className="absolute top-1.5 left-2.5 text-xs text-gray-400 font-mono pointer-events-none">{keyLabel}</span>}
      <span className="text-white text-center font-semibold text-xs sm:text-sm break-words pointer-events-none [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
        {chordName}
      </span>
    </div>
  );
};
