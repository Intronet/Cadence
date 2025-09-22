import React, { useState, useRef, useEffect } from 'react';
import { SequenceChord, Articulation, ArpeggioRate, ArpeggioDirection, StrumDirection, ArpeggioMode } from '../types';
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
  const { articulation } = chord;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const anchorRect = anchorEl.getBoundingClientRect();
    const popoverHeight = 220; // Estimated height
    const popoverWidth = 256; // w-64
    
    let top = anchorRect.bottom + window.scrollY + 8;
    let left = anchorRect.left + window.scrollX - (popoverWidth / 2) + (anchorRect.width / 2);

    if (top + popoverHeight > window.innerHeight) {
        top = anchorRect.top + window.scrollY - popoverHeight - 8;
    }
    if (left < 0) left = 8;
    if (left + popoverWidth > window.innerWidth) left = window.innerWidth - popoverWidth - 8;

    setPosition({ top, left });
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anchorEl, onClose]);

  if (!articulation) {
    onClose();
    return null;
  }

  const handleUpdate = (updates: Partial<Articulation>) => {
    onUpdate({ ...articulation, ...updates } as Articulation);
  };
  
  const DirectionButton: React.FC<{
      dir: ArpeggioDirection | StrumDirection;
      current: ArpeggioDirection | StrumDirection;
      children: React.ReactNode;
      title: string;
      onClick: () => void;
      className?: string;
  }> = ({ dir, current, children, title, onClick, className = '' }) => (
      <button
          onMouseDown={onClick}
          className={`p-2 rounded-[4px] ${current === dir ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'} ${className}`}
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
            <h4 className="text-md font-bold text-indigo-300">
                {articulation.type === 'arpeggio' ? 'Arpeggio Editor' : 'Strum Editor'}
            </h4>
            <button onMouseDown={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-4 h-4 text-gray-400"/></button>
        </div>
        
        {articulation.type === 'arpeggio' && (
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Mode</label>
                    <div className="flex items-center justify-between gap-1">
                       {(['note', 'chord', 'strum'] as ArpeggioMode[]).map(mode => (
                            <button
                                key={mode}
                                onMouseDown={() => handleUpdate({ mode })}
                                className={`flex-1 py-1 rounded text-sm font-semibold capitalize ${
                                    (articulation.mode || 'note') === mode
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Rate</label>
                    <div className="flex items-center justify-between gap-1">
                        {(['8n', '16n', '32n'] as ArpeggioRate[]).map(rate => (
                            <button
                                key={rate}
                                onMouseDown={() => handleUpdate({ rate })}
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

                <div className={articulation.mode === 'chord' ? 'opacity-50' : ''}>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Direction</label>
                    <div className="grid grid-cols-4 gap-1">
                        <DirectionButton dir="up" current={articulation.direction} title="Up" onClick={() => articulation.mode !== 'chord' && handleUpdate({ direction: 'up' })}><UpArrowIcon className="w-5 h-5"/></DirectionButton>
                        <DirectionButton dir="down" current={articulation.direction} title="Down" onClick={() => articulation.mode !== 'chord' && handleUpdate({ direction: 'down' })}><DownArrowIcon className="w-5 h-5"/></DirectionButton>
                        <DirectionButton dir="upDown" current={articulation.direction} title="Up/Down" onClick={() => articulation.mode !== 'chord' && handleUpdate({ direction: 'upDown' })}><UpDownArrowIcon className="w-5 h-5"/></DirectionButton>
                        <DirectionButton dir="random" current={articulation.direction} title="Random" onClick={() => articulation.mode !== 'chord' && handleUpdate({ direction: 'random' })}><RandomIcon className="w-5 h-5"/></DirectionButton>
                    </div>
                </div>

                {articulation.mode === 'strum' ? (
                     <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-gray-400">Strum Speed</label>
                            <span className="text-sm font-mono text-indigo-300">{Math.round((articulation.strumSpeed ?? 0.5) * 100)}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-10 text-center">Tight</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={(articulation.strumSpeed ?? 0.5) * 100}
                                onChange={(e) => handleUpdate({ strumSpeed: parseInt(e.target.value, 10) / 100 })}
                                className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
                                title="Strum Speed"
                            />
                             <span className="text-xs text-gray-500 w-10 text-center">Loose</span>
                        </div>
                    </div>
                ) : (
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
                )}
            </div>
        )}

        {articulation.type === 'strum' && (
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Direction</label>
                    <div className="grid grid-cols-2 gap-1">
                        <DirectionButton className="flex-1" dir="up" current={articulation.direction} title="Up" onClick={() => handleUpdate({ direction: 'up' })}>
                           <div className="flex items-center justify-center gap-2"><UpArrowIcon className="w-5 h-5"/> Up</div>
                        </DirectionButton>
                        <DirectionButton className="flex-1" dir="down" current={articulation.direction} title="Down" onClick={() => handleUpdate({ direction: 'down' })}>
                           <div className="flex items-center justify-center gap-2"><DownArrowIcon className="w-5 h-5"/> Down</div>
                        </DirectionButton>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-400">Speed</label>
                        <span className="text-sm font-mono text-indigo-300">{Math.round(articulation.speed * 100)}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-10 text-center">Tight</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={articulation.speed * 100}
                            onChange={(e) => handleUpdate({ speed: parseInt(e.target.value, 10) / 100 })}
                            className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
                            title="Strum Speed"
                        />
                         <span className="text-xs text-gray-500 w-10 text-center">Loose</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};