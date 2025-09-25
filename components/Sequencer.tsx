

import React, { useState, useRef, useCallback, MouseEvent, useEffect, useMemo } from 'react';
import { SequenceChord, SequenceBassNote, Articulation, ArpeggioRate, RhythmName, BassNoteType } from '../types';
import * as Tone from 'tone';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';
import { ArpeggioIcon } from './icons/ArpeggioIcon';
import { StrumIcon } from './icons/StrumIcon';
import { ArticulationEditor } from './ArticulationEditor';
import { RhythmIcon } from './icons/RhythmIcon';

interface SequencerProps {
  sequence: SequenceChord[];
  bassSequence: SequenceBassNote[];
  onAddChord: (chordName: string, start: number, octaveOverride?: number) => void;
  onUpdateChord: (id: string, newProps: Partial<SequenceChord>) => void;
  onRemoveChord: (id: string) => void;
  onChordDoubleClick: (chord: SequenceChord) => void;
  onPlayChord: (chord: SequenceChord) => void;
  onChordSelect: (id: string, e: MouseEvent) => void;
  onDeselect: () => void;
  onChordMouseUp: () => void;
  onInteraction: () => void;
  playheadPosition: number; // in beats
  playingChordId: string | null;
  playingBassNoteId: string | null;
  selectedChordIds: Set<string>;
  bars: 4 | 8;
  timeSignature: '4/4' | '3/4';
  onSeek: (positionInBeats: number) => void;
  isClickMuted: boolean;
  onMuteToggle: () => void;
  onWidthChange: (width: number) => void;
  isBasslineEnabled: boolean;
  onAddBassNote: (note: Omit<SequenceBassNote, 'id'>) => void;
  onUpdateBassNote: (id: string, updates: Partial<SequenceBassNote>) => void;
  onRemoveBassNote: (id: string) => void;
}

const DEFAULT_CHORD_DURATION = 4; // A quarter note (4 * 16th steps)
const TRACK_PADDING = 10; // horizontal padding in px
const RULER_HEIGHT = 24; // Corresponds to h-6 in tailwind
const CHORD_BLOCK_HEIGHT = 68;
const BASS_BLOCK_HEIGHT = 28;
const TRACK_VERTICAL_PADDING = 4;

const CHORD_TRACK_HEIGHT = 82;
const BASS_TRACK_HEIGHT = 40;


// A pure component for the playhead to help with rendering consistency.
const Playhead: React.FC<{ position: number; trackPadding: number, height: number, top: number }> = React.memo(({ position, trackPadding, height, top }) => (
    <div
        className="absolute w-0.5 bg-red-500 z-20 pointer-events-none"
        style={{
            left: `${position + trackPadding}px`,
            height: `${height}px`,
            top: `${top}px`,
        }}
    />
));
Playhead.displayName = 'Playhead';

// --- Bass Context Menu ---
interface BassContextMenuProps {
  x: number;
  y: number;
  note: SequenceBassNote;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<SequenceBassNote>) => void;
  onRemove: (id: string) => void;
}
const BassContextMenu: React.FC<BassContextMenuProps> = ({ x, y, note, onClose, onUpdate, onRemove }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (e: globalThis.MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSelect = (noteType: BassNoteType) => {
        onUpdate(note.id, { noteType });
        onClose();
    };

    const MenuItem: React.FC<{ onClick: () => void; children: React.ReactNode; isSelected?: boolean }> = ({ onClick, children, isSelected }) => (
        <button onMouseDown={onClick} className={`w-full text-left px-3 py-1.5 text-sm rounded-[4px] flex justify-between items-center ${isSelected ? 'font-bold text-white bg-indigo-600' : 'text-gray-200 hover:bg-gray-600'}`}>
            {children}
            {isSelected && <span className="text-sky-300">✓</span>}
        </button>
    );

    return (
        <div ref={menuRef} style={{ top: `${y}px`, left: `${x}px` }} className="fixed bg-gray-800 border border-gray-600 rounded-[4px] shadow-lg p-1 w-48 z-30 animate-fade-in-fast">
            <div className="text-xs text-gray-400 px-3 py-1 border-b border-gray-700 mb-1">Edit Bass Note</div>
            {(['root', 'third', 'fifth', 'seventh'] as BassNoteType[]).map(type => (
                <MenuItem key={type} onClick={() => handleSelect(type)} isSelected={note.noteType === type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
            ))}
            <div className="h-px bg-gray-700 my-1"/>
            <div className="px-3 py-1 text-sm text-gray-500 cursor-not-allowed">Velocity (soon)</div>
            <div className="px-3 py-1 text-sm text-gray-500 cursor-not-allowed">Effects (soon)</div>
            <div className="h-px bg-gray-700 my-1"/>
            <MenuItem onClick={() => { onRemove(note.id); onClose(); }}>Delete Note</MenuItem>
        </div>
    );
};


// --- BassBlock Component ---
interface BassBlockProps {
  note: SequenceBassNote;
  stepWidth: number;
  stepsPerLane: number;
  isPlaying: boolean;
  onDragStart: (note: SequenceBassNote, isResizing: boolean, e: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu: (e: React.MouseEvent, note: SequenceBassNote) => void;
}
const BassBlock: React.FC<BassBlockProps> = ({ note, stepWidth, stepsPerLane, isPlaying, onDragStart, onContextMenu }) => {
  const startInLanePx = (note.start % stepsPerLane) * stepWidth;
  const widthPx = note.duration * stepWidth;

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const isResizeHandle = target.classList.contains('resize-handle');
    onDragStart(note, isResizeHandle, e);
  }, [note, onDragStart]);

  const noteTypeLabel = note.noteType.charAt(0).toUpperCase() + note.noteType.slice(1);

  return (
    <div
      data-has-context-menu="true"
      className={`absolute rounded-[4px] flex items-center justify-center text-white text-xs font-medium select-none shadow-md transition-colors duration-150 z-10 border
        ${isPlaying ? 'bg-sky-400 border-sky-200' : 'bg-blue-500 border-sky-300'}
        cursor-grab active:cursor-grabbing
      `}
      style={{
        bottom: `${TRACK_VERTICAL_PADDING}px`,
        left: `${startInLanePx + TRACK_PADDING}px`,
        width: `${widthPx}px`,
        height: `${BASS_BLOCK_HEIGHT}px`,
        touchAction: 'none',
      }}
      title={`${noteTypeLabel} Note`}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => onContextMenu(e, note)}
    >
      <span className="truncate px-2 pointer-events-none">{noteTypeLabel}</span>
      <div className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize" />
    </div>
  );
};


// --- ChordBlock Component ---
interface ChordBlockProps {
  chord: SequenceChord;
  stepWidth: number;
  stepsPerLane: number;
  onRemove: (id: string) => void;
  onDoubleClick: (chord: SequenceChord) => void;
  onPlayChord: (chord: SequenceChord) => void;
  onChordSelect: (id: string, e: MouseEvent<HTMLDivElement>) => void;
  onChordMouseUp: () => void;
  playingChordId: string | null;
  isSelected: boolean;
  isClickMuted: boolean;
  onDragStart: (chord: SequenceChord, isResizing: boolean, e: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu: (e: React.MouseEvent, chord: SequenceChord) => void;
  onIconClick: (e: React.MouseEvent, chord: SequenceChord) => void;
}

const ChordBlock: React.FC<ChordBlockProps> = ({ 
  chord, stepWidth, stepsPerLane, onRemove, onDoubleClick, onPlayChord, onChordSelect, onChordMouseUp, 
  playingChordId, isSelected, isClickMuted, onDragStart, onContextMenu, onIconClick
}) => {
  const isCurrentlyPlaying = chord.id === playingChordId;
  const hasArticulation = !!chord.articulation;

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    
    if ((e.target as HTMLElement).closest('.articulation-icon-btn')) return;

    onChordSelect(chord.id, e);
    if (!isClickMuted) {
      onPlayChord(chord);
    }
    
    const target = e.target as HTMLElement;
    const isResizeHandle = target.classList.contains('resize-handle');
    onDragStart(chord, isResizeHandle, e);

  }, [chord, onChordSelect, onPlayChord, onDragStart, isClickMuted]);

  const startInLanePx = (chord.start % stepsPerLane) * stepWidth;
  const widthPx = chord.duration * stepWidth;

  return (
    <div
      data-has-context-menu="true"
      className={`absolute rounded-[4px] flex items-center justify-center text-white text-xs font-medium select-none shadow-lg transition-colors duration-150 z-10 chord-block border
        ${isSelected ? 'bg-indigo-400 border-yellow-400' : 'bg-indigo-300 border-indigo-500'}
        ${isCurrentlyPlaying ? 'ring-2 ring-yellow-300' : ''}
        cursor-grab active:cursor-grabbing
      `}
      style={{
        bottom: `${TRACK_VERTICAL_PADDING}px`,
        left: `${startInLanePx + TRACK_PADDING}px`,
        width: `${widthPx}px`,
        height: `${CHORD_BLOCK_HEIGHT}px`,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={onChordMouseUp}
      onDoubleClick={() => onDoubleClick(chord)}
      onContextMenu={(e) => onContextMenu(e, chord)}
      title={`${chord.chordName}\nDrag to move.\nDrag edge to resize.\nHold {Ctrl} for precision.\nRight-click for options.`}
    >
      {hasArticulation && (
        <button 
          className="articulation-icon-btn absolute top-1 left-1 p-0.5 rounded-full hover:bg-black/30"
          onClick={(e) => onIconClick(e, chord)}
          title="Edit Articulation"
        >
          {chord.articulation?.type === 'arpeggio' && <ArpeggioIcon className="w-4 h-4 text-sky-200" />}
          {chord.articulation?.type === 'strum' && <StrumIcon className="w-4 h-4 text-sky-200" />}
          {chord.articulation?.type === 'rhythm' && <RhythmIcon className="w-4 h-4 text-sky-200" />}
        </button>
      )}
      <span className="truncate px-2 pointer-events-none">{chord.chordName}</span>
      <div className={`resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize`} />
    </div>
  );
};


// --- Chord Context Menu Component ---
interface ContextMenuProps {
  x: number;
  y: number;
  chord: SequenceChord;
  onClose: () => void;
  onSetArticulation: (id: string, articulation: Articulation | null) => void;
  onRemove: (id: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, chord, onClose, onSetArticulation, onRemove }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);


  const menuStyle: React.CSSProperties = { top: `${y}px`, left: `${x}px`, };

  const handleSelect = (articulation: Articulation | null) => {
    onSetArticulation(chord.id, articulation);
    onClose();
  };
  
  const RHYTHM_PRESETS: { name: string, value: RhythmName }[] = [
      { name: "8th Pulse", value: 'eighths'},
      { name: "Push", value: 'push'},
      { name: "Tresillo", value: 'tresillo'},
      { name: "Charleston", value: 'charleston'},
  ];

  const MenuItem: React.FC<{ onMouseDown: () => void; children: React.ReactNode; isSelected?: boolean }> = ({ onMouseDown, children, isSelected }) => (
    <button onMouseDown={onMouseDown} className={`w-full text-left px-3 py-1.5 text-sm rounded-[4px] flex justify-between items-center ${isSelected ? 'font-bold text-white bg-indigo-600' : 'text-gray-200 hover:bg-gray-600'}`}>
        {children}
        {isSelected && <span className="text-sky-300">✓</span>}
    </button>
  );

  return (
    <div ref={menuRef} style={menuStyle} className="fixed bg-gray-800 border border-gray-600 rounded-[4px] shadow-lg p-1 w-48 z-30 animate-fade-in-fast">
        <div className="text-xs text-gray-400 px-3 py-1 border-b border-gray-700 mb-1 truncate">{chord.chordName}</div>
        <div className="px-3 py-1.5 text-sm text-gray-200">
          <span>Arpeggio</span>
          <div className="flex items-center justify-end gap-1 mt-1">
            {(['8n', '16n', '32n'] as ArpeggioRate[]).map(rate => (
              <button
                key={rate}
                onMouseDown={() => handleSelect({ type: 'arpeggio', rate, direction: 'up', gate: 0.95, mode: 'note', strumSpeed: 0.5 })}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  chord.articulation?.type === 'arpeggio' && chord.articulation.rate === rate
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {rate.replace('n', 'th')}
              </button>
            ))}
          </div>
        </div>
        <MenuItem onMouseDown={() => handleSelect({ type: 'strum', direction: 'up', speed: 0.5 })} isSelected={chord.articulation?.type === 'strum'}>Strumming</MenuItem>
        <div className="h-px bg-gray-700 my-1"/>
        <div className="px-3 pt-1.5 pb-1 text-sm text-gray-200">Rhythms</div>
        {RHYTHM_PRESETS.map(preset => (
            <MenuItem key={preset.value} onMouseDown={() => handleSelect({ type: 'rhythm', name: preset.value, gate: 0.9 })} isSelected={chord.articulation?.type === 'rhythm' && chord.articulation.name === preset.value}>
                {preset.name}
            </MenuItem>
        ))}
        <div className="h-px bg-gray-700 my-1"/>
        <MenuItem onMouseDown={() => handleSelect(null)} isSelected={!chord.articulation}>None</MenuItem>
        <div className="h-px bg-gray-700 my-1"/>
        <MenuItem onMouseDown={() => { onRemove(chord.id); onClose(); }}>Delete Chord</MenuItem>
    </div>
  );
};


// --- Sequencer Component ---
export const Sequencer: React.FC<SequencerProps> = ({
  sequence, bassSequence, onAddChord, onUpdateChord, onRemoveChord, onChordDoubleClick,
  onPlayChord, onChordSelect, onDeselect, onChordMouseUp, onInteraction, playheadPosition, 
  playingChordId, playingBassNoteId, selectedChordIds, bars, timeSignature, onSeek, isClickMuted, onMuteToggle,
  onWidthChange, isBasslineEnabled, onAddBassNote, onUpdateBassNote, onRemoveBassNote
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: SequenceChord | SequenceBassNote; type: 'chord' | 'bass' } | null>(null);
  const [editingArticulationId, setEditingArticulationId] = useState<{ chordId: string; anchorEl: HTMLElement } | null>(null);
  const dragInfoRef = useRef<{
      id: string;
      type: 'chord' | 'bass';
      isResizing: boolean;
      startX: number;
      originalStart: number;
      originalDuration: number;
      precise: boolean;
      ghostElement: HTMLDivElement | null;
  } | null>(null);
  const creationInfoRef = useRef<{
      startStep: number;
      startX: number;
      ghostElement: HTMLDivElement | null;
  } | null>(null);

  const is8BarMode = bars === 8;
  const STEPS_PER_BAR = timeSignature === '4/4' ? 16 : 12;
  const BEATS_PER_BAR = timeSignature === '4/4' ? 4 : 3;
  const SUBDIVISION = 4; // 16th notes per beat
  const TOTAL_STEPS = bars * STEPS_PER_BAR;
  const BEAT_COUNT = bars * BEATS_PER_BAR;

  useEffect(() => {
    const calculateWidth = (entries: ResizeObserverEntry[]) => {
        if (entries[0]) {
            const newWidth = entries[0].contentRect.width;
            setContainerWidth(newWidth);
            onWidthChange(newWidth);
        }
    };
    const resizeObserver = new ResizeObserver(calculateWidth);
    const currentContainer = containerRef.current;
    if (currentContainer) {
        setContainerWidth(currentContainer.offsetWidth);
        onWidthChange(currentContainer.offsetWidth);
        resizeObserver.observe(currentContainer);
    }
    return () => {
        if (currentContainer) resizeObserver.unobserve(currentContainer);
    };
  }, [onWidthChange]);

  const stepsPerLane = STEPS_PER_BAR * 4;
  const gridWidth = containerWidth > 0 ? containerWidth - (TRACK_PADDING * 2) : 0;
  const stepWidth = gridWidth / stepsPerLane;
  const beatWidth = stepWidth * SUBDIVISION;
  const barWidth = beatWidth * BEATS_PER_BAR;

  const getStepFromX = (x: number, laneIndex: 0 | 1): number => {
      const xInGrid = x - (containerRef.current?.getBoundingClientRect().left ?? 0) - TRACK_PADDING;
      const stepInLane = Math.floor(xInGrid / stepWidth);
      const totalStep = (laneIndex * stepsPerLane) + stepInLane;
      return Math.max(0, Math.min(TOTAL_STEPS - 1, totalStep));
  };
  
  const handleChordDragStart = (chord: SequenceChord, isResizing: boolean, e: React.MouseEvent<HTMLDivElement>) => {
      dragInfoRef.current = { id: chord.id, type: 'chord', isResizing, startX: e.clientX, originalStart: chord.start, originalDuration: chord.duration, precise: e.ctrlKey || e.metaKey, ghostElement: null };
      document.body.style.cursor = isResizing ? 'ew-resize' : 'grabbing';
  };
  
  const handleBassDragStart = (note: SequenceBassNote, isResizing: boolean, e: React.MouseEvent<HTMLDivElement>) => {
      dragInfoRef.current = { id: note.id, type: 'bass', isResizing, startX: e.clientX, originalStart: note.start, originalDuration: note.duration, precise: e.ctrlKey || e.metaKey, ghostElement: null };
      document.body.style.cursor = isResizing ? 'ew-resize' : 'grabbing';
  };

  const handleBassTrackMouseDown = (e: MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0 || stepWidth <= 0 || (e.target as HTMLElement).closest('[data-has-context-menu="true"]')) return;
      
      const laneIndex = Number((e.currentTarget as HTMLElement).dataset.lane) as 0 | 1;
      const startStep = getStepFromX(e.clientX, laneIndex);

      creationInfoRef.current = { startStep, startX: e.clientX, ghostElement: null };
      document.body.style.cursor = 'crosshair';
  };
  
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (stepWidth <= 0) return;

      if (creationInfoRef.current) {
          const { startStep, startX } = creationInfoRef.current;
          const currentX = e.clientX;
          const dx = currentX - startX;
          const duration = Math.max(1, Math.round(dx / stepWidth));

          // Lazily create and update ghost element
          if (!creationInfoRef.current.ghostElement) {
              const ghost = document.createElement('div');
              ghost.className = 'absolute bg-blue-500/30 rounded-[4px] pointer-events-none z-20';
              ghost.style.bottom = `${TRACK_VERTICAL_PADDING}px`;
              ghost.style.height = `${BASS_BLOCK_HEIGHT}px`;
              
              const laneIndex = Math.floor(startStep / stepsPerLane);
              const laneElement = containerRef.current?.parentElement?.querySelector(`[data-lane-type="bass"][data-lane-index="${laneIndex}"]`);
              laneElement?.appendChild(ghost);
              creationInfoRef.current.ghostElement = ghost;
          }

          const ghost = creationInfoRef.current.ghostElement;
          if(ghost) {
            ghost.style.left = `${(startStep % stepsPerLane) * stepWidth + TRACK_PADDING}px`;
            ghost.style.width = `${duration * stepWidth}px`;
          }
      } else if (dragInfoRef.current) {
          const { id, type, isResizing, startX, originalStart, originalDuration, precise } = dragInfoRef.current;
          const dx = e.clientX - startX;
          let dxInSteps = dx / stepWidth;
          if (!precise) dxInSteps = Math.round(dxInSteps);

          if (isResizing) {
              const newDuration = Math.max(1, originalDuration + dxInSteps);
              const maxDuration = TOTAL_STEPS - originalStart;
              const finalDuration = Math.min(newDuration, maxDuration);
              if(type === 'chord') onUpdateChord(id, { duration: finalDuration });
              else onUpdateBassNote(id, { duration: finalDuration });
          } else {
              const newStart = originalStart + dxInSteps;
              const maxStart = TOTAL_STEPS - (type === 'chord' ? sequence.find(c=>c.id === id)!.duration : bassSequence.find(b=>b.id === id)!.duration);
              const finalStart = Math.max(0, Math.min(newStart, maxStart));
              if(type === 'chord') onUpdateChord(id, { start: finalStart });
              else onUpdateBassNote(id, { start: finalStart });
          }
      }
    };

    const handleMouseUp = (e: globalThis.MouseEvent) => {
      if (creationInfoRef.current) {
          const { startStep, startX, ghostElement } = creationInfoRef.current;
          const dx = e.clientX - startX;
          const duration = Math.max(1, Math.round(dx / stepWidth));
          
          onAddBassNote({ start: startStep, duration, noteType: 'root', velocity: 1 });
          
          ghostElement?.remove();
          creationInfoRef.current = null;
      }

      if (dragInfoRef.current) {
          const { id, type, originalStart, originalDuration } = dragInfoRef.current;
          const currentItem = type === 'chord' ? sequence.find(c => c.id === id) : bassSequence.find(b => b.id === id);
          if (currentItem && (currentItem.start !== originalStart || currentItem.duration !== originalDuration) && !dragInfoRef.current.precise) {
              const finalStart = Math.round(currentItem.start);
              const finalDuration = Math.round(currentItem.duration);
              if (type === 'chord') onUpdateChord(id, { start: finalStart, duration: finalDuration });
              else onUpdateBassNote(id, { start: finalStart, duration: finalDuration });
          }
          dragInfoRef.current = null;
      }
      document.body.style.cursor = 'default';
      onChordMouseUp();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stepWidth, onUpdateChord, onAddBassNote, onUpdateBassNote, TOTAL_STEPS, sequence, bassSequence, onChordMouseUp, stepsPerLane]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "copy";
    if (stepWidth === 0) return;
    const target = e.currentTarget as HTMLDivElement;
    const lane = Number(target.dataset.lane) || 0;
    const ghostBlock = containerRef.current?.parentElement?.querySelector(`#ghost-block-chord`);
    if(!ghostBlock || !(ghostBlock instanceof HTMLElement)) return;

    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;
    const stepInLane = Math.floor(x / stepWidth);
    const clampedStep = Math.max(0, Math.min(stepsPerLane - DEFAULT_CHORD_DURATION, stepInLane));
    
    ghostBlock.style.display = 'block';
    ghostBlock.style.left = `${clampedStep * stepWidth + TRACK_PADDING}px`;
    ghostBlock.style.width = `${DEFAULT_CHORD_DURATION * stepWidth}px`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const ghostBlock = containerRef.current?.parentElement?.querySelector(`#ghost-block-chord`);
    if(ghostBlock && ghostBlock instanceof HTMLElement) ghostBlock.style.display = 'none';
    if (stepWidth === 0) return;

    const target = e.currentTarget as HTMLDivElement;
    const lane = Number(target.dataset.lane) || 0;
    const stepInLane = getStepFromX(e.clientX, lane as 0 | 1) % stepsPerLane;
    const totalStep = (lane * stepsPerLane) + stepInLane;
    const dropStep = Math.max(0, Math.min(TOTAL_STEPS - DEFAULT_CHORD_DURATION, totalStep));

    const jsonData = e.dataTransfer.getData("text/plain");
    if (jsonData) {
      try {
        const data = JSON.parse(jsonData);
        if (data.chordName && typeof data.chordName === 'string') {
          onAddChord(data.chordName, dropStep, data.octave);
        }
      } catch (error) { console.error("Failed to parse dropped data:", error); }
    }
  };
  
  const handleContainerDragLeave = () => {
    const ghostBlock = containerRef.current?.parentElement?.querySelector(`#ghost-block-chord`);
    if(ghostBlock && ghostBlock instanceof HTMLElement) ghostBlock.style.display = 'none';
  };
  
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('[data-has-context-menu="true"]')) {
      onDeselect();
    }
    if (stepWidth <= 0 || (e.target as HTMLElement).closest('[data-has-context-menu="true"]')) return;

    const lane = Number(e.currentTarget.dataset.lane) || 0;
    const positionInSteps = getStepFromX(e.clientX, lane as 0|1);
    onSeek(Math.max(0, Math.min(BEAT_COUNT, positionInSteps / SUBDIVISION)));
  };

  const handleContextMenu = (e: React.MouseEvent, item: SequenceChord | SequenceBassNote, type: 'chord' | 'bass') => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
    setEditingArticulationId(null);
  };
  
  const handleIconClick = (e: React.MouseEvent, chord: SequenceChord) => {
      e.stopPropagation();
      setEditingArticulationId({ chordId: chord.id, anchorEl: e.currentTarget as HTMLElement });
      setContextMenu(null);
  };

  const handleSetArticulation = (id: string, articulation: Articulation | null) => onUpdateChord(id, { articulation });

  const renderGrid = (height: number) => (
    <div className="absolute inset-0 pointer-events-none" style={{ left: `${TRACK_PADDING}px`, right: `${TRACK_PADDING}px`, height: `${height}px` }}>
       {Array.from({ length: stepsPerLane }).map((_, i) => {
          const isBeat = i % SUBDIVISION === 0;
          let borderColorClass = i % STEPS_PER_BAR === 0 ? 'border-gray-600' : isBeat ? 'border-gray-700' : 'border-gray-800';
          return <div key={`sub-${i}`} className={`absolute top-0 bottom-0 border-l ${borderColorClass}`} style={{ left: `${i * stepWidth}px` }} />;
        })}
       {Array.from({ length: 5 }).map((_, i) => (
          <div key={`barline-${i}`} className="absolute top-0 bottom-0 border-l-2 border-gray-500" style={{ left: `${i * barWidth}px` }}/>
        ))}
    </div>
  );

  const renderRuler = (barOffset = 0) => (
    <div 
      className="flex h-6 items-end cursor-default flex-grow"
      style={{ paddingLeft: `${TRACK_PADDING}px`, paddingRight: `${TRACK_PADDING}px` }}
      onClick={handleTrackClick}
      data-lane={barOffset > 0 ? 1 : 0}
      title={`SEQUENCER:\nClick to position playhead`}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`bar-${i}`} style={{ width: `${barWidth}px` }} className="text-xs text-gray-500 border-l border-gray-600 pl-1">
          {i + 1 + barOffset}
        </div>
      ))}
    </div>
  );
  
  const chordForArticulationEditor = useMemo(() => {
    if (!editingArticulationId) return null;
    return sequence.find(c => c.id === editingArticulationId.chordId);
  }, [editingArticulationId, sequence]);

  const renderSequencerLane = (laneIndex: 0 | 1) => {
    const barOffset = laneIndex * 4;

    const totalTrackHeight = RULER_HEIGHT + CHORD_TRACK_HEIGHT + (isBasslineEnabled ? BASS_TRACK_HEIGHT + 24 : 24);
    const playheadHeight = RULER_HEIGHT + CHORD_TRACK_HEIGHT + (isBasslineEnabled ? BASS_TRACK_HEIGHT : 0);

    return (
      <div className='relative bg-gray-800' ref={laneIndex === 0 ? containerRef : null}>
        <div className="relative flex items-center">
            {renderGrid(RULER_HEIGHT)}
            {renderRuler(barOffset)}
            {laneIndex === 0 && (
                <button
                    onClick={onMuteToggle}
                    title={`SEQUENCER:\n${isClickMuted ? "Unmute chord click" : "Mute chord click"}`}
                    className="absolute h-6 w-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    style={{ right: '1px', top: '50%', transform: 'translateY(calc(-50% + 2px))' }}
                >
                    {isClickMuted ? <SpeakerOffIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                </button>
            )}
        </div>
        {/* Chords Track */}
        <div 
            data-lane={laneIndex}
            className="relative w-full bg-gray-900/50"
            style={{ height: `${CHORD_TRACK_HEIGHT}px` }}
            onDragOver={handleDragOver} onDrop={handleDrop}
            onClick={handleTrackClick}
            title={`SEQUENCER:\nDrag chords here, or click to position the playhead.`}
        >
            {renderGrid(CHORD_TRACK_HEIGHT)}
            {sequence.filter(c => Math.floor(c.start / stepsPerLane) === laneIndex).map(chord => (
                <ChordBlock 
                  key={chord.id} chord={chord} stepWidth={stepWidth} stepsPerLane={stepsPerLane}
                  onRemove={onRemoveChord} onDoubleClick={onChordDoubleClick} onPlayChord={onPlayChord}
                  onChordSelect={onChordSelect} onChordMouseUp={onChordMouseUp} playingChordId={playingChordId} 
                  isSelected={selectedChordIds.has(chord.id)} isClickMuted={isClickMuted}
                  onDragStart={handleChordDragStart} onContextMenu={(e, c) => handleContextMenu(e, c, 'chord')} onIconClick={handleIconClick}
                />
            ))}
            <div id="ghost-block-chord" className="absolute bg-indigo-500/30 rounded-[4px] pointer-events-none" style={{ display: 'none', height: `${CHORD_BLOCK_HEIGHT}px`, bottom: `${TRACK_VERTICAL_PADDING}px` }} />
        </div>
         {/* Bass Track */}
         {isBasslineEnabled && (
            <div
                data-lane-type="bass"
                data-lane-index={laneIndex}
                data-lane={laneIndex}
                className="relative w-full bg-gray-900/50"
                style={{ height: `${BASS_TRACK_HEIGHT}px` }}
                onMouseDown={handleBassTrackMouseDown}
                onClick={handleTrackClick}
                title="Click and drag to create bass notes. Right-click a note for options."
            >
                {renderGrid(BASS_TRACK_HEIGHT)}
                {bassSequence.filter(n => Math.floor(n.start / stepsPerLane) === laneIndex).map(note => (
                    <BassBlock
                        key={note.id} note={note} stepWidth={stepWidth} stepsPerLane={stepsPerLane}
                        isPlaying={note.id === playingBassNoteId}
                        onDragStart={handleBassDragStart} onContextMenu={(e, n) => handleContextMenu(e, n, 'bass')}
                    />
                ))}
            </div>
         )}
         <div className="h-[24px] bg-gray-800" />
      </div>
    );
  };
  
  const playheadLane = is8BarMode && playheadPosition >= (BEATS_PER_BAR * 4) ? 1 : 0;
  const playheadLeftInLane = (playheadPosition % (BEATS_PER_BAR * 4)) * beatWidth;
  const playheadHeight = RULER_HEIGHT + CHORD_TRACK_HEIGHT + (isBasslineEnabled ? BASS_TRACK_HEIGHT : 0);
  const timeDisplay = useMemo(() => {
    const stepsPerBar = timeSignature === '4/4' ? 16 : 12;
    if (!stepsPerBar) return "01:1:1";
    const totalSixteenths = Math.floor(playheadPosition * 4);
    const bar = Math.floor(totalSixteenths / stepsPerBar) + 1;
    const beat = Math.floor((totalSixteenths % stepsPerBar) / 4) + 1;
    const sixteenth = (totalSixteenths % 4) + 1;
// FIX: Changed String(bar) to bar.toString() to avoid a "not callable" error, which can occur if the global 'String' identifier is shadowed or misinterpreted.
    return `${bar.toString().padStart(2, '0')}:${beat}:${sixteenth}`;
  }, [playheadPosition, timeSignature]);

  return (
    <div 
      className="w-full flex flex-col min-w-[600px] relative" 
      onClick={(e) => { if (e.target === e.currentTarget) onDeselect(); }}
      onDragLeave={handleContainerDragLeave}
    >
       <style>{`
        @keyframes fade-in-fast { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-fast { animation: fade-in-fast 0.1s ease-out forwards; }
      `}</style>
      
      {renderSequencerLane(0)}
      {is8BarMode && renderSequencerLane(1)}
      
      {sequence.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-600 font-semibold pointer-events-none text-center" style={{ top: '65px' }}>
            Drag a chord from the side panel to start
          </div>
      )}
      
      {stepWidth > 0 && playheadLeftInLane <= gridWidth && (
          <Playhead 
            position={playheadLeftInLane} 
            trackPadding={TRACK_PADDING} 
            height={playheadHeight} 
            top={playheadLane === 1 ? (CHORD_TRACK_HEIGHT + BASS_TRACK_HEIGHT + RULER_HEIGHT + 24) : 0} 
          />
      )}

       {contextMenu && (
          contextMenu.type === 'chord' ?
            <ContextMenu x={contextMenu.x} y={contextMenu.y} chord={contextMenu.item as SequenceChord} onClose={() => setContextMenu(null)} onSetArticulation={handleSetArticulation} onRemove={onRemoveChord} />
          : <BassContextMenu x={contextMenu.x} y={contextMenu.y} note={contextMenu.item as SequenceBassNote} onClose={() => setContextMenu(null)} onUpdate={onUpdateBassNote} onRemove={onRemoveBassNote} />
      )}
      {editingArticulationId && chordForArticulationEditor && (
        <ArticulationEditor
            anchorEl={editingArticulationId.anchorEl}
            chord={chordForArticulationEditor}
            onClose={() => setEditingArticulationId(null)}
            onUpdate={(articulation) => onUpdateChord(editingArticulationId.chordId, { articulation })}
        />
      )}
    </div>
  );
};