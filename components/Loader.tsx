import React from 'react';

interface PadProps {
  chordName: string;
  onMouseDown: (chordName: string) => void;
  onMouseUp: () => void;
  onMouseEnter: (chordName: string) => void;
  onMouseLeave: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isLoaded: boolean;
  isDisabled?: boolean;
  keyLabel?: string;
  isPressedByKeyboard?: boolean;
  inversionLabel?: string;
}

export const Pad: React.FC<PadProps> = ({ chordName, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, onDragStart, isLoaded, isDisabled = false, keyLabel, isPressedByKeyboard = false, inversionLabel }) => {
  const baseClasses = "relative w-full min-h-[5rem] flex items-center justify-center p-2 rounded-[3px] text-white font-semibold transition-all duration-100 transform focus:outline-none";
  
  // Base styles for an enabled pad, including mouse interaction pseudo-classes
  const enabledClasses = "cursor-grab active:cursor-grabbing bg-gradient-to-b from-slate-700 to-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] hover:from-slate-600 hover:to-slate-800 active:translate-y-px active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)]";
  
  // Styles to apply when the pad is pressed via keyboard, overriding parts of enabledClasses
  const keyboardPressedClasses = "translate-y-px shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)] from-slate-600 to-slate-800";

  const disabledClasses = "cursor-not-allowed bg-gray-700 opacity-50 shadow-inner";

  const finalIsDisabled = !isLoaded || isDisabled;
  
  const getTitle = () => {
    if (isDisabled) {
      return '3rd inversion is not available for this chord';
    }
    if (!isLoaded) {
      return 'Loading piano samples...';
    }
    const keyHint = keyLabel ? `\n{Shortcut Key: ${keyLabel}}` : '';
    return `${chordName}${keyHint}\nPlay or drag onto\nsequencer timeline`;
  };

  return (
    <button
      onMouseDown={(e) => { if (e.button === 0 && !finalIsDisabled) onMouseDown(chordName); }}
      onMouseUp={onMouseUp}
      onMouseEnter={() => onMouseEnter(chordName)}
      onMouseLeave={() => {
        onMouseUp();
        onMouseLeave();
      }}
      onDragStart={onDragStart}
      draggable={!finalIsDisabled}
      disabled={finalIsDisabled}
      className={`${baseClasses} ${finalIsDisabled ? disabledClasses : enabledClasses} ${isPressedByKeyboard && !finalIsDisabled ? keyboardPressedClasses : ''}`}
      aria-label={`Play chord ${chordName}`}
      title={getTitle()}
    >
      {keyLabel && <span className="absolute top-1.5 left-2.5 text-xs text-gray-400 font-mono pointer-events-none">{keyLabel}</span>}
      {inversionLabel && <span className="absolute top-1.5 right-2.5 text-xs text-indigo-300 font-bold pointer-events-none">{inversionLabel}</span>}
      <span className="text-white text-center font-semibold text-sm sm:text-base break-words pointer-events-none [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
        {chordName}
      </span>
    </button>
  );
};
