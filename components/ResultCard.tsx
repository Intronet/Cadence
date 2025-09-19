import React from 'react';
import { Pad } from './Loader';
import { hasSeventh } from '../index';

interface PadGridProps {
  chords: string[];
  onPadMouseDown: (chordName: string) => void;
  onPadMouseUp: () => void;
  onPadMouseEnter: (chordName: string) => void;
  onPadMouseLeave: () => void;
  onPadDragStart: (e: React.DragEvent, chordName: string) => void;
  isPianoLoaded: boolean;
  inversionLevel: number;
  voicingMode: 'off' | 'manual' | 'auto';
  keyLabels: string[];
  activeKeyboardPadIndices: Set<number>;
}

export const PadGrid: React.FC<PadGridProps> = ({ chords, onPadMouseDown, onPadMouseUp, onPadMouseEnter, onPadMouseLeave, onPadDragStart, isPianoLoaded, inversionLevel, voicingMode, keyLabels, activeKeyboardPadIndices }) => {
  return (
    <div className="relative animate-fade-in p-1">
      <div className="grid grid-cols-4 gap-2">
        {chords.map((chord, index) => {
          const isDisabledFor3rdInv = voicingMode === 'manual' && inversionLevel === 3 && !hasSeventh(chord);
          return (
            <div key={`${chord}-${index}`} className="bg-indigo-500/80 rounded-[3px] p-[2px] shadow-lg">
              <Pad 
                chordName={chord} 
                onMouseDown={onPadMouseDown} 
                onMouseUp={onPadMouseUp} 
                onMouseEnter={onPadMouseEnter}
                onMouseLeave={onPadMouseLeave}
                onDragStart={(e) => onPadDragStart(e, chord)}
                isLoaded={isPianoLoaded}
                isDisabled={isDisabledFor3rdInv}
                keyLabel={keyLabels[index]}
                isPressedByKeyboard={activeKeyboardPadIndices.has(index)}
              />
            </div>
          );
        })}
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};