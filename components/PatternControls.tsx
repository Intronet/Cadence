import React, { useState, useEffect, useRef } from 'react';
import { Pattern } from '../types';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { MetronomeIcon } from './icons/MetronomeIcon';

interface ArrangementViewProps {
  patterns: Pattern[];
  currentPattern: Pattern | undefined;
  onSelectPattern: (id: string) => void;
  onAddPattern: () => void;
  onDeletePattern: (id: string) => void;
  onRenamePattern: (id: string, newName: string) => void;
  onCopyPattern: (id: string) => void;
  onReorderPatterns: (draggedId: string, targetId: string) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onToggleBarMode: (patternId: string) => void;
  isDrumsEnabled: boolean;
  onToggleDrumsEnabled: () => void;
  onToggleDrumEditor: () => void;
  isDrumEditorOpen: boolean;
  isMetronomeOn: boolean;
  onMetronomeToggle: () => void;
}

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const EditablePatternName: React.FC<{
  pattern: Pattern;
  onRename: (id: string, newName: string) => void;
}> = ({ pattern, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(pattern.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(pattern.name);
  }, [pattern.name]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onRename(pattern.id, name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setName(pattern.name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="text-xl font-bold text-white bg-gray-700 rounded px-2 -mx-2 outline-none"
      />
    );
  }

  return (
    <h3
      onDoubleClick={() => setIsEditing(true)}
      className="text-xl font-bold text-indigo-300 cursor-pointer"
      title="Double-click to rename"
    >
      {pattern.name}
    </h3>
  );
};


export const ArrangementView: React.FC<ArrangementViewProps> = ({
  patterns, currentPattern, onSelectPattern, onAddPattern, onDeletePattern, onRenamePattern, onCopyPattern, onReorderPatterns,
  bpm, onBpmChange, onToggleBarMode, isDrumsEnabled, onToggleDrumsEnabled, onToggleDrumEditor, isDrumEditorOpen,
  isMetronomeOn, onMetronomeToggle
}) => {
  const [draggedPatternId, setDraggedPatternId] = useState<string | null>(null);

  if (!currentPattern) return null;

  const handleBpmWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const change = e.deltaY < 0 ? 1 : -1;
    onBpmChange(Math.max(40, Math.min(240, bpm + change)));
  };

  return (
    <div className="flex-shrink-0 flex flex-col gap-2 mb-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-center gap-1 flex-wrap">
        <div className="text-sm font-bold text-indigo-300 pr-2 mr-1 border-r border-gray-600 self-stretch flex items-center">PATTERNS</div>
        {patterns.map((pattern) => {
          const isSelected = pattern.id === currentPattern.id;
          const isBeingDraggedOver = draggedPatternId !== null && draggedPatternId !== pattern.id;
          
          return (
            <div 
              key={pattern.id} 
              className="relative flex items-center"
              draggable
              onDragStart={() => setDraggedPatternId(pattern.id)}
              onDragEnd={() => setDraggedPatternId(null)}
              onDragEnter={(e) => {
                e.preventDefault();
                if (draggedPatternId && draggedPatternId !== pattern.id) {
                    onReorderPatterns(draggedPatternId, pattern.id);
                }
              }}
              onDoubleClick={() => onCopyPattern(pattern.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                onCopyPattern(pattern.id);
              }}
              data-has-context-menu="true"
              title="Drag to reorder. Right-click or double-click to copy."
            >
              <button
                onClick={() => onSelectPattern(pattern.id)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 ${
                  isSelected ? 'bg-indigo-600 text-white shadow' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } ${isBeingDraggedOver ? 'opacity-50' : ''}`}
              >
                {pattern.name}
              </button>
              {isSelected && patterns.length > 1 && (
                <button
                  onClick={() => onDeletePattern(pattern.id)}
                  className="ml-1 p-1 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  aria-label={`Delete ${pattern.name}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={onAddPattern}
          className="ml-1 w-8 h-8 flex items-center justify-center text-lg font-semibold rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
          title="Add a new pattern"
        >
          +
        </button>
      </div>

      <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-700/60">
        <EditablePatternName pattern={currentPattern} onRename={onRenamePattern} />
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">BPM</span>
                <input type="range" min="40" max="240" value={bpm} onChange={e => onBpmChange(Number(e.target.value))} onWheel={handleBpmWheel} className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-slider" title="Adjust BPM"/>
                <input type="number" value={bpm} onChange={e => onBpmChange(Number(e.target.value))} onWheel={handleBpmWheel} className="w-16 bg-gray-900 border border-gray-600 text-center rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" title="Set precise BPM"/>
            </div>
            <button onClick={onMetronomeToggle} className={`p-2 rounded-full transition-colors ${isMetronomeOn ? 'bg-indigo-600 text-white' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`} title="Toggle Metronome">
              <MetronomeIcon className="w-5 h-5"/>
            </button>
            <button onClick={() => onToggleBarMode(currentPattern.id)} className="px-3 py-1 text-sm font-semibold rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600" title="Toggle pattern length between 4 and 8 bars">{currentPattern.bars === 8 ? '8 Bars' : '4 Bars'}</button>
            <div className="flex items-center gap-2" title="Enable or disable drums">
                <span className="text-sm font-medium text-gray-400">Drums</span>
                <button
                    type="button"
                    onClick={onToggleDrumsEnabled}
                    className={`${isDrumsEnabled ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800`}
                    role="switch"
                    aria-checked={isDrumsEnabled}
                >
                    <span aria-hidden="true" className={`${isDrumsEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}/>
                </button>
            </div>
            <button onClick={onToggleDrumEditor} className={`p-2 rounded-full transition-colors ${isDrumEditorOpen ? 'bg-indigo-600 text-white' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`} title="Toggle Drum Editor"><MusicNoteIcon className="w-5 h-5"/></button>
        </div>
      </div>
    </div>
  );
};