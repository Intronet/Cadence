import React, { useRef, useImperativeHandle, forwardRef } from 'react';

// --- Note Definitions (for internal calculations) ---
const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_TO_INDEX: { [note: string]: number } = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
};

// --- Keyboard Layout Data ---
const generatePianoKeys = () => {
  const keys = [];
  const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const blackKeyNotes = ['C#', 'D#', 'F#', 'G#', 'A#'];

  // Start with A0, A#0, B0
  for (let i = 9; i < 12; i++) {
    const note = allNotes[i];
    keys.push({
      note,
      octave: 0,
      type: blackKeyNotes.includes(note) ? 'black' : 'white',
    });
  }

  // Octaves 1 through 7
  for (let octave = 1; octave <= 7; octave++) {
    for (const note of allNotes) {
      keys.push({
        note,
        octave,
        type: blackKeyNotes.includes(note) ? 'black' : 'white',
      });
    }
  }

  // End with C8
  keys.push({
    note: 'C',
    octave: 8,
    type: 'white',
  });

  return keys;
};

const PIANO_KEYS = generatePianoKeys();

interface PianoProps {
  highlightedNotes: Map<string, string>;
  pressedNotes: Map<string, string>;
  onKeyMouseDown: (note: string) => void;
  onKeyMouseEnter: (note: string) => void;
  onKeyMouseLeave: () => void;
  onPianoMouseLeave: () => void;
}

export interface PianoHandle {
  scrollToNote: (note: string) => void;
}

export const Piano = forwardRef<PianoHandle, PianoProps>(({ highlightedNotes, pressedNotes, onKeyMouseDown, onKeyMouseEnter, onKeyMouseLeave, onPianoMouseLeave }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const whiteKeys = PIANO_KEYS.filter(key => key.type === 'white');
  const blackKeys = PIANO_KEYS.filter(key => key.type === 'black');

  useImperativeHandle(ref, () => ({
    scrollToNote: (note: string) => {
      if (scrollContainerRef.current) {
        const keyElement = scrollContainerRef.current.querySelector(`[data-note-name="${note}"]`);
        if (keyElement) {
          keyElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      }
    }
  }));

  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    onPianoMouseLeave(); // Stop any active sound/highlight when scrolling starts
    e.currentTarget.scrollLeft += e.deltaY;
  };
  
  const getHighlightClasses = (colorClass: string | undefined, type: 'white' | 'black') => {
      if (!colorClass) {
          return type === 'white' ? 'bg-gray-100 border-gray-800' : 'bg-gray-800 border-gray-900';
      }
      if (colorClass === 'bg-indigo-300') {
          return 'bg-indigo-300 border-indigo-500';
      }
      if (colorClass === 'bg-[#a5d1fe]') {
          return 'bg-[#a5d1fe] border-[#60a5fa]';
      }
      return type === 'white' ? 'bg-gray-100 border-gray-800' : 'bg-gray-800 border-gray-900';
  }

  return (
    <div className="w-full">
       <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto overflow-y-hidden rounded-[4px] shadow-lg border border-gray-800"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#4f46e5 #374151' }}
        onWheel={handleWheelScroll}
      >
        <div 
          className="relative h-32 flex" 
          style={{ width: `${whiteKeys.length * 2.5}rem`, minWidth: '100%' }}
          onMouseLeave={onPianoMouseLeave}
        >
          {whiteKeys.map((key) => {
            const noteName = `${key.note}${key.octave}`;
            const isHighlighted = highlightedNotes.has(noteName);
            const isPressed = pressedNotes.has(noteName);
            const colorClass = highlightedNotes.get(noteName);
            
            return (
              <button
                key={noteName}
                data-note-name={noteName}
                onMouseDown={(e) => { if (e.button === 0) onKeyMouseDown(noteName); }}
                onMouseEnter={() => onKeyMouseEnter(noteName)}
                onMouseLeave={onKeyMouseLeave}
                className={`relative flex-1 border-r rounded-b-[4px] text-gray-800 flex items-end justify-center pb-2 font-semibold select-none transition-all duration-75
                  ${isHighlighted ? getHighlightClasses(colorClass, 'white') : 'bg-gray-100 border-gray-800'}
                  ${isPressed ? 'transform translate-y-px shadow-inner-strong' : 'shadow-md'}
                `}
                aria-label={`Play note ${noteName}`}
              >
              <span className={`${key.note === 'C' ? 'font-bold text-purple-700' : 'text-gray-700'}`}>
                  {key.note === 'C' ? `${key.note}${key.octave}` : key.note}
                </span>
              </button>
            );
          })}
          {blackKeys.map((key) => {
            const noteName = `${key.note}${key.octave}`;
            const isHighlighted = highlightedNotes.has(noteName);
            const isPressed = pressedNotes.has(noteName);
            const colorClass = highlightedNotes.get(noteName);

            const precedingWhiteNote = SHARP_NOTES[(NOTE_TO_INDEX[key.note] + 11) % 12];
            const whiteKeyIndex = whiteKeys.findIndex(wk => wk.note === precedingWhiteNote && wk.octave === key.octave);
            
            const whiteKeyWidth = 100 / whiteKeys.length;
            const blackKeyWidth = whiteKeyWidth * 0.55;
            const left = (whiteKeyIndex + 1) * whiteKeyWidth - (blackKeyWidth / 2);

            return (
              <button
                key={noteName}
                data-note-name={noteName}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    e.stopPropagation(); // Prevent white key underneath from firing
                    onKeyMouseDown(noteName);
                  }
                }}
                onMouseEnter={() => onKeyMouseEnter(noteName)}
                onMouseLeave={onKeyMouseLeave}
                style={{ left: `${left}%`, width: `${blackKeyWidth}%` }}
                className={`absolute top-0 h-20 rounded-b-[4px] border-2 z-10 select-none transition-all duration-75
                  ${isHighlighted ? getHighlightClasses(colorClass, 'black') : 'bg-gray-800 border-gray-900'}
                  ${isPressed ? 'h-[4.9rem] bg-gray-900' : ''}
                `}
                aria-label={`Play note ${noteName}`}
              />
            );
          })}
        </div>
      </div>
       <style>{`
          .shadow-inner-strong {
            box-shadow: inset 0 3px 6px 0 rgba(0, 0, 0, 0.3);
          }
          .overflow-x-auto::-webkit-scrollbar {
            height: 8px;
          }
          .overflow-x-auto::-webkit-scrollbar-track {
            background: #374151; /* gray-700 */
            border-radius: 4px;
          }
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: #4f46e5; /* indigo-600 */
            border-radius: 4px;
          }
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: #6366f1; /* indigo-500 */
          }
       `}</style>
    </div>
  );
});