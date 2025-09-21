import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Pattern } from '../types';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { MetronomeIcon } from './icons/MetronomeIcon';
import { PianoIcon } from './icons/PianoIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';
import { ToolboxIcon } from './icons/ToolboxIcon';
import { PanicIcon } from './icons/PanicIcon';
import { DrumIcon } from './icons/DrumIcon';
import { DrumEditorIcon } from './icons/DrumEditorIcon';
import { HumanizeControl } from './HumanizeControl';

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
  onTimeSignatureChange: (patternId: string, ts: '4/4' | '3/4') => void;
  isDrumsEnabled: boolean;
  onToggleDrumsEnabled: () => void;
  onToggleDrumEditor: () => void;
  isDrumEditorOpen: boolean;
  isMetronomeOn: boolean;
  onMetronomeToggle: () => void;
  isPianoVisible: boolean;
  onTogglePiano: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPanic: () => void;
  playheadPosition: number;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  isChordMachineOpen: boolean;
  onToggleChordMachine: () => void;
  humanizeTiming: number;
  onHumanizeTimingChange: (value: number) => void;
  humanizeDynamics: number;
  onHumanizeDynamicsChange: (value: number) => void;
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
        className="text-xl font-bold text-white bg-gray-700 rounded-[4px] px-2 -mx-2 outline-none"
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
  bpm, onBpmChange, onToggleBarMode, onTimeSignatureChange, isDrumsEnabled, onToggleDrumsEnabled, onToggleDrumEditor, isDrumEditorOpen,
  isMetronomeOn, onMetronomeToggle, isPianoVisible, onTogglePiano,
  onUndo, onRedo, canUndo, canRedo,
  isPlaying, onPlayPause, onStop, onPanic, playheadPosition,
  masterVolume, onMasterVolumeChange, isMuted, onMuteToggle,
  isChordMachineOpen, onToggleChordMachine,
  humanizeTiming, onHumanizeTimingChange, humanizeDynamics, onHumanizeDynamicsChange
}) => {
  const [draggedPatternId, setDraggedPatternId] = useState<string | null>(null);

  const timeDisplay = useMemo(() => {
    const stepsPerBar = currentPattern?.timeSignature === '4/4' ? 16 : 12;
    if (!stepsPerBar) return "01:1:1";
    const totalSixteenths = Math.floor(playheadPosition * 4);
    const bar = Math.floor(totalSixteenths / stepsPerBar) + 1;
    const beat = Math.floor((totalSixteenths % stepsPerBar) / 4) + 1;
    const sixteenth = (totalSixteenths % 4) + 1;
    return `${String(bar).padStart(2, '0')}:${beat}:${sixteenth}`;
  }, [playheadPosition, currentPattern?.timeSignature]);

  if (!currentPattern) return null;

  const handleBpmWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const change = e.deltaY < 0 ? 1 : -1;
    onBpmChange(Math.max(40, Math.min(240, bpm + change)));
  };
  
  const baseButtonClasses = "p-2 rounded-[4px] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800";
  const regularButtonClasses = `${baseButtonClasses} bg-gray-700 text-gray-300 hover:bg-gray-600`;
  const primaryButtonClasses = `${baseButtonClasses} bg-indigo-600 text-white shadow-md hover:bg-indigo-500`;
  const dangerButtonClasses = `${baseButtonClasses} bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white`;

  return (
    <div className="flex-shrink-0 flex flex-col gap-2 pt-2 pb-2 bg-gray-800/50 border-y border-gray-700">
      <div className="flex items-center gap-1 flex-wrap px-[10px]">
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
              onContextMenu={(e) => {
                e.preventDefault();
                onCopyPattern(pattern.id);
              }}
              data-has-context-menu="true"
            >
              <button
                onClick={() => onSelectPattern(pattern.id)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-[4px] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 ${
                  isSelected ? 'bg-indigo-600 text-white shadow' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } ${isBeingDraggedOver ? 'opacity-50' : ''}`}
                title="Drag to reorder.\nRight-click to copy."
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
          className="ml-1 w-8 h-8 flex items-center justify-center text-lg font-semibold rounded-[4px] bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
          title="Add a new pattern"
        >
          +
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 px-[10px] border-t border-gray-700 mt-2 pt-2">
        <div className="flex-1 flex items-center gap-4">
          <EditablePatternName pattern={currentPattern} onRename={onRenamePattern} />
        </div>

        <div className="flex-shrink-0 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={onUndo} disabled={!canUndo} className={`${regularButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed h-10`} title="Undo (Ctrl+Z)"><UndoIcon className="w-5 h-5" /></button>
              <button onClick={onRedo} disabled={!canRedo} className={`${regularButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed h-10`} title="Redo (Ctrl+Y)"><RedoIcon className="w-5 h-5" /></button>
            </div>
            
            <div className="h-6 w-px bg-gray-600" />
            
            {/* Transport */}
            <div className="flex items-center gap-2">
                <button onClick={onPlayPause} className={`${primaryButtonClasses} w-12 h-10 flex items-center justify-center`} title={isPlaying ? "Pause (Space)" : "Play (Space)"}>
                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                </button>
                <button onClick={onStop} className={`${regularButtonClasses} w-12 h-10 flex items-center justify-center`} title="Stop">
                    <StopIcon className="w-6 h-6" />
                </button>
                <button onClick={onMetronomeToggle} className={`${isMetronomeOn ? primaryButtonClasses : regularButtonClasses} h-10`} title="Toggle Metronome"><MetronomeIcon className="w-5 h-5" /></button>
            </div>
            
            <div className="h-6 w-px bg-gray-600" />

            <div className="flex items-center gap-4">
                {/* Time Display */}
                <div 
                    className="bg-gray-900/50 rounded-[4px] px-4 h-10 w-32 flex items-center justify-center border border-gray-700"
                    title="Current Position (Bar:Beat:Sixteenth)"
                >
                    <span className="font-mono tabular-nums" style={{ fontSize: '1.30rem' }}>{timeDisplay}</span>
                </div>

                {/* BPM Control */}
                <div 
                    className="flex items-center gap-2 bg-gray-900/50 rounded-[4px] px-4 h-10 w-32 border border-gray-700"
                    title="Set project tempo (BPM)"
                >
                    <input
                        type="number"
                        value={bpm}
                        min={40} max={240}
                        onChange={(e) => onBpmChange(Number(e.target.value))}
                        onWheel={handleBpmWheel}
                        className="flex-grow font-mono bg-transparent text-right outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        style={{ fontSize: '1.30rem' }}
                    />
                    <label className="text-sm font-semibold text-gray-400">BPM</label>
                </div>
                 <div className="flex items-center gap-2">
                      <select
                          value={currentPattern.timeSignature}
                          onChange={(e) => onTimeSignatureChange(currentPattern.id, e.target.value as '4/4' | '3/4')}
                          className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-[4px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent block p-1.5 transition-all duration-200 cursor-pointer h-10"
                          title="Set pattern time signature"
                      >
                          <option value="4/4">4/4</option>
                          <option value="3/4">3/4</option>
                      </select>
                      <button
                          onClick={() => onToggleBarMode(currentPattern.id)}
                          className="px-3 text-sm font-semibold rounded-[4px] bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 h-10"
                          title="Toggle pattern length"
                      >
                          {currentPattern.bars} Bars
                      </button>
                  </div>
            </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-2">
          <HumanizeControl
            timing={humanizeTiming}
            onTimingChange={onHumanizeTimingChange}
            dynamics={humanizeDynamics}
            onDynamicsChange={onHumanizeDynamicsChange}
          />
          <div className="h-6 w-px bg-gray-600 mx-1" />
          <button onClick={onToggleDrumsEnabled} className={`${isDrumsEnabled ? primaryButtonClasses : regularButtonClasses} h-10`} title="Toggle Drums"><DrumIcon className="w-5 h-5" /></button>
          <button onClick={onToggleDrumEditor} className={`${isDrumEditorOpen ? primaryButtonClasses : regularButtonClasses} h-10`} title="Toggle Drum Editor"><DrumEditorIcon className="w-5 h-5" /></button>
          <div className="h-6 w-px bg-gray-600 mx-1" />
          <button onClick={onToggleChordMachine} className={`${isChordMachineOpen ? primaryButtonClasses : regularButtonClasses} h-10`} title="Toggle Chord Machine"><ToolboxIcon className="w-5 h-5" /></button>
          <button onClick={onTogglePiano} className={`${isPianoVisible ? primaryButtonClasses : regularButtonClasses} h-10`} title="Toggle Piano Keyboard"><PianoIcon className="w-5 h-5" /></button>
           <div className="h-6 w-px bg-gray-600 mx-1" />
          <div className="flex items-center gap-2 h-10" title="Master Volume">
             <button onClick={onMuteToggle} className={`${regularButtonClasses} p-2`}>
               {isMuted ? <SpeakerOffIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
             </button>
             <input
               type="range" min={-40} max={6} step={1} value={masterVolume}
               onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
               className="w-24 h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
             />
          </div>
          <button onClick={onPanic} className={`${dangerButtonClasses} h-10`} title="Panic! (Stop all sound)">
            <PanicIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
       <style>{`
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #818cf8; /* indigo-400 */
          cursor: pointer;
          transition: background .2s;
        }
        
        .range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #818cf8;
          cursor: pointer;
          border: none;
          transition: background .2s;
        }

        .range-slider:hover::-webkit-slider-thumb {
            background: #a78bfa; /* purple-400 */
        }

        .range-slider:hover::-moz-range-thumb {
            background: #a78bfa;
        }
      `}</style>
    </div>
  );
};