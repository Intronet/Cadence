import React, { useState, useRef, useCallback, MouseEvent, useEffect, useMemo } from 'react';
import { SequenceChord } from '../types';
import * as Tone from 'tone';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';

interface SequencerProps {
  sequence: SequenceChord[];
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
  selectedChordIds: Set<string>;
  bars: 4 | 8;
  onSeek: (positionInBeats: number) => void;
  isClickMuted: boolean;
  onMuteToggle: () => void;
}

const DEFAULT_CHORD_DURATION = 8; // A half note (8 * 16th steps)
const TRACK_PADDING = 4; // horizontal padding in px
const RULER_HEIGHT = 24; // Corresponds to h-6 in tailwind
const CHORD_BLOCK_HEIGHT = 68; // 10px taller
const TRACK_VERTICAL_PADDING = 4; // Reduced padding for more chord height

// A pure component for the playhead to help with rendering consistency.
const Playhead: React.FC<{ position: number; trackPadding: number }> = React.memo(({ position, trackPadding }) => (
    <div
        className="absolute top-0 w-0.5 bg-red-500 z-20 pointer-events-none"
        style={{
            left: `${position + trackPadding}px`,
            height: `100%`,
        }}
    />
));
Playhead.displayName = 'Playhead';

// --- ChordBlock Component ---
interface ChordBlockProps {
  chord: SequenceChord;
  stepWidth: number;
  onUpdate: (id: string, newProps: Partial<SequenceChord>) => void;
  onRemove: (id: string) => void;
  onDoubleClick: (chord: SequenceChord) => void;
  onPlayChord: (chordName: string) => void;
  onChordSelect: (id: string, e: MouseEvent<HTMLDivElement>) => void;
  onChordMouseUp: () => void;
  playingChordId: string | null;
  isSelected: boolean;
  bars: 4 | 8;
  isOverlappingOnTop: boolean;
  isClickMuted: boolean;
}

const ChordBlock: React.FC<ChordBlockProps> = ({ 
  chord, stepWidth, onUpdate, onRemove, onDoubleClick, onPlayChord, onChordSelect, onChordMouseUp, 
  playingChordId, isSelected, bars, isOverlappingOnTop, isClickMuted 
}) => {
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
    
    onChordSelect(chord.id, e);
    if (!isClickMuted) {
      onPlayChord(chord.chordName);
    }

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
            if (!isPrecise) {
                const widthInSteps = Math.max(1, Math.round(newWidthPx / stepWidth));
                newWidthPx = widthInSteps * stepWidth;
            }

            const clampedWidth = Math.max(stepWidth, newWidthPx);
            const maxDurationPx = (TOTAL_STEPS - chord.start) * stepWidth;
            setVisualDragState({ left: dragStateRef.current.originalStartPx, width: Math.min(clampedWidth, maxDurationPx) });

        } else { // Moving
            let newLeftPx = dragStateRef.current.originalStartPx + dx;
            if (!isPrecise) {
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
          const isPrecise = upEvent.ctrlKey;
          const laneBaseStep = Math.floor(chord.start / 64) * 64;
          const finalDx = upEvent.clientX - dragStateRef.current.startX;

          if (dragStateRef.current.isResizing) {
              const newWidthPx = Math.max(stepWidth, dragStateRef.current.originalWidthPx + finalDx);
              let newDuration: number;
              if (isPrecise) {
                  newDuration = newWidthPx / stepWidth;
              } else {
                  newDuration = Math.round(newWidthPx / stepWidth);
              }
              
              newDuration = Math.max(1, Math.min(TOTAL_STEPS - chord.start, newDuration));
              if (newDuration !== chord.duration) {
                  onUpdate(chord.id, { duration: newDuration });
              }
          } else { // Moving
              const newLeftPx = dragStateRef.current.originalStartPx + finalDx;
              let newStartSteps: number;
              if (isPrecise) {
                  newStartSteps = newLeftPx / stepWidth;
              } else {
                  newStartSteps = Math.round(newLeftPx / stepWidth);
              }
              
              newStartSteps = Math.max(0, Math.min(64 - chord.duration, newStartSteps));
              const finalStart = laneBaseStep + newStartSteps;

              if (finalStart !== chord.start) {
                  onUpdate(chord.id, { start: finalStart });
              }
          }
      }
      
      dragStateRef.current = null;
      setVisualDragState(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
}, [chord, stepWidth, onUpdate, onPlayChord, onChordSelect, onChordMouseUp, TOTAL_STEPS, isClickMuted]);

  const startInLanePx = (chord.start % 64) * stepWidth;
  const widthPx = chord.duration * stepWidth;

  return (
    <div
      data-has-context-menu="true"
      className={`absolute rounded-md flex items-center justify-center text-white text-xs font-medium select-none shadow-lg transition-all duration-150 z-10 chord-block border
        ${isSelected ? 'bg-indigo-500 border-yellow-400' : 'bg-indigo-600 border-indigo-400'}
        ${isCurrentlyPlaying ? 'ring-2 ring-sky-400' : ''}
        ${isOverlappingOnTop ? 'opacity-60' : ''}
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
      onDoubleClick={() => onDoubleClick(chord)}
      title={`${chord.chordName}\nDrag to move (snaps to grid).\nDrag edge to resize (snaps to grid).\nHold Ctrl for precise control.\nDouble-click to edit. Delete to remove.`}
    >
      <span className="truncate px-2 pointer-events-none">{chord.chordName}</span>
      <div className={`resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize`} />
    </div>
  );
};


// --- Sequencer Component ---
export const Sequencer: React.FC<SequencerProps> = ({
  sequence, onAddChord, onUpdateChord, onRemoveChord, onChordDoubleClick,
  onPlayChord, onChordSelect, onDeselect, onChordMouseUp, playheadPosition, 
  playingChordId, selectedChordIds, bars, onSeek, isClickMuted, onMuteToggle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOverStep, setDragOverStep] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const is8BarMode = bars === 8;
  const BAR_COUNT = bars;
  const BEAT_COUNT = BAR_COUNT * 4;
  const SUBDIVISION = 4;
  const TOTAL_STEPS = BEAT_COUNT * SUBDIVISION;

  const sequenceWithOverlapInfo = useMemo(() => {
    return sequence.map((chord, i, allChords) => {
        let isOverlappingOnTop = false;
        for (let j = 0; j < allChords.length; j++) {
            if (i === j) continue;
            const otherChord = allChords[j];
            const overlaps = (chord.start < otherChord.start + otherChord.duration) && (otherChord.start < chord.start + chord.duration);
            // This chord is on top if it comes later in the array and overlaps
            if (overlaps && j < i) {
                isOverlappingOnTop = true;
                break;
            }
        }
        return { ...chord, isOverlappingOnTop };
    });
  }, [sequence]);


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
    if (!(e.target as HTMLElement).closest('.chord-block')) {
      onDeselect();
    }
    if (stepWidth <= 0 || (e.target as HTMLElement).closest('.chord-block')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;
    const lane = Number(e.currentTarget.dataset.lane) || 0;
    
    const positionInSteps = (lane * 64) + (x / stepWidth);
    const positionInBeats = positionInSteps / SUBDIVISION;
    
    onSeek(Math.max(0, Math.min(BEAT_COUNT, positionInBeats)));
  }, [stepWidth, onSeek, BEAT_COUNT, onDeselect]);

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
      className="flex h-6 items-end cursor-default flex-grow"
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

  const renderSequencerLane = (laneIndex: 0 | 1) => {
    const barOffset = laneIndex * 4;
    return (
      <>
        <div className="relative flex items-center">
            {renderRuler(barOffset)}
            {laneIndex === 0 && (
                <button
                    onClick={onMuteToggle}
                    title={isClickMuted ? "Unmute chord click" : "Mute chord click"}
                    className="absolute -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    style={{ right: '1px', top: 'calc(50% - 5px)' }}
                >
                    {isClickMuted ? <SpeakerOffIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                </button>
            )}
        </div>
        <div 
            ref={laneIndex === 0 ? containerRef : null}
            data-lane={laneIndex}
            className="relative w-full bg-gray-900/50"
            style={{ height: '82px' }}
            onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}
            onClick={handleTrackClick}
            title="Sequencer track. Drag chords here, or click to position the playhead."
        >
            {renderGrid(barOffset)}
            {sequenceWithOverlapInfo.filter(c => Math.floor(c.start / 64) === laneIndex).map(chord => (
              <ChordBlock 
                key={chord.id} 
                chord={chord} 
                stepWidth={stepWidth} 
                onUpdate={onUpdateChord} 
                onRemove={onRemoveChord} 
                onDoubleClick={onChordDoubleClick} 
                onPlayChord={onPlayChord}
                onChordSelect={onChordSelect}
                onChordMouseUp={onChordMouseUp} 
                playingChordId={playingChordId} 
                isSelected={selectedChordIds.has(chord.id)}
                bars={bars} 
                isOverlappingOnTop={chord.isOverlappingOnTop}
                isClickMuted={isClickMuted}
              />
            ))}
            {dragOverStep !== null && Math.floor(dragOverStep / 64) === laneIndex && (
              <div className="absolute bg-indigo-500/30 rounded pointer-events-none" style={{ left: `${(dragOverStep % 64) * stepWidth + TRACK_PADDING}px`, width: `${DEFAULT_CHORD_DURATION * stepWidth}px`, height: `${CHORD_BLOCK_HEIGHT}px`, bottom: `${TRACK_VERTICAL_PADDING}px` }}/>
            )}
            {playheadLane === laneIndex && stepWidth > 0 && playheadLeftInLane <= gridWidth && (
              <Playhead position={playheadLeftInLane} trackPadding={TRACK_PADDING} />
            )}
        </div>
      </>
    );
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // This handles clicks on the component's outer padding.
    // Clicks on the track/ruler are handled by handleTrackClick.
    if (e.target === e.currentTarget) {
      onDeselect();
    }
  };

  return (
    <div className="w-full flex flex-col p-2 min-w-[600px] relative" onClick={handleContainerClick}>
      <React.Fragment key="lane-0">
        {renderSequencerLane(0)}
      </React.Fragment>

      {is8BarMode && (
        <React.Fragment key="lane-1">
          {renderSequencerLane(1)}
        </React.Fragment>
      )}

      {sequence.length === 0 && dragOverStep === null && (
         <div className="absolute top-1/2 -translate-y-1/2 text-gray-600 font-semibold pointer-events-none" style={{left: barWidth / 2 + 16, transform: 'translate(-50%, -50%)' }}>
           Drag a chord from the side panel to start
         </div>
      )}
    </div>
  );
};