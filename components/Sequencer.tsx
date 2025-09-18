import React, { useState, useRef, useCallback, MouseEvent, useEffect } from 'react';
import { SequenceChord } from '../types';
import * as Tone from 'tone';

interface SequencerProps {
  sequence: SequenceChord[];
  onAddChord: (chordName: string, start: number) => void;
  onUpdateChord: (id: string, newProps: Partial<SequenceChord>) => void;
  onRemoveChord: (id: string) => void;
  onChordDoubleClick: (chord: SequenceChord) => void;
  onChordMouseDown: (chordName: string) => void;
  onChordMouseUp: () => void;
  playheadPosition: number; // in beats
  playingChordId: string | null;
  bars: 4 | 8;
  onSeek: (positionInBeats: number) => void;
}

const DEFAULT_CHORD_DURATION = 8; // A half note (8 * 16th steps)
const TRACK_PADDING = 4; // horizontal padding in px
const RULER_HEIGHT = 24; // Corresponds to h-6 in tailwind
const CHORD_BLOCK_HEIGHT = 68; // 10px taller
const TRACK_VERTICAL_PADDING = 4; // Reduced padding for more chord height

// --- ChordBlock Component ---
interface ChordBlockProps {
  chord: SequenceChord;
  stepWidth: number;
  onUpdate: (id: string, newProps: Partial<SequenceChord>) => void;
  onRemove: (id: string) => void;
  onDoubleClick: (chord: SequenceChord) => void;
  onChordMouseDown: (chordName: string) => void;
  onChordMouseUp: () => void;
  playingChordId: string | null;
  bars: 4 | 8;
}

const ChordBlock: React.FC<ChordBlockProps> = ({ chord, stepWidth, onUpdate, onRemove, onDoubleClick, onChordMouseDown, onChordMouseUp, playingChordId, bars }) => {
  const [visualDragState, setVisualDragState] = useState<{ left: number, width: number } | null>(null);
  
  const dragStateRef = useRef<{
    isResizing: boolean;
    startX: number;
    originalStartPx: number;
    originalWidthPx: number;
  } | null>(null);

  const isCurrentlyPlaying = chord.id === playingChordId;
  const TOTAL_STEPS = bars * 16;

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only for left-click.

    onChordMouseDown(chord.chordName); // Play sound on click down
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    const isResizeHandle = target.classList.contains('resize-handle');
    
    dragStateRef.current = {
      isResizing: isResizeHandle,
      startX: e.clientX,
      originalStartPx: (chord.start % 64) * stepWidth,
      originalWidthPx: chord.duration * stepWidth,
    };

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      if (!dragStateRef.current || stepWidth === 0) return;
      moveEvent.preventDefault();

      const isPrecise = moveEvent.ctrlKey;
      const dx = moveEvent.clientX - dragStateRef.current.startX;
      
      if (dragStateRef.current.isResizing) {
        let newWidthPx = dragStateRef.current.originalWidthPx + dx;
        if (!isPrecise) { // Default: snap during drag
            const widthInSteps = Math.max(1, Math.round(newWidthPx / stepWidth));
            newWidthPx = widthInSteps * stepWidth;
        }
        const clampedWidth = Math.max(stepWidth, newWidthPx);
        const maxDurationPx = (TOTAL_STEPS - chord.start) * stepWidth;
        setVisualDragState({ left: dragStateRef.current.originalStartPx, width: Math.min(clampedWidth, maxDurationPx) });
      } else { // Moving
        let newLeftPx = dragStateRef.current.originalStartPx + dx;
        if (!isPrecise) { // Default: snap during drag
            const leftInSteps = Math.round(newLeftPx / stepWidth);
            newLeftPx = leftInSteps * stepWidth;
        }
        const maxStartPx = (64 - chord.duration) * stepWidth;
        setVisualDragState({ left: Math.max(0, Math.min(newLeftPx, maxStartPx)), width: dragStateRef.current.originalWidthPx });
      }
    };

    const handleMouseUp = (upEvent: globalThis.MouseEvent) => {
      onChordMouseUp(); // Stop sound on mouse up

      if (dragStateRef.current && stepWidth > 0) {
          const isPreciseOnRelease = upEvent.ctrlKey;
          const laneBaseStep = Math.floor(chord.start / 64) * 64;
          const finalDx = upEvent.clientX - dragStateRef.current.startX;

          if (dragStateRef.current.isResizing) {
              const newWidthPx = Math.max(stepWidth, dragStateRef.current.originalWidthPx + finalDx);
              let newDuration = isPreciseOnRelease
                ? newWidthPx / stepWidth
                : Math.round(newWidthPx / stepWidth);
                
              newDuration = Math.max(1, Math.min(TOTAL_STEPS - chord.start, newDuration));
              if (newDuration !== chord.duration) {
                  onUpdate(chord.id, { duration: newDuration });
              }
          } else { // Moving
              const newLeftPx = dragStateRef.current.originalStartPx + finalDx;
              let newStartSteps = isPreciseOnRelease
                ? newLeftPx / stepWidth
                : Math.round(newLeftPx / stepWidth);
                
              newStartSteps = Math.max(0, Math.min(64 - (isPreciseOnRelease ? chord.duration : Math.round(chord.duration)), newStartSteps));
              const finalStart = laneBaseStep + newStartSteps;

              if (finalStart !== chord.start) {
                  onUpdate(chord.id, { start: finalStart });
              }
          }
      }
      
      dragStateRef.current = null;
      setVisualDragState(null);
      window.removeEventListener('mousemove', handleMouseMove);
// FIX: Correctly remove the 'mouseup' event listener to finalize the drag operation.
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
}, [chord.id, chord.start, chord.duration, stepWidth, onUpdate, onChordMouseDown, onChordMouseUp, chord.chordName, TOTAL_STEPS]);

  const startInLanePx = (chord.start % 64) * stepWidth;
  const widthPx = chord.duration * stepWidth;

  return (
    <div
      data-has-context-menu="true"
      className={`absolute rounded-md flex items-center justify-center text-white text-xs font-medium select-none shadow-lg transition-colors duration-150 z-10 chord-block
        bg-indigo-600 border border-indigo-400
        ${isCurrentlyPlaying ? 'ring-2 ring-sky-400' : ''}
        cursor-grab active:cursor-grabbing
      `}
      style={{
        bottom: `${TRACK_VERTICAL_PADDING}px`,
        left: `${(visualDragState?.left ?? startInLanePx) + TRACK_PADDING}px`,
        width: `${visualDragState?.width ?? widthPx}px`,
        height: `${CHORD_BLOCK_HEIGHT}px`,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => { if (!e.ctrlKey) { e.preventDefault(); onRemove(chord.id); } }}
      onDoubleClick={() => onDoubleClick(chord)}
      title={`${chord.chordName}\nDrag to move. Drag right edge to resize.\nHold CTRL for precise control.\nRight-click to delete.\nDouble-click to edit.`}
    >
      <span className="truncate px-2 pointer-events-none">{chord.chordName}</span>
      <div className={`resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize`} />
    </div>
  );
};


// --- Sequencer Component ---
export const Sequencer: React.FC<SequencerProps> = ({
  sequence, onAddChord, onUpdateChord, onRemoveChord, onChordDoubleClick,
  onChordMouseDown, onChordMouseUp, playheadPosition, playingChordId, bars, onSeek
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOverStep, setDragOverStep] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const is8BarMode = bars === 8;
  const BAR_COUNT = bars;
  const BEAT_COUNT = BAR_COUNT * 4;
  const SUBDIVISION = 4;
  const TOTAL_STEPS = BEAT_COUNT * SUBDIVISION;

  useEffect(() => {
    const calculateWidth = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    calculateWidth();
    const resizeObserver = new ResizeObserver(calculateWidth);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const gridWidth = containerWidth > 0 ? containerWidth - (TRACK_PADDING * 2) : 0;
  const stepWidth = gridWidth / 64; // Each lane is 4 bars (64 steps)
  const beatWidth = stepWidth * SUBDIVISION;
  const barWidth = beatWidth * 4;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (stepWidth === 0) return;
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;

    const stepInLane = Math.floor(x / stepWidth);
    const lane = Number(target.dataset.lane) || 0;
    const baseStep = lane * 64;
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
    if (stepWidth <= 0 || (e.target as HTMLElement).closest('.chord-block')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;
    const lane = Number(e.currentTarget.dataset.lane) || 0;
    
    const positionInSteps = (lane * 64) + (x / stepWidth);
    const positionInBeats = positionInSteps / SUBDIVISION;
    
    onSeek(Math.max(0, Math.min(BEAT_COUNT, positionInBeats)));
  }, [stepWidth, onSeek, BEAT_COUNT]);

  const playheadLane = is8BarMode && playheadPosition >= 16 ? 1 : 0;
  const playheadLeftInLane = (playheadPosition % 16) * beatWidth;

  const renderGrid = (barOffset = 0) => (
    <div className="absolute inset-0" style={{ left: `${TRACK_PADDING}px`, right: `${TRACK_PADDING}px` }}>
       {Array.from({ length: 64 }).map((_, i) => {
          const isBeat = i % 4 === 0;
          let borderColorClass = i % 16 === 0 ? 'border-gray-600' : isBeat ? 'border-gray-700' : 'border-gray-800';
          return <div key={`sub-${i}`} className={`absolute top-0 bottom-0 border-l ${borderColorClass}`} style={{ left: `${i * stepWidth}px` }} />;
        })}
       {Array.from({ length: 5 }).map((_, i) => (
          <div key={`barline-${i}`} className="absolute top-0 bottom-0 border-l-2 border-gray-500" style={{ left: `${i * barWidth}px` }}/>
        ))}
    </div>
  );

  const renderRuler = (barOffset = 0) => (
    <div 
      className="flex h-6 items-end cursor-default"
      style={{ paddingLeft: `${TRACK_PADDING}px`, paddingRight: `${TRACK_PADDING}px` }}
      onClick={handleTrackClick}
      data-lane={barOffset > 0 ? 1 : 0}
      title="Click to position playhead"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`bar-${i}`} style={{ width: `${barWidth}px` }} className="text-xs text-gray-500 border-l border-gray-600 pl-1">
          {i + 1 + barOffset}
        </div>
      ))}
    </div>
  );
  
  const renderPlayhead = () => (
    stepWidth > 0 && playheadLeftInLane <= gridWidth ? (
      <div className="absolute top-0 w-0.5 bg-red-500 z-20 pointer-events-none"
        style={{
          left: `${playheadLeftInLane + TRACK_PADDING}px`,
          height: `100%`,
        }}
      />
    ) : null
  );

  return (
    <div className="w-full flex flex-col p-2 min-w-[600px] relative">
      {renderRuler(0)}
      <div 
        ref={containerRef}
        data-lane={0}
        className="relative w-full bg-gray-900/50"
        style={{ height: '82px' }}
        onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}
        onClick={handleTrackClick}
        title="Sequencer track. Drag chords here, or click to position the playhead."
      >
        {renderGrid(0)}
        {sequence.filter(c => c.start < 64).map(chord => (
          <ChordBlock key={chord.id} chord={chord} stepWidth={stepWidth} onUpdate={onUpdateChord} onRemove={onRemoveChord} onDoubleClick={onChordDoubleClick} onChordMouseDown={onChordMouseDown} onChordMouseUp={onChordMouseUp} playingChordId={playingChordId} bars={bars} />
        ))}
        {dragOverStep !== null && dragOverStep < 64 && (
          <div className="absolute bg-indigo-500/30 rounded pointer-events-none" style={{ left: `${(dragOverStep % 64) * stepWidth + TRACK_PADDING}px`, width: `${DEFAULT_CHORD_DURATION * stepWidth}px`, height: `${CHORD_BLOCK_HEIGHT}px`, bottom: `${TRACK_VERTICAL_PADDING}px` }}/>
        )}
        {playheadLane === 0 && renderPlayhead()}
      </div>

      {is8BarMode && (
        <>
          {renderRuler(4)}
          <div 
            data-lane={1}
            className="relative w-full bg-gray-900/50" 
            style={{ height: '82px' }}
            onDragOver={handleDragOver} 
            onDrop={handleDrop} 
            onDragLeave={handleDragLeave}
            onClick={handleTrackClick}
            title="Sequencer track. Drag chords here, or click to position the playhead."
          >
            {renderGrid(4)}
            {sequence.filter(c => c.start >= 64).map(chord => (
              <ChordBlock key={chord.id} chord={chord} stepWidth={stepWidth} onUpdate={onUpdateChord} onRemove={onRemoveChord} onDoubleClick={onChordDoubleClick} onChordMouseDown={onChordMouseDown} onChordMouseUp={onChordMouseUp} playingChordId={playingChordId} bars={bars} />
            ))}
            {dragOverStep !== null && dragOverStep >= 64 && (
              <div className="absolute bg-indigo-500/30 rounded pointer-events-none" style={{ left: `${(dragOverStep % 64) * stepWidth + TRACK_PADDING}px`, width: `${DEFAULT_CHORD_DURATION * stepWidth}px`, height: `${CHORD_BLOCK_HEIGHT}px`, bottom: `${TRACK_VERTICAL_PADDING}px` }} />
            )}
            {playheadLane === 1 && renderPlayhead()}
          </div>
        </>
      )}

      {sequence.length === 0 && dragOverStep === null && (
         <div className="absolute top-1/2 -translate-y-1/2 text-gray-600 font-semibold pointer-events-none" style={{left: barWidth / 2 + 16, transform: 'translate(-50%, -50%)' }}>
           Drag a chord from the side panel to start
         </div>
      )}
    </div>
  );
};