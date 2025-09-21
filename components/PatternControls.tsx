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
  basslineStyle: 'root';
  onSetBasslineStyle: (style: 'root') => void;
  onGenerateBass: (style: 'root') => void;
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
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none" />
  </svg>
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
        className="text-xl font-bold text-white bg-gray-700 rounded-[3px] px-2 -mx-2 outline-none"
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
  basslineStyle, onSetBasslineStyle, onGenerateBass,
  isPlaying, onPlayPause, onStop, onPanic, playheadPosition,
  masterVolume, onMasterVolumeChange, isMuted, onMuteToggle,
  isChordMachineOpen, onToggleChordMachine
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
  
  const baseButtonClasses = "p-2 rounded-[3px] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800";
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
              title={`Drag to reorder.\nRight-click to copy.`}
            >
              <button
                onClick={() => onSelectPattern(pattern.id)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-[3px] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 ${
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

      <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-700/60 px-[10px]">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <EditablePatternName pattern={currentPattern} onRename={onRenamePattern} />
          <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
            <button onClick={onUndo} disabled={!canUndo} className="p-2 rounded-full transition-colors disabled:text-gray-600 disabled:bg-transparent text-gray-300 hover:enabled:bg-gray-600" title={`Undo\n{Ctrl+Z}`}>
                <UndoIcon className="w-5 h-5"/>
            </button>
            <button onClick={onRedo} disabled={!canRedo} className="p-2 rounded-full transition-colors disabled:text-gray-600 disabled:bg-transparent text-gray-300 hover:enabled:bg-gray-600" title={`Redo\n{Ctrl+Y}`}>
                <RedoIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
        
        {/* Center Transport */}
        <div className="flex items-center gap-2">
           <button onClick={onStop} className={regularButtonClasses} aria-label="Stop" title={`SEQUENCER:\nStop playback and return to start`}>
              <StopIcon className="w-5 h-5" />
           </button>
           <button onClick={onPlayPause} className={primaryButtonClasses} aria-label={isPlaying ? 'Pause' : 'Play'} title={isPlaying ? 'Pause' : 'Play'}>
             {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
           </button>
           <button onClick={onPanic} className={dangerButtonClasses} aria-label="Panic: Stop all sound" title={`SEQUENCER:\nPanic:\nImmediately stop all sound`}>
             <PanicIcon className="w-5 h-5" />
           </button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
            <div className="bg-black/25 rounded-[3px] px-3 py-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
              <div className="font-mono text-sm leading-normal text-white tracking-wider" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>
                {timeDisplay}
              </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">BPM</span>
                <input type="number" value={bpm} onChange={e => onBpmChange(Number(e.target.value))} onWheel={handleBpmWheel} className="w-16 bg-gray-900 border border-gray-600 text-center rounded-[3px] p-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" title={`Tempo:\nSet precise BPM`}/>
            </div>
            <div className="flex items-center bg-gray-700 rounded-[3px] p-1">
                <button 
                    onClick={() => onTimeSignatureChange(currentPattern.id, '4/4')}
                    className={`px-3 py-1 text-sm font-semibold rounded-[3px] transition-colors ${currentPattern.timeSignature === '4/4' ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}
                >4/4</button>
                <button 
                    onClick={() => onTimeSignatureChange(currentPattern.id, '3/4')}
                    className={`px-3 py-1 text-sm font-semibold rounded-[3px] transition-colors ${currentPattern.timeSignature === '3/4' ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}
                >3/4</button>
            </div>
            <button onClick={() => onToggleBarMode(currentPattern.id)} className="px-3 py-1 text-sm font-semibold rounded-[3px] bg-gray-700 text-gray-300 hover:bg-gray-600" title={`Toggle pattern length\nbetween 4 and 8 bars`}>{currentPattern.bars === 8 ? '8 Bars' : '4 Bars'}</button>

            <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
              <span className="text-sm font-medium text-gray-400">Bass</span>
              <button onClick={() => onGenerateBass(basslineStyle)} className="px-3 py-1 text-sm font-semibold rounded-[3px] bg-indigo-600 text-white hover:bg-indigo-700">Generate</button>
            </div>
             <div className="flex items-center gap-2 pl-2 border-l border-gray-600">
                <button onClick={onToggleDrumsEnabled} className={`p-2 rounded-full transition-colors ${isDrumsEnabled ? 'bg-indigo-600 text-white' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`} title={`DRUMS:\nToggle Drums`}>
                    <MusicNoteIcon className="w-5 h-5"/>
                </button>
                <button onClick={onMetronomeToggle} className={`p-2 rounded-full transition-colors ${isMetronomeOn ? 'bg-indigo-600 text-white' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`} title={`METRONOME\nToggle Metronome`}>
                    <MetronomeIcon className="w-5 h-5"/>
                </button>
                <button onClick={onTogglePiano} className={`p-2 rounded-full transition-colors ${isPianoVisible ? 'bg-indigo-600 text-white' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`} title={`PIANO\nToggle Piano Keyboard`}><PianoIcon className="w-5 h-5"/></button>
                <button onClick={onToggleDrumEditor} className={`p-2 rounded-full transition-colors ${isDrumEditorOpen ? 'bg-indigo-600 text-white' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`} title={`DRUMS\nToggle Drum Editor`}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3.5a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5a.75.75 0 01.75-.75z"></path><path fillRule="evenodd" d="M9.59 10.51a.75.75 0 011.05-.14 8 8 0 014.28 7.37.75.75 0 01-1.48.24 6.5 6.5 0 00-11.76 0 .75.75 0 01-1.48-.24 8 8 0 014.28-7.37.75.75 0 01.14 1.05l-1.09 1.52a.75.75 0 01-1.2-.86l1.09-1.52z" clipRule="evenodd"></path></svg>
                </button>
                 <button onClick={onToggleChordMachine} className={`p-2 rounded-full transition-colors ${isChordMachineOpen ? 'bg-indigo-600 text-white' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`} title={`CHORD MACHINE\nToggle Chord Machine`}>
                    <ToolboxIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-600">
              <input type="range" min={-60} max={6} step={1} value={isMuted ? -60 : masterVolume} onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))} className="w-24 h-2 bg-gray-600 rounded-[3px] appearance-none cursor-pointer range-slider" aria-label="Master volume" title={`SEQUENCER:\nMaster Volume: ${masterVolume.toFixed(1)} dB`} disabled={isMuted}/>
              <button onClick={onMuteToggle} className={regularButtonClasses} aria-label={isMuted ? 'Unmute' : 'Mute'} title={`SEQUENCER:\n${isMuted ? 'Unmute All Audio' : 'Mute All Audio'}`}>
                {isMuted ? <SpeakerOffIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};