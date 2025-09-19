import React, { useState, useRef, useCallback, MouseEvent, useEffect, useMemo } from 'react';
import { SequenceChord, SequenceBassNote } from '../types';
import * as Tone from 'tone';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';

interface SequencerProps {
  sequence: SequenceChord[];
  bassSequence: SequenceBassNote[];
  onAddChord: (chordName: string, start: number) => void;
  onUpdateChord: (id: string, newProps: Partial<SequenceChord>) => void;
  onRemoveChord: (id: string) => void;
  onChordDoubleClick: (chord: SequenceChord) => void;
  onPlayChord: (chordName: string) => void;
  onChordSelect: (id: string, e: MouseEvent) => void;
  onDeselect: () => void;
  onChordMouseUp: () => void;
  playheadPosition: number; // in beats
  playingChordId: string | null;
  playingBassNoteId: string | null;
  selectedChordIds: Set<string>;
  bars: 4 | 8;
  timeSignature: '4/4' | '3/4';
  onSeek: (positionInBeats: number) => void;
  isClickMuted: boolean;
  onMuteToggle: () => void;
}

const DEFAULT_CHORD_DURATION = 8; // A half note (8 * 16th steps)
const TRACK_PADDING = 10; // horizontal padding in px
const RULER_HEIGHT = 24; // Corresponds to h-6 in tailwind
const CHORD_BLOCK_HEIGHT = 68; // 10px taller
const BASS_BLOCK_HEIGHT = 28;
const TRACK_VERTICAL_PADDING = 4; // Reduced padding for more chord height

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

// --- BassBlock Component ---
interface BassBlockProps {
  note: SequenceBassNote;
  stepWidth: number;
  stepsPerLane: number;
  isPlaying: boolean;
}
const BassBlock: React.FC<BassBlockProps> = ({ note, stepWidth, stepsPerLane, isPlaying }) => {
  const startInLanePx = (note.start % stepsPerLane) * stepWidth;
  const widthPx = note.duration * stepWidth;

  return (
    <div
      className={`absolute rounded-[2px] flex items-center justify-center text-white text-xs font-medium select-none shadow-md transition-colors duration-150 z-10 border
        ${isPlaying ? 'bg-green-500 border-green-300' : 'bg-green-700 border-green-500'}
        cursor-default
      `}
      style={{
        bottom: `${TRACK_VERTICAL_PADDING}px`,
        left: `${startInLanePx + TRACK_PADDING}px`,
        width: `${widthPx}px`,
        height: `${BASS_BLOCK_HEIGHT}px`,
        touchAction: 'none',
      }}
      title={note.noteName}
    >
      <span className="truncate px-2 pointer-events-none">{note.noteName}</span>
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
  onPlayChord: (chordName: string) => void;
  onChordSelect: (id: string, e: MouseEvent<HTMLDivElement>) => void;
  onChordMouseUp: () => void;
  playingChordId: string | null;
  isSelected: boolean;
  isClickMuted: boolean;
  onDragStart: (chord: SequenceChord, isResizing: boolean, e: React.MouseEvent<HTMLDivElement>) => void;
}

const ChordBlock: React.FC<ChordBlockProps> = ({ 
  chord, stepWidth, stepsPerLane, onRemove, onDoubleClick, onPlayChord, onChordSelect, onChordMouseUp, 
  playingChordId, isSelected, isClickMuted, onDragStart 
}) => {
  const isCurrentlyPlaying = chord.id === playingChordId;

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    
    onChordSelect(chord.id, e);
    if (!isClickMuted) {
      onPlayChord(chord.chordName);
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
      className={`absolute rounded-[3px] flex items-center justify-center text-white text-xs font-medium select-none shadow-lg transition-colors duration-150 z-10 chord-block border
        ${isSelected ? 'bg-indigo-500 border-yellow-400' : 'bg-indigo-600 border-indigo-400'}
        ${isCurrentlyPlaying ? 'ring-2 ring-sky-400' : ''}
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
      onMouseUp={onChordMouseUp} // Stop sound on simple click-release
      onDoubleClick={() => onDoubleClick(chord)}
      title={`${chord.chordName}\nDrag to move.\nDrag edge to resize.\nHold {Ctrl} for precision.\nDouble-click to edit.\nSelect and press Delete or Backspace to remove.`}
    >
      <span className="truncate px-2 pointer-events-none">{chord.chordName}</span>
      <div className={`resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize`} />
    </div>
  );
};


// --- Sequencer Component ---
export const Sequencer: React.FC<SequencerProps> = ({
  sequence, bassSequence, onAddChord, onUpdateChord, onRemoveChord, onChordDoubleClick,
  onPlayChord, onChordSelect, onDeselect, onChordMouseUp, playheadPosition, 
  playingChordId, playingBassNoteId, selectedChordIds, bars, timeSignature, onSeek, isClickMuted, onMuteToggle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOverStep, setDragOverStep] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [draggingState, setDraggingState] = useState<{
      id: string;
      start: number;
      duration: number;
      isResizing: boolean;
      startX: number;
      originalStart: number;
      originalDuration: number;
  } | null>(null);
  const wasEverPreciseRef = useRef(false);

  const is8BarMode = bars === 8;
  const STEPS_PER_BAR = timeSignature === '4/4' ? 16 : 12;
  const BEATS_PER_BAR = timeSignature === '4/4' ? 4 : 3;
  const SUBDIVISION = 4; // 16th notes per beat

  const BAR_COUNT = bars;
  const TOTAL_STEPS = BAR_COUNT * STEPS_PER_BAR;
  const BEAT_COUNT = BAR_COUNT * BEATS_PER_BAR;
  
  const hasBass = bassSequence.length > 0;
  const playheadHeight = hasBass ? CHORD_TRACK_HEIGHT + BASS_TRACK_HEIGHT : CHORD_TRACK_HEIGHT;

  useEffect(() => {
    const calculateWidth = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    calculateWidth();
    const resizeObserver = new ResizeObserver(calculateWidth);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const stepsPerLane = STEPS_PER_BAR * 4;
  const gridWidth = containerWidth > 0 ? containerWidth - (TRACK_PADDING * 2) : 0;
  const stepWidth = gridWidth / stepsPerLane;
  const beatWidth = stepWidth * SUBDIVISION;
  const barWidth = beatWidth * BEATS_PER_BAR;

  const handleDragStart = useCallback((chord: SequenceChord, isResizing: boolean, e: React.MouseEvent<HTMLDivElement>) => {
      wasEverPreciseRef.current = e.ctrlKey;
      setDraggingState({
          id: chord.id,
          start: chord.start,
          duration: chord.duration,
          isResizing,
          startX: e.clientX,
          originalStart: chord.start,
          originalDuration: chord.duration,
      });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
        if (!draggingState || stepWidth <= 0) return;
        e.preventDefault();

        if (e.ctrlKey) {
            wasEverPreciseRef.current = true;
        }

        const dx = e.clientX - draggingState.startX;
        const dxInSteps = dx / stepWidth;
        
        if (draggingState.isResizing) {
            const newDuration = draggingState.originalDuration + dxInSteps;
            const finalDuration = Math.max(1, Math.min(TOTAL_STEPS - draggingState.originalStart, newDuration));
            setDraggingState(prev => prev ? { ...prev, duration: finalDuration } : null);
        } else { // Moving
            const newStart = draggingState.originalStart + dxInSteps;
            const maxStart = TOTAL_STEPS - draggingState.originalDuration; // Bug fix: use originalDuration
            const finalStart = Math.max(0, Math.min(maxStart, newStart));
            setDraggingState(prev => prev ? { ...prev, start: finalStart } : null);
        }
    };

    const handleMouseUp = () => {
        if (!draggingState) return;
        
        let { id, start, duration, originalStart, originalDuration } = draggingState;
        
        if (!wasEverPreciseRef.current) {
            start = Math.round(start);
            duration = Math.round(duration);
        }

        if (start !== originalStart || duration !== originalDuration) {
            onUpdateChord(id, { start, duration });
        }
        
        onChordMouseUp();
        setDraggingState(null);
        wasEverPreciseRef.current = false;
    };

    if (draggingState) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingState, stepWidth, onUpdateChord, TOTAL_STEPS, onChordMouseUp]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (stepWidth === 0) return;
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;

    const stepInLane = Math.floor(x / stepWidth);
    const lane = Number(target.dataset.lane) || 0;
    const baseStep = lane * stepsPerLane;
    const totalStep = baseStep + stepInLane;

    setDragOverStep(Math.max(0, Math.min(TOTAL_STEPS - DEFAULT_CHORD_DURATION, totalStep)));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const chordName = e.dataTransfer.getData("text/plain");
    if (chordName && dragOverStep !== null) {
      onAddChord(chordName, dragOverStep);
    }
    setDragOverStep(null);
  };
  
  const handleDragLeave = () => setDragOverStep(null);
  
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('.chord-block')) {
      onDeselect();
    }
    if (stepWidth <= 0 || (e.target as HTMLElement).closest('.chord-block')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;
    const lane = Number(e.currentTarget.dataset.lane) || 0;
    
    const positionInSteps = (lane * stepsPerLane) + (x / stepWidth);
    const positionInBeats = positionInSteps / SUBDIVISION;
    
    onSeek(Math.max(0, Math.min(BEAT_COUNT, positionInBeats)));
  }, [stepWidth, onSeek, BEAT_COUNT, stepsPerLane, onDeselect]);

  const beatsPerLane = BEATS_PER_BAR * 4;
  const playheadLane = is8BarMode && playheadPosition >= beatsPerLane ? 1 : 0;
  const playheadLeftInLane = (playheadPosition % beatsPerLane) * beatWidth;

  const renderGrid = (height: number) => (
    <div className="absolute inset-0" style={{ left: `${TRACK_PADDING}px`, right: `${TRACK_PADDING}px`, height: `${height}px` }}>
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

  const renderSequencerLane = (laneIndex: 0 | 1) => {
    const barOffset = laneIndex * 4;
    return (
      <div className='relative bg-gray-800'>
        <div className="relative flex items-center">
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
            ref={laneIndex === 0 ? containerRef : null}
            data-lane={laneIndex}
            className="relative w-full bg-gray-900/50"
            style={{ height: `${CHORD_TRACK_HEIGHT}px` }}
            onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}
            onClick={handleTrackClick}
            title={`SEQUENCER:\nDrag chords here, or click to position the playhead.`}
        >
            {renderGrid(CHORD_TRACK_HEIGHT)}
            {sequence.filter(c => Math.floor(c.start / stepsPerLane) === laneIndex).map(chord => {
              const isDraggingThisChord = draggingState?.id === chord.id;
              const displayChord = isDraggingThisChord
                  ? { ...chord, start: draggingState!.start, duration: draggingState!.duration }
                  : chord;

              return (
                <ChordBlock 
                  key={chord.id} 
                  chord={displayChord} 
                  stepWidth={stepWidth} 
                  stepsPerLane={stepsPerLane}
                  onRemove={onRemoveChord} 
                  onDoubleClick={onChordDoubleClick} 
                  onPlayChord={onPlayChord}
                  onChordSelect={onChordSelect}
                  onChordMouseUp={onChordMouseUp} 
                  playingChordId={playingChordId} 
                  isSelected={selectedChordIds.has(chord.id)}
                  isClickMuted={isClickMuted}
                  onDragStart={handleDragStart}
                />
              );
            })}
            {dragOverStep !== null && Math.floor(dragOverStep / stepsPerLane) === laneIndex && (
              <div className="absolute bg-indigo-500/30 rounded-[3px] pointer-events-none" style={{ left: `${(dragOverStep % stepsPerLane) * stepWidth + TRACK_PADDING}px`, width: `${DEFAULT_CHORD_DURATION * stepWidth}px`, height: `${CHORD_BLOCK_HEIGHT}px`, bottom: `${TRACK_VERTICAL_PADDING}px` }}/>
            )}
        </div>
         {/* Bass Track or Spacer */}
         {hasBass ? (
            <div
                data-lane={laneIndex}
                className="relative w-full bg-gray-900/50"
                style={{ height: `${BASS_TRACK_HEIGHT}px` }}
                onClick={handleTrackClick}
            >
                {renderGrid(BASS_TRACK_HEIGHT)}
                {bassSequence.filter(n => Math.floor(n.start / stepsPerLane) === laneIndex).map(note => (
                    <BassBlock
                        key={note.id}
                        note={note}
                        stepWidth={stepWidth}
                        stepsPerLane={stepsPerLane}
                        isPlaying={note.id === playingBassNoteId}
                    />
                ))}
            </div>
         ) : (
            <div className="h-[24px] bg-gray-900" />
         )}

         {playheadLane === laneIndex && stepWidth > 0 && playheadLeftInLane <= gridWidth && (
              <Playhead position={playheadLeftInLane} trackPadding={TRACK_PADDING} height={playheadHeight} top={RULER_HEIGHT} />
        )}
      </div>
    );
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || target.classList.contains('relative')) {
        onDeselect();
    }
  };

  return (
    <div className="w-full flex flex-col min-w-[600px]" onClick={handleContainerClick}>
      <div className="relative">
        <React.Fragment key="lane-0">
          {renderSequencerLane(0)}
        </React.Fragment>

        {is8BarMode && (
          <React.Fragment key="lane-1">
            {renderSequencerLane(1)}
          </React.Fragment>
        )}

        {sequence.length === 0 && dragOverStep === null && (
          <div className="absolute top-1/2 -translate-y-1/2 text-gray-600 font-semibold pointer-events-none" style={{left: barWidth / 2 + 16, transform: 'translate(-50%, -50%)', top: '65px' }}>
            Drag a chord from the side panel to start
          </div>
        )}
      </div>
    </div>
  );
};