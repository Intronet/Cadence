import React, { useState, useRef, useEffect } from 'react';
import { SequenceChord, Articulation, ArpeggioRate, ArpeggioDirection } from '../types';
import { UpArrowIcon } from './icons/UpArrowIcon';
import { DownArrowIcon } from './icons/DownArrowIcon';
import { UpDownArrowIcon } from './icons/UpDownArrowIcon';
import { RandomIcon } from './icons/RandomIcon';
import { XIcon } from './icons/XIcon';

interface ArticulationEditorProps {
  chord: SequenceChord;
  anchorEl: HTMLElement;
  onClose: () => void;
  onUpdate: (articulation: Articulation) => void;
}

export const ArticulationEditor: React.FC<ArticulationEditorProps> = ({ chord, anchorEl, onClose, onUpdate }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const articulation = chord.articulation;
  if (articulation?.type !== 'arpeggio') {
    // For now, this editor only supports arpeggios.
    // In the future, it could have tabs for different articulation types.
    return null; 
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const anchorRect = anchorEl.getBoundingClientRect();
    const popoverHeight = 200; // Estimated height
    const popoverWidth = 256; // w-64
    
    let top = anchorRect.bottom + window.scrollY + 8;
    let left = anchorRect.left + window.scrollX - (popoverWidth / 2) + (anchorRect.width / 2);

    // Adjust if it goes off-screen
    if (top + popoverHeight > window.innerHeight) {
        top = anchorRect.top + window.scrollY - popoverHeight - 8;
    }
    if (left < 0) left = 8;
    if (left + popoverWidth > window.innerWidth) left = window.innerWidth - popoverWidth - 8;


    setPosition({ top, left });
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anchorEl, onClose]);

  const handleUpdate = (updates: Partial<typeof articulation>) => {
    onUpdate({ ...articulation, ...updates });
  };

  const DirectionButton: React.FC<{
      dir: ArpeggioDirection;
      current: ArpeggioDirection;
      children: React.ReactNode;
      title: string;
  }> = ({ dir, current, children, title }) => (
      <button
          onClick={() => handleUpdate({ direction: dir })}
          className={`p-2 rounded-[4px] ${current === dir ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
          title={title}
      >
          {children}
      </button>
  );

  return (
    <div
      ref={popoverRef}
      className="fixed bg-gray-800 border border-gray-600 rounded-[4px] shadow-xl p-4 w-64 z-30 animate-fade-in-fast"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
        <div className="flex justify-between items-center mb-3">
            <h4 className="text-md font-bold text-indigo-300">Arpeggio Editor</h4>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-4 h-4 text-gray-400"/></button>
        </div>
        
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Rate</label>
                <div className="flex items-center justify-between gap-1">
                    {(['8n', '16n', '32n'] as ArpeggioRate[]).map(rate => (
                        <button
                            key={rate}
                            onClick={() => handleUpdate({ rate })}
                            className={`flex-1 py-1 rounded text-sm font-semibold ${
                                articulation.rate === rate
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            }`}
                        >
                            {rate.replace('n', 'th')}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Direction</label>
                <div className="grid grid-cols-4 gap-1">
                    <DirectionButton dir="up" current={articulation.direction} title="Up"><UpArrowIcon className="w-5 h-5"/></DirectionButton>
                    <DirectionButton dir="down" current={articulation.direction} title="Down"><DownArrowIcon className="w-5 h-5"/></DirectionButton>
                    <DirectionButton dir="upDown" current={articulation.direction} title="Up/Down"><UpDownArrowIcon className="w-5 h-5"/></DirectionButton>
                    <DirectionButton dir="random" current={articulation.direction} title="Random"><RandomIcon className="w-5 h-5"/></DirectionButton>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-400">Gate</label>
                    <span className="text-sm font-mono text-indigo-300">{Math.round(articulation.gate * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={articulation.gate * 100}
                    onChange={(e) => handleUpdate({ gate: parseInt(e.target.value, 10) / 100 })}
                    className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
                    title="Note Length (Gate)"
                />
            </div>
        </div>
    </div>
  );
};